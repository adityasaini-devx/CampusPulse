from pathlib import Path
from datetime import datetime
import json
import joblib
import numpy as np
import pandas as pd

from fastapi import FastAPI, HTTPException
from api.schemas import (ComplaintRequest,SimpleComplaintRequest,ClusterComplaintRequest,MaintenanceIntelligenceRequest,)

PROJECT_ROOT = Path(__file__).resolve().parents[1]

MODEL_PATH = (PROJECT_ROOT/ "ml"/ "models"/ "classification"/ "priority_pipeline.pkl")

try:
    model_bundle = joblib.load(MODEL_PATH)
    preprocessor = model_bundle["preprocessor"]
    pca = model_bundle["pca"]
    model = model_bundle["model"]
    model_name = model_bundle["model_name"]
    model_features = model_bundle["features"]
    uses_pca = model_bundle.get("uses_pca", model_name == "Logistic Regression")
except Exception as e:
    raise RuntimeError(f"Failed to load classification model: {e}")

CLUSTERING_MODEL_PATH = (PROJECT_ROOT / "ml" / "models" / "clustering" / "kmeans_model.json")

try:
    with open(CLUSTERING_MODEL_PATH, "r", encoding="utf-8") as f:
        clustering_artifact = json.load(f)
except Exception as e:
    raise RuntimeError(f"Failed to load clustering model: {e}")

CLUSTERING_FEATURES = clustering_artifact["features"]
CLUSTER_NAMES = clustering_artifact["cluster_names"]
CLUSTER_DESCRIPTIONS = clustering_artifact["cluster_descriptions"]

SCALER_MEAN = np.asarray(clustering_artifact["scaler_mean"], dtype=float)
SCALER_SCALE = np.asarray(clustering_artifact["scaler_scale"], dtype=float)
PCA_MEAN = np.asarray(clustering_artifact["pca_mean"], dtype=float)
PCA_COMPONENTS = np.asarray(clustering_artifact["pca_components"], dtype=float)
CLUSTER_CENTERS = np.asarray(clustering_artifact["cluster_centers"], dtype=float)

HISTORY_PATH = (PROJECT_ROOT / "data" / "processed" / "campuspulse_akgec_processed.csv")

HISTORY_FEATURES = ["previous_similar_complaints","complaints_last_7_days","complaints_last_30_days","recurrence_count",]

HISTORY_MATCH_FIELDS = ["building","facility_type","issue_category","issue_subcategory",]

try:
    history_columns = HISTORY_MATCH_FIELDS + HISTORY_FEATURES
    complaint_history = pd.read_csv(HISTORY_PATH,usecols=history_columns,)

    for column in HISTORY_MATCH_FIELDS:
        complaint_history[column] = (
            complaint_history[column]
            .fillna("")
            .astype(str)
            .str.strip()
            .str.casefold()
        )

    complaint_history[HISTORY_FEATURES] = (
        complaint_history[HISTORY_FEATURES]
        .apply(pd.to_numeric, errors="coerce")
        .fillna(0)
    )
except Exception as e:
    raise RuntimeError(f"Failed to load complaint history: {e}")


def calculate_maintenance_score(
    predicted_priority: str,
    previous_similar_complaints: float,
    complaints_last_7_days: float,
    complaints_last_30_days: float,
    recurrence_count: float,
    affected_users: float,
) -> dict:
    priority_map = {"Low": 1, "Medium": 2, "High": 3, "Critical": 4}

    priority_score = priority_map[predicted_priority]
    similar_issue_history = (
        previous_similar_complaints
        + complaints_last_7_days
        + complaints_last_30_days
    )
    recurring_issue_signal = (recurrence_count + previous_similar_complaints)

    priority_norm = (priority_score - 1) / 3
    similar_norm = min(similar_issue_history / 30, 1.0)
    recurring_norm = min(recurring_issue_signal / 20, 1.0)
    affected_norm = min(affected_users / 5000, 1.0)

    score = (0.40 * priority_norm + 0.20 * similar_norm + 0.20 * recurring_norm + 0.20 * affected_norm)

    return {"score": round(float(score), 6),"priority_weight": 0.40,"pattern_weight": 0.20,
            "recurrence_weight": 0.20,"impact_weight": 0.20,}


