# CampusPulse

### Smart Campus Maintenance & ML-Assisted Issue Intelligence

CampusPulse is a full-stack campus maintenance and complaint management platform. It allows users to report infrastructure issues, track complaint status, and analyze maintenance activity. Its optional Machine Learning service adds priority prediction, complaint clustering, historical pattern analysis, and maintenance decision-support scores.

- **Live application:** https://campus-pulse-1.vercel.app/login
- **Repository:** https://github.com/adityasaini-devx/CampusPulse
- **Default branch:** `main`

## Features

- **Complaint Management:** Submit, view, update, and track maintenance complaints.
- **Role-Based Access:** Separate admin and faculty experiences with protected routes.
- **Authentication:** JWT-based authentication and password hashing.
- **Priority Management:** Organize complaints into Low, Medium, High, and Critical priorities.
- **Image Uploads:** Attach complaint photos with local development storage and Cloudinary production storage.
- **Admin Dashboard:** Review complaints, manage their status, and access user information.
- **Analytics:** View complaint statistics, monthly trends, weekly activity, category distributions, and faculty activity.
- **ML-Assisted Intelligence:** Optionally predict complaint priority, identify complaint patterns, analyze historical recurrence, and calculate a maintenance score.
- **Dataset Import:** Import complaint records using the backend CSV import utility.

## System Architecture

```text
                 React + Vite Frontend
                          |
                    HTTP / JSON
                    JWT Authentication
                          |
                          v
                Node.js + Express API
                    /           \
                   v             v
              MongoDB       FastAPI ML Service
                                  |
                       +----------+----------+
                       |          |          |
                       v          v          v
                   Priority    K-Means    Historical
                  Prediction  Clustering    Analysis
                       \          |          /
                        Maintenance Intelligence
```

The frontend communicates with the Express backend. MongoDB stores application data, while the Python service provides additional ML functionality when enabled.

**Important:** The backend currently has `ML_ENABLED=false` by default. Complaint management can operate without ML predictions. Enable the integration only after verifying that the Python service is running correctly.

## Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React 19, Vite, React Router, JavaScript, CSS |
| Backend | Node.js, Express 5 |
| Database | MongoDB, Mongoose |
| Authentication | JSON Web Tokens, bcryptjs |
| Security | Helmet, CORS, express-rate-limit |
| Image Processing | Multer, Sharp, Cloudinary |
| Machine Learning | Python, Pandas, NumPy, scikit-learn, XGBoost, Joblib |
| ML API | FastAPI, Pydantic, Uvicorn |
| Deployment | Vercel frontend configuration, Docker support for ML |

## Repository Structure

```text
CampusPulse/
├── Frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── ComplaintTable.jsx
│       │   ├── Navbar.jsx
│       │   └── StatCard.jsx
│       ├── pages/
│       │   ├── Analytics.jsx
│       │   ├── Complaint.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Login.jsx
│       │   └── Signup.jsx
│       ├── api.js
│       ├── App.jsx
│       ├── main.jsx
│       └── style.css
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── services/
│   │   └── mlService.js
│   ├── utils/
│   ├── .env.example
│   ├── index.js
│   └── package.json
│
├── ML-MODEL/
│   ├── api/
│   │   ├── main.py
│   │   └── schemas.py
│   ├── data/
│   │   ├── raw/
│   │   ├── eda/
│   │   └── processed/
│   ├── ml/models/
│   │   ├── classification/
│   │   └── clustering/
│   ├── notebooks/
│   ├── Ensemble_Learning/
│   ├── experiments/
│   ├── requirements.txt
│   └── Dockerfile
│
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 20.9 or newer
- npm
- Python 3.11 for the ML service
- MongoDB locally or through MongoDB Atlas
- Git

### 1. Start the backend

From the repository root:

```powershell
cd backend
npm install
Copy-Item .env.example .env
```

Configure `backend/.env` with a valid MongoDB connection string and a strong JWT secret.

```dotenv
PORT=4000
MONGODB_URL=mongodb://127.0.0.1:27017/campuspulse
JWT_SECRET=replace_with_a_strong_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
ML_ENABLED=false
ML_SERVICE_URL=http://localhost:8000
```

Keep the remaining upload and Cloudinary settings from `.env.example` as appropriate for your environment.

Start the server:

```powershell
npm run dev
```

The backend normally runs at `http://localhost:4000`.

### 2. Start the frontend

Open another terminal:

```powershell
cd Frontend
npm install
```

Create `Frontend/.env`:

```dotenv
VITE_API_BASE_URL=http://localhost:4000/api/v1
```

Start Vite:

```powershell
npm run dev
```

Open the local URL displayed in your terminal, normally `http://localhost:5173`.

Ensure that the backend's `CLIENT_URL` matches the frontend origin.

### 3. Start the ML service (optional)

Open a third terminal:

```powershell
cd ML-MODEL
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn api.main:app --host 0.0.0.0 --port 8000
```

Verify the service at `http://localhost:8000/health`.

After confirming that the model artifacts and historical dataset load correctly, update the backend environment:

```dotenv
ML_ENABLED=true
ML_SERVICE_URL=http://localhost:8000
```

