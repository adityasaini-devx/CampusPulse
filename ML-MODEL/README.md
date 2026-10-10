# CampusPulse ML Module

Machine Learning and complaint intelligence module for **CampusPulse**, a smart campus maintenance and issue management platform.

This module predicts complaint priority, identifies complaint patterns using clustering, analyzes historical complaint information, and calculates a maintenance decision-support score.

## 1. Features

- **Priority Classification:** Classifies complaints into Low, Medium, High, and Critical priorities.
- **Classification Experiments:** Evaluates Logistic Regression, Decision Tree, Random Forest, and XGBoost.
- **Ensemble Learning:** Compares hard voting, soft voting, bagging, and boosting approaches.
- **Complaint Clustering:** Uses a saved K-Means clustering artifact to categorize complaint patterns into three groups.
- **Historical Complaint Analysis:** Matches complaints using building, facility type, issue category, and issue subcategory.
- **Maintenance Intelligence:** Combines predicted priority, historical complaint signals, recurrence, and affected-user impact into a weighted score.
- **REST API:** Exposes ML functionality through FastAPI endpoints.

## 2. Project Structure

```text
ML-MODEL/
├── api/
│   ├── main.py
│   └── schemas.py
├── data/
│   ├── raw/
│   │   └── campuspulse_akgec_200k.csv
│   ├── eda/
│   │   └── campuspulse_akgec_eda.csv
│   └── processed/
│       └── campuspulse_akgec_processed.csv
├── ml/
│   └── models/
│       ├── classification/
│       │   ├── campuspulse_pca.pkl
│       │   ├── campuspulse_preprocessor.pkl
│       │   ├── final_priority_model.pkl
│       │   ├── model_metadata.pkl
│       │   └── priority_pipeline.pkl
│       └── clustering/
│           └── kmeans_model.json
├── notebooks/
│   ├── 01_data_cleaning.ipynb
│   ├── 02_eda.ipynb
│   ├── 03_preprocessing.ipynb
│   ├── 04_classification.ipynb
│   └── UNSUPERVISED.ipynb
├── Ensemble_Learning/
│   ├── ensemble_learning.ipynb
│   ├── maintenance_intelligence.ipynb
│   └── priority_prediction.ipynb
├── experiments/
│   └── PCA.ipynb
├── requirements.txt
├── Dockerfile
├── .dockerignore
└── .gitignore
```

## 3. Machine Learning Workflow

### Step 1: Data Cleaning and EDA

The raw complaint dataset is stored in `data/raw/`.

The cleaning and exploratory data analysis notebooks are:

- `notebooks/01_data_cleaning.ipynb`
- `notebooks/02_eda.ipynb`

The EDA dataset is stored in `data/eda/`.

### Step 2: Preprocessing and Feature Engineering

`notebooks/03_preprocessing.ipynb` prepares the data for model training.

The workflow includes:

- Removing identifier and target-leakage columns.
- Engineering date, time, impact, and complaint-frequency features.
- Imputing missing values.
- Encoding categorical variables.
- Scaling numerical features.
- Splitting the data into training and testing sets.
- Applying Principal Component Analysis (PCA).

The notebook records an 80/20 stratified split of 200,000 records:

| Dataset | Records |
|---|---:|
| Training | 160,000 |
| Testing | 40,000 |

The fitted preprocessor and PCA transformer are saved in `ml/models/classification/`.

### Step 3: Priority Classification

`notebooks/04_classification.ipynb` compares classification algorithms and evaluates their performance.

The saved `priority_pipeline.pkl` contains:

- The fitted preprocessor.
- The fitted PCA transformer.
- The selected classification model.
- The model name and feature list.
- Metadata and a flag indicating whether PCA is used.

**Current API configuration:** The saved pipeline identifies Logistic Regression as the priority classifier and uses PCA before prediction. XGBoost is evaluated separately in the ensemble notebook; it should not be described as the API's active priority model unless the saved pipeline and API integration are deliberately changed.

### Step 4: Ensemble Learning

`Ensemble_Learning/ensemble_learning.ipynb` evaluates individual classifiers and ensemble approaches, including:

- Logistic Regression
- Decision Tree
- Random Forest
- XGBoost
- Hard Voting
- Soft Voting
- Bagging

The notebook's recorded test results are:

| Model | Accuracy | Weighted F1 |
|---|---:|---:|
| XGBoost | 0.650625 | 0.650905 |
| Hard Voting | 0.648775 | 0.648855 |
| Bagging | 0.648525 | 0.648620 |
| Logistic Regression | 0.648350 | 0.647281 |
| Decision Tree | 0.632400 | 0.632597 |
| Random Forest | 0.614450 | 0.607618 |

These are recorded notebook results, not live API measurements. On these results, XGBoost performs best among the listed approaches, but the tested ensemble methods do not outperform it.

### Step 5: Complaint Clustering

The API loads `ml/models/clustering/kmeans_model.json`.

This artifact stores the features, scaling parameters, PCA transformation values, cluster centers, cluster names, and descriptions for three clusters:

1. Highly recurring and long-duration complaints.
2. Less recurring and lower-cost complaints.
3. High-impact and high-cost complaints.

