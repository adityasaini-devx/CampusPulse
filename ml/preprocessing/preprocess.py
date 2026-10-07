"""CampusPulse preprocessing pipeline.

Creates the exact feature set used by the classification notebook, fits the
preprocessor and PCA on the training split, and saves both artifacts.
"""

import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.decomposition import PCA
from sklearn.impute import SimpleImputer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import MinMaxScaler, OneHotEncoder, OrdinalEncoder


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_PATH = PROJECT_ROOT / "data" / "processed" / "campuspulse_akgec_cleaned.csv"
MODEL_DIR = PROJECT_ROOT / "ml" / "models" / "classification"

TARGET = "priority"

FEATURES = [
    "complainant_type", "department", "year_of_study", "campus_zone",
    "building", "floor", "room_lab_no", "facility_type", "class_section",
    "issue_category", "issue_subcategory", "severity", "affected_users",
    "issue_duration_hours", "previous_similar_complaints",
    "complaints_last_7_days", "complaints_last_30_days", "recurrence_count",
    "equipment_age_years", "infrastructure_age_years", "connectivity_impact",
    "safety_risk", "academic_impact", "operational_impact",
    "estimated_repair_cost", "weather_condition", "submission_channel",
    "complaint_month", "complaint_dayofweek", "complaint_year",
    "complaint_hour", "is_weekend", "time_period",
    "total_recent_complaints", "complaint_growth", "impact_score",
    "duration_per_user", "repair_cost_per_user",
    "equipment_infrastructure_age_gap", "operational_pressure",
]


def load_data():
    return pd.read_csv(DATA_PATH)


def create_features(df):
    df = df.copy()

    df["complaint_date"] = pd.to_datetime(df["complaint_date"], errors="coerce")
    df["complaint_time"] = pd.to_datetime(
        df["complaint_time"].astype(str), errors="coerce"
    )

    df["complaint_month"] = df["complaint_date"].dt.month
    df["complaint_dayofweek"] = df["complaint_date"].dt.dayofweek
    df["complaint_year"] = df["complaint_date"].dt.year
    df["complaint_hour"] = df["complaint_time"].dt.hour
    df["is_weekend"] = (df["complaint_dayofweek"] >= 5).astype(int)

    df["time_period"] = pd.cut(
        df["complaint_hour"],
        bins=[-1, 5, 11, 17, 21, 24],
        labels=["Night", "Morning", "Afternoon", "Evening", "Late_Night"],
    )

    df["total_recent_complaints"] = (
        df["complaints_last_7_days"].fillna(0)
        + df["complaints_last_30_days"].fillna(0)
    )
    df["complaint_growth"] = (
        df["complaints_last_7_days"].fillna(0)
        / (df["complaints_last_30_days"].fillna(0) + 1)
    )
    df["impact_score"] = (
        df["affected_users"].fillna(0) * (1 + df["recurrence_count"].fillna(0))
    )
    df["duration_per_user"] = (
        df["issue_duration_hours"].fillna(0)
        / (df["affected_users"].fillna(0) + 1)
    )
    df["repair_cost_per_user"] = (
        df["estimated_repair_cost"].fillna(0)
        / (df["affected_users"].fillna(0) + 1)
    )
    df["equipment_infrastructure_age_gap"] = (
        df["infrastructure_age_years"].fillna(0)
        - df["equipment_age_years"].fillna(0)
    )
    df["operational_pressure"] = (
        df["complaints_last_7_days"].fillna(0)
        + df["recurrence_count"].fillna(0)
        + df["affected_users"].fillna(0) / 10
    )

    return df


def build_preprocessor(X_train):
    ordinal_cols = [
        "severity",
        "safety_risk",
        "academic_impact",
        "operational_impact",
        "floor",
    ]

    num_cols = X_train.select_dtypes(include=np.number).columns.tolist()
    num_cols = [col for col in num_cols if col not in ordinal_cols]

    cat_cols = X_train.select_dtypes(
        include=["object", "category"]
    ).columns.tolist()
    cat_cols = [col for col in cat_cols if col not in ordinal_cols]

    num_pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", MinMaxScaler()),
    ])

    cat_pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=True)),
    ])

    severity_order = ["Low", "Medium", "High", "Critical"]
    floor_order = ["Ground", "1", "2", "3", "4", "5"]
    ordinal_categories = [
        severity_order,
        severity_order,
        severity_order,
        severity_order,
        floor_order,
    ]

    ordinal_pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        (
            "encoder",
            OrdinalEncoder(
                categories=ordinal_categories,
                handle_unknown="use_encoded_value",
                unknown_value=-1,
            ),
        ),
        ("scaler", MinMaxScaler()),
    ])

    return ColumnTransformer([
        ("num", num_pipe, num_cols),
        ("ordinal", ordinal_pipe, ordinal_cols),
        ("cat", cat_pipe, cat_cols),
    ])


def main():
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    df = create_features(load_data())
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

    X = df[FEATURES].copy()
    y = df[TARGET].copy()

    X_train, _, y_train, _ = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    preprocessor = build_preprocessor(X_train)
    X_train_processed = preprocessor.fit_transform(X_train)

    X_train_dense = (
        X_train_processed.toarray()
        if hasattr(X_train_processed, "toarray")
        else X_train_processed
    )

    pca = PCA(n_components=0.95, svd_solver="full", random_state=42)
    X_train_pca = pca.fit_transform(X_train_dense)

    joblib.dump(preprocessor, MODEL_DIR / "campuspulse_preprocessor.pkl")
    joblib.dump(pca, MODEL_DIR / "campuspulse_pca.pkl")

    print(f"Training shape: {X_train.shape}")
    print(f"Encoded shape: {X_train_dense.shape}")
    print(f"PCA shape: {X_train_pca.shape}")
    print(f"Variance retained: {pca.explained_variance_ratio_.sum():.4f}")
    print(f"Saved artifacts to: {MODEL_DIR}")


if __name__ == "__main__":
    main()