Restart the backend after changing environment variables.

## Application Workflow

1. The user signs in through the React frontend.
2. The frontend sends requests to the Express API and includes the JWT for protected endpoints.
3. The backend validates requests and interacts with MongoDB.
4. When a complaint is submitted, the backend stores complaint information and calculates a local priority.
5. If ML integration is enabled, the backend sends the complaint to FastAPI for additional analysis.
6. The ML service uses saved preprocessing and classification artifacts, clustering parameters, and historical complaint data.
7. The backend incorporates the ML result when successful, while retaining its local priority fallback when ML is unavailable.
8. The frontend displays complaint records, dashboard statistics, and analytics.

## API Reference

The backend API base path is `/api/v1`.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/health` | Backend health check |
| POST | `/api/v1/auth/login` | Authenticate a user |
| POST | `/api/v1/auth/register` | Register a user |
| POST | `/api/v1/auth/signup` | Faculty signup |
| GET | `/api/v1/auth/me` | Retrieve the current user |
| POST | `/api/v1/complaints` | Submit a complaint |
| GET | `/api/v1/complaints` | List complaints |
| GET | `/api/v1/complaints/:id` | Retrieve a complaint |
| PATCH | `/api/v1/complaints/:id` | Update a complaint |
| DELETE | `/api/v1/complaints/:id` | Delete a complaint; admin only |
| GET/POST | `/api/v1/complaints/check-duplicate` | Check for potential duplicates |
| GET | `/api/v1/analytics/overview` | Summary statistics |
| GET | `/api/v1/analytics/monthly` | Monthly trends |
| GET | `/api/v1/analytics/category-distribution` | Category breakdown |
| GET | `/api/v1/analytics/weekly` | Weekly complaint activity |
| GET | `/api/v1/analytics/faculty` | Faculty activity |
| GET | `/api/v1/users` | List users; admin only |

Protected requests use:

```http
Authorization: Bearer <JWT>
```

The ML service exposes `/health`, `/predict-priority`, `/cluster-complaint`, `/maintenance-intelligence`, and `/complaints`.

For request schemas and detailed endpoint behavior, see `backend/README.md` and `ML-MODEL/README.md`.

## Machine Learning Pipeline

The ML module separates model experimentation from inference.

1. **Data cleaning:** Prepare complaint data for analysis.
2. **Exploratory analysis:** Examine distributions, categories, and complaint patterns.
3. **Preprocessing:** Transform categorical and numerical features and apply the saved PCA transformation where configured.
4. **Classification:** Compare Logistic Regression, Decision Tree, Random Forest, and XGBoost.
5. **Ensemble learning:** Evaluate voting and bagging approaches.
6. **Clustering:** Assign complaints to groups using the saved K-Means artifact.
7. **Historical analysis:** Use complaint history to estimate similarity and recurrence signals.
8. **Maintenance intelligence:** Combine priority, recurrence, pattern, and impact signals into a decision-support score.
9. **Inference:** Serve results through FastAPI.

The current API loads `ML-MODEL/ml/models/classification/priority_pipeline.pkl` and the K-Means artifact in `ML-MODEL/ml/models/clustering/kmeans_model.json`.

The ML module's documentation identifies Logistic Regression with PCA as the active classification pipeline. XGBoost and other algorithms are evaluated in notebooks; their experimental results should not be confused with the model currently loaded for API inference.

The maintenance score is a decision-support metric, not a calibrated probability of failure or resolution.

## Deployment

### Frontend
The `Frontend/` directory contains Vercel configuration. Configure `VITE_API_BASE_URL` in the deployment environment to point to the intended backend.

### Backend
Deploy `backend/` with Node.js 20.9+, a reachable MongoDB database, and the required environment variables. Configure `CLIENT_URL` for the deployed frontend origin.

### ML service
Deploy `ML-MODEL/` using its Dockerfile or run FastAPI with Uvicorn. Ensure the saved models and processed historical dataset are available in the deployment.

If ML is enabled, configure `ML_SERVICE_URL` to point to the deployed ML service.

A deployment is fully integrated only when the frontend API URL, backend CORS settings, database connection, and optional ML service URL are configured correctly.

## Troubleshooting

- **Frontend cannot connect:** Check `VITE_API_BASE_URL`, backend availability, and CORS configuration.
- **Backend fails to start:** Verify `MONGODB_URL` and database connectivity.
- **ML service fails to start:** Check the saved model files, processed CSV, Python dependencies, and scikit-learn compatibility.
- **ML results are missing:** Verify `ML_ENABLED=true`, `ML_SERVICE_URL`, and service logs.
- **Production uploads fail:** Configure the required Cloudinary credentials.
- **Large datasets or repository size:** Consider Git LFS or external artifact storage for large data and model files.

## Security

- Replace example secrets with strong production secrets.
- Never commit `.env` files or production credentials.
- Restrict CORS to trusted origins.
- Do not use predictable demo credentials in production.
- Load serialized model artifacts only from trusted sources.

## Further Documentation

- [Backend documentation](backend/README.md)
- [ML module documentation](ML-MODEL/README.md)
