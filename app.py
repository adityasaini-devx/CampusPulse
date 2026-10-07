from fastapi import FastAPI
import pandas as pd
import joblib

app = FastAPI()

scaler = joblib.load("scaler.pkl")
pca = joblib.load("pca.pkl")
kmeans = joblib.load("kmeans.pkl")
print("Scaler features:", scaler.n_features_in_)
print("PCA features:", pca.n_features_in_)
print("KMeans features:", kmeans.n_features_in_)

pca_features = [
    "affected_users",
    "issue_duration_hours",
    "previous_similar_complaints",
    "complaints_last_7_days",
    "complaints_last_30_days",
    "recurrence_count",
    "equipment_age_years",
    "infrastructure_age_years",
    "estimated_repair_cost"
]


@app.post("/predict-cluster")
def predict_cluster(data: dict):

    df = pd.DataFrame([data])

    df = df[pca_features]

    df = df.fillna(df.median())

    scaled_data = scaler.transform(df)

    pca_data = pca.transform(scaled_data)

    cluster = kmeans.predict(pca_data)

    return {
        "cluster": int(cluster[0])
    }