The API uses the saved transformation parameters and cluster centers to assign new complaints. It does not fit a new K-Means model for each request.

### Step 6: Maintenance Intelligence

The maintenance intelligence layer combines:

- Predicted complaint priority.
- Historical complaint-frequency signals.
- Recurrence information.
- Number of affected users.

The API calculates a weighted score using the following weights:

| Component | Weight |
|---|---:|
| Predicted priority | 40% |
| Complaint-pattern signal | 20% |
| Recurrence signal | 20% |
| Affected-user impact | 20% |

The resulting score is a **decision-support score**, not a probability that a complaint will fail or remain unresolved.

The API's scoring implementation is distinct from the dataset-normalized scoring workflow in `Ensemble_Learning/maintenance_intelligence.ipynb`.

## 4. Technology Stack

- Python
- Pandas and NumPy
- Scikit-learn
- XGBoost
- Joblib
- Matplotlib and Seaborn
- Jupyter Notebook
- FastAPI
- Pydantic
- Uvicorn

## 5. Environment Setup

Run these commands in PowerShell from the repository root.

```powershell
cd ML-MODEL
```

Create a virtual environment:

```powershell
python -m venv .venv
```

Activate it:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

**Important:** The saved model artifacts were serialized with a specific scikit-learn version. Use a compatible version when loading them. For this repository, verify compatibility against the environment in which the artifacts were created before changing package versions or retraining models.

## 6. Run the ML API

Make sure the virtual environment is activated and the required model artifacts and processed dataset are present.

From inside `ML-MODEL/`, run:

```powershell
python -m uvicorn api.main:app --reload
```

The API will normally be available at:

- API base URL: `http://127.0.0.1:8000`
- Interactive Swagger documentation: `http://127.0.0.1:8000/docs`
- Health endpoint: `http://127.0.0.1:8000/health`

Use Swagger UI to inspect each endpoint and submit test requests.

## 7. API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Reports API and model loading status. |
| POST | `/complaints` | Accepts a simplified complaint and returns priority, clustering, historical context, and maintenance information. |
| POST | `/predict-priority` | Predicts complaint priority and returns class probabilities. |
| POST | `/cluster-complaint` | Assigns a complaint to a cluster. |
| POST | `/maintenance-intelligence` | Calculates the maintenance score and returns related signals and recorded ensemble metrics. |

### Complaint Processing Flow

```text
Complaint Input
      |
      v
Historical Complaint Matching
      |
      v
Feature Engineering
      |
      v
Saved Preprocessor
      |
      v
PCA Transformation
      |
      v
Logistic Regression
      |
      v
Priority Prediction
      |
      +--------------------+
      |                    |
      v                    v
K-Means Clustering   Maintenance Score
      |                    |
      +---------+----------+
                |
                v
        Combined API Response
```

The `/complaints` endpoint orchestrates the workflow. The direct prediction and clustering endpoints can also be called independently.

## 8. Saved Model Artifacts

### Classification

| File | Purpose |
|---|---|
| `campuspulse_preprocessor.pkl` | Saved preprocessing transformer. |
| `campuspulse_pca.pkl` | Saved PCA transformer. |
| `final_priority_model.pkl` | Standalone saved classification model. |
| `priority_pipeline.pkl` | Model bundle loaded by the API. |
| `model_metadata.pkl` | Saved model evaluation metadata. |

### Clustering

| File | Purpose |
|---|---|
| `kmeans_model.json` | Saved cluster centers, transformations, feature definitions, and cluster descriptions. |

The API's active classification artifact is `priority_pipeline.pkl`. Changes to the standalone model file alone will not automatically change the model used by the API.

## 9. Docker

The ML module includes a `Dockerfile` that installs Python dependencies and copies the API, models, and data into the container.

Build and run the image from inside `ML-MODEL/`:

```powershell
docker build -t campuspulse-ml .
docker run -p 8000:8000 campuspulse-ml
```

Then open `http://127.0.0.1:8000/docs`.

The Docker environment must have compatible dependencies and all required artifacts, including the processed historical dataset.

## 10. Important Notes

- Priority classification and complaint clustering are separate ML tasks.
- The active API classifier is Logistic Regression, not XGBoost.
- XGBoost results come from a separate notebook experiment.
- Historical matching is based on categorical fields; it is not semantic similarity search.
- Ensemble metrics returned by the maintenance endpoint are stored evaluation results.
- PCA, preprocessing, and model artifacts must remain compatible with one another.
- Notebook paths and saved outputs may reflect the environment in which a notebook was last executed. Verify paths before rerunning experimental notebooks.
- The module provides decision support; maintenance personnel should use the score alongside operational context.

## 11. Future Improvements

- Pin and document compatible dependency versions.
- Add automated tests for API endpoints and artifact compatibility.
- Standardize notebook paths so they work from the ML module directory.
- Compare candidate models on the same evaluation split before selecting a production classifier.
- Add model versioning and reproducible training instructions.
- Add monitoring for prediction distributions and model performance.

---

**CampusPulse ML Module** — complaint priority prediction, clustering, and maintenance decision support.