def cluster_transform(X: pd.DataFrame) -> np.ndarray:
    values = X[CLUSTERING_FEATURES].to_numpy(dtype=float)
    scaled = (values - SCALER_MEAN) / SCALER_SCALE
    return (scaled - PCA_MEAN) @ PCA_COMPONENTS.T


app = FastAPI(title="CampusPulse ML API",
              description="Machine Learning API for priority prediction and complaint pattern detection",
              version="1.1.0",)


@app.get("/health")
def health_check():
    return {"status": "healthy","model": model_name,
            "model_loaded": True,"clustering_model_loaded": True,}


def engineer_features(request: ComplaintRequest) -> pd.DataFrame:
    complaint_datetime = datetime.combine(request.complaint_date,request.complaint_time,)

    complaint_hour = complaint_datetime.hour
    complaint_dayofweek = complaint_datetime.weekday()
    complaint_month = complaint_datetime.month
    complaint_year = complaint_datetime.year
    is_weekend = int(complaint_dayofweek >= 5)

    time_period = pd.cut(
        pd.Series([complaint_hour]),
        bins=[-1, 5, 11, 17, 21, 24],
        labels=["Night","Morning","Afternoon","Evening","Late_Night"],
        ).iloc[0]

    total_recent_complaints = (
        request.complaints_last_7_days
        + request.complaints_last_30_days
    )

    complaint_growth = (
        request.complaints_last_7_days
        / (request.complaints_last_30_days + 1)
    )

    impact_score = (
        request.affected_users
        * (1 + request.recurrence_count)
    )

    duration_per_user = (
        request.issue_duration_hours
        / (request.affected_users + 1)
    )

    repair_cost_per_user = (
        request.estimated_repair_cost
        / (request.affected_users + 1)
    )

    equipment_infrastructure_age_gap = (
        request.infrastructure_age_years
        - request.equipment_age_years
    )

    operational_pressure = (
        request.complaints_last_7_days
        + request.recurrence_count
        + request.affected_users / 10
    )

    data = {
        "complainant_type": request.complainant_type,
        "department": request.department,
        "year_of_study": request.year_of_study,
        "campus_zone": request.campus_zone,
        "building": request.building,
        "floor": request.floor,
        "room_lab_no": request.room_lab_no,
        "facility_type": request.facility_type,
        "class_section": request.class_section,
        "issue_category": request.issue_category,
        "issue_subcategory": request.issue_subcategory,
        "severity": request.severity,
        "affected_users": request.affected_users,
        "issue_duration_hours": request.issue_duration_hours,
        "previous_similar_complaints": request.previous_similar_complaints,
        "complaints_last_7_days": request.complaints_last_7_days,
        "complaints_last_30_days": request.complaints_last_30_days,
        "recurrence_count": request.recurrence_count,
        "equipment_age_years": request.equipment_age_years,
        "infrastructure_age_years": request.infrastructure_age_years,
        "connectivity_impact": request.connectivity_impact,
        "safety_risk": request.safety_risk,
        "academic_impact": request.academic_impact,
        "operational_impact": request.operational_impact,
        "estimated_repair_cost": request.estimated_repair_cost,
        "weather_condition": request.weather_condition,
        "submission_channel": request.submission_channel,
        "complaint_month": complaint_month,
        "complaint_dayofweek": complaint_dayofweek,
        "complaint_year": complaint_year,
        "complaint_hour": complaint_hour,
        "is_weekend": is_weekend,
        "time_period": time_period,
        "total_recent_complaints": total_recent_complaints,
        "complaint_growth": complaint_growth,
        "impact_score": impact_score,
        "duration_per_user": duration_per_user,
        "repair_cost_per_user": repair_cost_per_user,
        "equipment_infrastructure_age_gap": equipment_infrastructure_age_gap,
        "operational_pressure": operational_pressure,
    }

    return pd.DataFrame([data])[model_features]


@app.post("/predict-priority")
def predict_priority(request: ComplaintRequest):
    try:
        df = engineer_features(request)
        X_processed = preprocessor.transform(df)

        if hasattr(X_processed, "toarray"):
            X_processed = X_processed.toarray()

        X_model = pca.transform(X_processed) if uses_pca else X_processed
        prediction = model.predict(X_model)[0]
        probabilities = model.predict_proba(X_model)[0]

        probability_dict = {
            str(cls): round(float(prob), 6)
            for cls, prob in zip(model.classes_, probabilities)
        }

        return {"predicted_priority": str(prediction),"model": model_name,"probabilities": probability_dict,}

    except Exception as e:
        raise HTTPException(status_code=500,detail=f"Prediction failed: {str(e)}")


