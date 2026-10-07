"""
CampusPulse preprocessing pipeline.

Loads the cleaned dataset, creates the same engineered features used by the
classification notebook, and saves the fitted preprocessor and PCA objects.
"""

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.decomposition import PCA
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import MinMaxScaler, OneHotEncoder, OrdinalEncoder


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_PATH = PROJECT_ROOT / "data" / "processed" / "campuspulse_akgec_cleaned.csv"
MODEL_DIR = PROJECT_ROOT / "ml" / "models" / "classification"


def load_data():
    """Load the cleaned CampusPulse dataset."""
    return pd.read_csv(DATA_PATH)


def create_features(df):
    """Create the feature set used by the classification pipeline."""
    df = df.copy()

    df["complaint_date"] = pd.to_datetime(df["complaint_date"], errors="coerce")
    df["complaint_time"] = pd.to_datetime(
        df["complaint_time"], errors="coerce"
    )

    df["complaint_month"] = df["complaint_date"].dt.month
    df["complaint_dayofweek"] = df["complaint_date"].dt.dayofweek
    df["complaint_year"] = df["complaint_date"].dt.year
    df["is_weekend"] = (df["complaint_dayofweek"] >= 5).astype(int)
    df["complaint_hour"] = df["complaint_time"].dt.hour

    df["time_period"] = pd.cut(
        df["complaint_hour"],
        bins=[-1, 5, 11, 17, 21, 24],
        labels=["Night", "Morning", "Afternoon", "Evening", "Late Night"],
    )

    df["total_recent_complaints"] = (
        df["complaints_last_7_days"].fillna(0)
        + df["complaints_last_30_days"].fillna(0)
    )

    df["complaint_growth"] = (
        df["complaints_last_7_days"]
        / df["complaints_last_30_days"].replace(0, np.nan)
    )

    df["impact_score"] = (
        df["affected_users"]
        * df["severity"].map(
            {"Low": 1, "Medium": 2, "High": 3, "Critical": 4}
        )
    )

    df["duration_per_user"] = (
        df["issue_duration_hours"]
        / df["affected_users"].replace(0, np.nan)
    )

    df["repair_cost_per_user"] = (
        df["estimated_repair_cost"]
        / df["affected_users"].replace(0, np.nan)
    )

    df["equipment_infrastructure_age_gap"] = (
        df["equipment_age_years"] - df["infrastructure_age_years"]
    )

    df["operational_pressure"] = (
        df["affected_users"] * df["recurrence_count"]
    )

    return df


def build_preprocessor():
    """Build the preprocessing transformer used by the model."""
    numerical_features = [
        "affected_users",
        "issue_duration_hours",
        "previous_similar_complaints",
        "complaints_last_7_days",
        "complaints_last_30_days",
        "recurrence_count",
        "equipment_age_years",
        "infrastructure_age_years",
        "estimated_repair_cost",
        "complaint_month",
        "complaint_dayofweek",
        "complaint_year",
        "is_weekend",
        "complaint_hour",
        "total_recent_complaints",
        "complaint_growth",
        "impact_score",
        "duration_per_user",
        "repair_cost_per_user",
        "equipment_infrastructure_age_gap",
        "operational_pressure",
    ]

    categorical_features = [
        "complainant_type",
        "department",
        "campus_zone",
        "building",
        "room_lab_no",
        "facility_type",
        "class_section",
        "issue_category",
        "issue_subcategory",
        "weather_condition",
        "submission_channel",
        "time_period",
    ]

    ordinal_features = [
        "severity",
        "safety_risk",
        "academic_impact",
        "operational_impact",
        "floor",
    ]

    numerical_pipeline = Pipeline(
        [
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", MinMaxScaler()),
        ]
    )

    categorical_pipeline = Pipeline(
        [
            ("imputer", SimpleImputer(strategy="most_frequent")),
            (
                "onehot",
                OneHotEncoder(
                    handle_unknown="ignore",
                    sparse_output=True,
                ),
            ),
        ]
    )

    ordinal_pipeline = Pipeline(
        [
            ("imputer", SimpleImputer(strategy="most_frequent")),
            (
                "encoder",
                OrdinalEncoder(
                    handle_unknown="use_encoded_value",
                    unknown_value=-1,
                ),
            ),
            ("scaler", MinMaxScaler()),
        ]
    )

    return ColumnTransformer(
        [
            ("num", numerical_pipeline, numerical_features),
            ("cat", categorical_pipeline, categorical_features),
            ("ord", ordinal_pipeline, ordinal_features),
        ]
    )


def main():
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    df = create_features(load_data())

    leakage_columns = [
        "complaint_status",
        "response_time_hours",
        "resolution_time_hours",
        "maintenance_team",
        "resolution_type",
        "actual_expenditure",
    ]

    target = "priority"

    X = df.drop(
        columns=leakage_columns + [target, "complaint_id", "complaint_date", "complaint_time"]
    )

    preprocessor = build_preprocessor()
    X_transformed = preprocessor.fit_transform(X)

    # Keep the same 95% variance retention strategy as the notebook.
    pca = PCA(n_components=0.95)
    X_pca = pca.fit_transform(X_transformed)

    joblib.dump(preprocessor, MODEL_DIR / "campuspulse_preprocessor.pkl")
    joblib.dump(pca, MODEL_DIR / "campuspulse_pca.pkl")

    print(f"Input shape: {X.shape}")
    print(f"Encoded shape: {X_transformed.shape}")
    print(f"PCA shape: {X_pca.shape}")
    print(f"Variance retained: {pca.explained_variance_ratio_.sum():.4f}")
    print(f"Saved preprocessing artifacts to: {MODEL_DIR}")


if __name__ == "__main__":
    main()
