"""Predict complaint priority with the saved CampusPulse model."""

import sys
from pathlib import Path

import joblib
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parents[2]
MODEL_DIR = PROJECT_ROOT / "ml" / "models" / "classification"

sys.path.insert(0, str(PROJECT_ROOT))
from ml.preprocessing.preprocess import FEATURES, create_features  # noqa: E402


def _prepare_input(complaint):
    """Convert a complaint dict/DataFrame into the model's feature matrix."""
    if isinstance(complaint, dict):
        df = pd.DataFrame([complaint])
    elif isinstance(complaint, pd.DataFrame):
        df = complaint.copy()
    else:
        raise TypeError("complaint must be a dict or pandas DataFrame")

    df = create_features(df)

    # Match the training pipeline exactly.
    df = df.drop(
        columns=[
            "complaint_id",
            "complaint_date",
            "complaint_time",
            "complaint_status",
            "response_time_hours",
            "resolution_time_hours",
            "maintenance_team",
            "resolution_type",
            "actual_expenditure",
        ],
        errors="ignore",
    )

    missing = [feature for feature in FEATURES if feature not in df.columns]
    if missing:
        raise ValueError(
            "Missing required features: " + ", ".join(missing)
        )

    return df[FEATURES].copy()


def predict_priority(complaint):
    """Return predicted priority and class probabilities for a complaint."""
    preprocessor = joblib.load(MODEL_DIR / "campuspulse_preprocessor.pkl")
    pca = joblib.load(MODEL_DIR / "campuspulse_pca.pkl")
    model = joblib.load(MODEL_DIR / "final_priority_model.pkl")
    metadata = joblib.load(MODEL_DIR / "model_metadata.pkl")

    X = _prepare_input(complaint)
    X_processed = preprocessor.transform(X)
    X_dense = X_processed.toarray() if hasattr(X_processed, "toarray") else X_processed

    # Logistic Regression is the selected PCA-based model.
    if metadata["model"] == "Logistic Regression":
        X_model = pca.transform(X_dense)
    else:
        X_model = X_dense

    prediction = model.predict(X_model)[0]

    result = {
        "priority": prediction,
        "model": metadata["model"],
    }

    if hasattr(model, "predict_proba"):
        probabilities = model.predict_proba(X_model)[0]
        result["probabilities"] = dict(
            sorted(
                zip(model.classes_, probabilities),
                key=lambda item: item[1],
                reverse=True,
            )
        )

    return result


def main():
    # Example complaint. Replace values with a real complaint when integrating.
    sample_complaint = {
        "complainant_type": "Student",
        "department": "CSE",
        "year_of_study": "2",
        "campus_zone": "Academic",
        "building": "CSIT Building",
        "floor": "2",
        "room_lab_no": "CS-204",
        "facility_type": "Classroom",
        "class_section": "CS2",
        "issue_category": "Electrical",
        "issue_subcategory": "Power Failure",
        "severity": "High",
        "affected_users": 60,
        "issue_duration_hours": 5,
        "previous_similar_complaints": 2,
        "complaints_last_7_days": 3,
        "complaints_last_30_days": 7,
        "recurrence_count": 2,
        "equipment_age_years": 4,
        "infrastructure_age_years": 8,
        "connectivity_impact": "None",
        "safety_risk": "Medium",
        "academic_impact": "High",
        "operational_impact": "Medium",
        "estimated_repair_cost": 15000,
        "weather_condition": "Clear",
        "submission_channel": "Mobile App",
        "complaint_date": "2026-10-07",
        "complaint_time": "10:30:00",
    }

    result = predict_priority(sample_complaint)

    print(f"Predicted Priority: {result['priority']}")
    print(f"Model: {result['model']}")

    if "probabilities" in result:
        print("\nClass probabilities:")
        for label, probability in result["probabilities"].items():
            print(f"  {label}: {probability:.4f}")


if __name__ == "__main__":
    main()