@app.post("/cluster-complaint")
def cluster_complaint(request: ClusterComplaintRequest):
    try:
        data = {
            feature: getattr(request, feature)
            for feature in CLUSTERING_FEATURES
        }

        X = pd.DataFrame([data]).fillna(0)
        X_pca = cluster_transform(X)

        distances = np.sum(
            (CLUSTER_CENTERS - X_pca) ** 2,
            axis=1,
        )

        cluster = int(np.argmin(distances))
        cluster_key = str(cluster)

        return {
            "cluster": cluster,
            "cluster_name": CLUSTER_NAMES[cluster_key],
            "description": CLUSTER_DESCRIPTIONS[cluster_key],
            "model": "K-Means",
            "k": 3,
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Clustering failed: {str(e)}",
        )


@app.post("/maintenance-intelligence")
def maintenance_intelligence(request: MaintenanceIntelligenceRequest):
    try:
        maintenance_result = calculate_maintenance_score(
            predicted_priority=request.predicted_priority,
            previous_similar_complaints=request.previous_similar_complaints,
            complaints_last_7_days=request.complaints_last_7_days,
            complaints_last_30_days=request.complaints_last_30_days,
            recurrence_count=request.recurrence_count,
            affected_users=request.affected_users,
        )

        return {
            "predicted_priority": request.predicted_priority,
            "ensemble": {
                "best_model": "XGBoost",
                "best_accuracy": 0.650625,
                "best_f1": 0.650905,
                "hard_voting_accuracy": 0.648775,
                "hard_voting_f1": 0.648855,
                "soft_voting_accuracy": 0.644525,
                "soft_voting_f1": 0.644589,
            },
            "cluster": {
                "cluster": request.cluster,
                "cluster_name": request.cluster_name,
                "description": request.cluster_description,
            },
            "signals": {
                "similar_issue_history": round(
                    request.previous_similar_complaints
                    + request.complaints_last_7_days
                    + request.complaints_last_30_days,
                    6,
                ),
                "recurring_issue_signal": round(
                    request.recurrence_count
                    + request.previous_similar_complaints,
                    6,
                ),
                "affected_user_impact": request.affected_users,
            },
            "maintenance_score": maintenance_result["score"],
            "weights": {
                "priority": maintenance_result["priority_weight"],
                "pattern": maintenance_result["pattern_weight"],
                "recurrence": maintenance_result["recurrence_weight"],
                "impact": maintenance_result["impact_weight"],
            },
        }

    except (KeyError, ValueError) as e:
        raise HTTPException(
            status_code=400,
            detail=f"Maintenance intelligence failed: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Maintenance intelligence failed: {str(e)}",
        )


def lookup_historical_context(request: SimpleComplaintRequest) -> dict:
    query = {
        field: str(getattr(request, field)).strip().casefold()
        for field in HISTORY_MATCH_FIELDS
    }

    aliases = {
        "building": {
            "csit": "csit block",
        },
        "issue_subcategory": {
            "fan not working": "fan failure",
        },
    }

    normalized_query = query.copy()

    for field, field_aliases in aliases.items():
        normalized_query[field] = field_aliases.get(
            normalized_query[field],
            normalized_query[field],
        )

    match_levels = [
        ["building", "issue_subcategory"],
        ["facility_type", "issue_subcategory"],
        ["issue_category", "issue_subcategory"],
        ["issue_subcategory"],
    ]

    matched = None
    match_level = "global"

    for fields in match_levels:
        mask = pd.Series(True, index=complaint_history.index)

        for field in fields:
            mask &= complaint_history[field].eq(normalized_query[field])

        candidate = complaint_history.loc[mask]

        if not candidate.empty:
            matched = candidate
            match_level = "+".join(fields)
            break

    if matched is None:
        matched = complaint_history

    averages = matched[HISTORY_FEATURES].mean()

    return {
        "previous_similar_complaints": float(
            averages["previous_similar_complaints"]
        ),
        "complaints_last_7_days": float(
            averages["complaints_last_7_days"]
        ),
        "complaints_last_30_days": float(
            averages["complaints_last_30_days"]
        ),
        "recurrence_count": float(
            averages["recurrence_count"]
        ),
        "history_match_level": match_level,
        "history_match_count": int(len(matched)),
    }


