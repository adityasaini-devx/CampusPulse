"""Train and evaluate CampusPulse priority classification models."""

import sys
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import RandomizedSearchCV, train_test_split
from sklearn.tree import DecisionTreeClassifier

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_PATH = PROJECT_ROOT / "data" / "processed" / "campuspulse_akgec_cleaned.csv"
MODEL_DIR = PROJECT_ROOT / "ml" / "models" / "classification"

sys.path.insert(0, str(PROJECT_ROOT))
from ml.preprocessing.preprocess import FEATURES, TARGET, create_features  # noqa: E402


RANDOM_STATE = 42


def load_dataset():
    df = create_features(pd.read_csv(DATA_PATH))

    drop_cols = [
        "complaint_id",
        "complaint_date",
        "complaint_time",
        "complaint_status",
        "response_time_hours",
        "resolution_time_hours",
        "maintenance_team",
        "resolution_type",
        "actual_expenditure",
    ]
    df = df.drop(columns=drop_cols, errors="ignore")

    return df[FEATURES].copy(), df[TARGET].copy()


def to_dense(matrix):
    return matrix.toarray() if hasattr(matrix, "toarray") else matrix


def evaluate_model(name, y_true, y_pred):
    return {
        "Model": name,
        "Accuracy": accuracy_score(y_true, y_pred),
        "Precision": precision_score(y_true, y_pred, average="weighted"),
        "Recall": recall_score(y_true, y_pred, average="weighted"),
        "F1": f1_score(y_true, y_pred, average="weighted"),
    }


def tune_models(X_train_dense, X_train_pca, y_train):
    searches = {
        "Logistic Regression": RandomizedSearchCV(
            LogisticRegression(max_iter=2000, random_state=RANDOM_STATE),
            param_distributions={
                "C": __import__("numpy").logspace(-3, 2, 10),
                "solver": ["lbfgs", "newton-cg"],
                "class_weight": ["balanced", None],
            },
            n_iter=10,
            cv=3,
            scoring="f1_weighted",
            n_jobs=-1,
            random_state=RANDOM_STATE,
            verbose=1,
        ),
        "Decision Tree": RandomizedSearchCV(
            DecisionTreeClassifier(random_state=RANDOM_STATE),
            param_distributions={
                "criterion": ["gini", "entropy", "log_loss"],
                "max_depth": [None, 8, 12, 16, 20, 25, 30],
                "min_samples_split": [2, 5, 10, 20],
                "min_samples_leaf": [1, 2, 4, 8],
                "max_features": [None, "sqrt", "log2"],
                "class_weight": ["balanced", None],
            },
            n_iter=15,
            cv=3,
            scoring="f1_weighted",
            n_jobs=-1,
            random_state=RANDOM_STATE,
            verbose=1,
        ),
        "Random Forest": RandomizedSearchCV(
            RandomForestClassifier(n_jobs=-1, random_state=RANDOM_STATE),
            param_distributions={
                "n_estimators": [200, 300, 400, 500, 600],
                "max_depth": [None, 15, 20, 25, 30],
                "min_samples_split": [2, 5, 10],
                "min_samples_leaf": [1, 2, 4],
                "max_features": ["sqrt", "log2", 0.5],
                "bootstrap": [True, False],
                "criterion": ["gini", "entropy"],
                "class_weight": ["balanced", "balanced_subsample"],
            },
            n_iter=15,
            cv=3,
            scoring="f1_weighted",
            n_jobs=-1,
            random_state=RANDOM_STATE,
            verbose=1,
        ),
    }

    results = {}

    for name, search in searches.items():
        if name == "Logistic Regression":
            search.fit(X_train_pca, y_train)
        else:
            search.fit(X_train_dense, y_train)

        results[name] = search
        print(f"\n{name}")
        print("Best parameters:", search.best_params_)
        print("Best CV weighted F1:", round(search.best_score_, 4))

    return results


def main():
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    X, y = load_dataset()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=RANDOM_STATE, stratify=y
    )

    preprocessor = joblib.load(MODEL_DIR / "campuspulse_preprocessor.pkl")
    pca = joblib.load(MODEL_DIR / "campuspulse_pca.pkl")

    X_train_processed = to_dense(preprocessor.transform(X_train))
    X_test_processed = to_dense(preprocessor.transform(X_test))

    X_train_pca = pca.transform(X_train_processed)
    X_test_pca = pca.transform(X_test_processed)

    print(f"Raw features: {X_train.shape[1]}")
    print(f"Encoded features: {X_train_processed.shape[1]}")
    print(f"PCA features: {X_train_pca.shape[1]}")

    searches = tune_models(X_train_processed, X_train_pca, y_train)

    predictions = {
        "Logistic Regression": searches["Logistic Regression"].best_estimator_.predict(X_test_pca),
        "Decision Tree": searches["Decision Tree"].best_estimator_.predict(X_test_processed),
        "Random Forest": searches["Random Forest"].best_estimator_.predict(X_test_processed),
    }

    results = pd.DataFrame(
        [evaluate_model(name, y_test, pred) for name, pred in predictions.items()]
    ).sort_values("F1", ascending=False).reset_index(drop=True)

    print("\nFinal tuned results:")
    print(results.to_string(index=False))

    best_name = results.iloc[0]["Model"]
    best_model = searches[best_name].best_estimator_

    print(f"\nSelected model: {best_name}")
    print("\nClassification report:")
    print(classification_report(y_test, predictions[best_name]))

    metadata = {
        "model": best_name,
        "metric": "weighted_f1",
        "f1_score": float(results.iloc[0]["F1"]),
        "accuracy": float(results.iloc[0]["Accuracy"]),
        "features": len(FEATURES),
        "encoded_features": int(X_train_processed.shape[1]),
        "pca_components": int(X_train_pca.shape[1]),
        "train_size": len(X_train),
        "test_size": len(X_test),
        "best_params": searches[best_name].best_params_,
    }

    joblib.dump(best_model, MODEL_DIR / "final_priority_model.pkl")
    joblib.dump(metadata, MODEL_DIR / "model_metadata.pkl")

    print("\nSaved:")
    print(MODEL_DIR / "final_priority_model.pkl")
    print(MODEL_DIR / "model_metadata.pkl")


if __name__ == "__main__":
    main()