def resolve_backend_context(request: SimpleComplaintRequest) -> dict:
    historical = lookup_historical_context(request)

    return {
        "complainant_type": "Student",
        "department": "Unknown",
        "year_of_study": None,
        "campus_zone": "Unknown",
        "class_section": "Unknown",
        **historical,
        "equipment_age_years": 0,
        "infrastructure_age_years": 0,
        "connectivity_impact": "Low",
        "safety_risk": request.severity,
        "academic_impact": request.severity,
        "operational_impact": request.severity,
        "estimated_repair_cost": 0,
        "weather_condition": "Unknown",
        "submission_channel": "Web",
    }


@app.post("/complaints")
def submit_complaint(request: SimpleComplaintRequest):
    try:
        context = resolve_backend_context(request)
        now = datetime.now()

        full_request = ComplaintRequest(
            **context,
            building=request.building,
            floor=request.floor,
            room_lab_no=request.room_lab_no,
            facility_type=request.facility_type,
            issue_category=request.issue_category,
            issue_subcategory=request.issue_subcategory,
            severity=request.severity,
            affected_users=request.affected_users,
            issue_duration_hours=request.issue_duration_hours,
            complaint_date=now.date(),
            complaint_time=now.time(),
        )

        priority_result = predict_priority(full_request)

        cluster_request = ClusterComplaintRequest(
            affected_users=request.affected_users,
            issue_duration_hours=request.issue_duration_hours,
            previous_similar_complaints=context["previous_similar_complaints"],
            complaints_last_7_days=context["complaints_last_7_days"],
            complaints_last_30_days=context["complaints_last_30_days"],
            recurrence_count=context["recurrence_count"],
            equipment_age_years=context["equipment_age_years"],
            infrastructure_age_years=context["infrastructure_age_years"],
            estimated_repair_cost=context["estimated_repair_cost"],
        )

        cluster_result = cluster_complaint(cluster_request)

        maintenance_result = maintenance_intelligence(
            MaintenanceIntelligenceRequest(
                predicted_priority=priority_result["predicted_priority"],
                previous_similar_complaints=context["previous_similar_complaints"],
                complaints_last_7_days=context["complaints_last_7_days"],
                complaints_last_30_days=context["complaints_last_30_days"],
                recurrence_count=context["recurrence_count"],
                affected_users=request.affected_users,
                cluster=cluster_result["cluster"],
                cluster_name=cluster_result["cluster_name"],
                cluster_description=cluster_result["description"],
            )
        )

        return {
            "complaint": {
                "building": request.building,
                "floor": request.floor,
                "room_lab_no": request.room_lab_no,
                "facility_type": request.facility_type,
                "issue_category": request.issue_category,
                "issue_subcategory": request.issue_subcategory,
                "severity": request.severity,
                "affected_users": request.affected_users,
                "issue_duration_hours": request.issue_duration_hours,
                "description": request.description,
            },
            "priority": {
                "predicted_priority": priority_result["predicted_priority"],
                "model": priority_result["model"],
                "probabilities": priority_result["probabilities"],
            },
            "cluster": {
                "cluster": cluster_result["cluster"],
                "cluster_name": cluster_result["cluster_name"],
                "description": cluster_result["description"],
                "model": cluster_result["model"],
                "k": cluster_result["k"],
            },
            "maintenance": {
                "score": maintenance_result["maintenance_score"],
                "priority_weight": maintenance_result["weights"]["priority"],
                "pattern_weight": maintenance_result["weights"]["pattern"],
                "recurrence_weight": maintenance_result["weights"]["recurrence"],
                "impact_weight": maintenance_result["weights"]["impact"],
            },
            "ensemble": maintenance_result["ensemble"],
            "status": "Submitted",
            "feature_source": "historical_dataset",
            "history_match_level": context["history_match_level"],
            "history_match_count": context["history_match_count"],
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Complaint processing failed: {str(e)}",
        )