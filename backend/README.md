# CampusPulse Backend

Node.js + Express + MongoDB backend for the CampusPulse React frontend.

## Main API

- POST `/api/v1/auth/login`
- POST `/api/v1/auth/register`
- GET `/api/v1/auth/me`
- POST `/api/v1/complaints`
- GET `/api/v1/complaints`
- GET `/api/v1/complaints/:id`
- PATCH `/api/v1/complaints/:id`
- DELETE `/api/v1/complaints/:id`
- POST `/api/v1/complaints/check-duplicate`
- GET `/api/v1/analytics/overview`
- GET `/api/v1/analytics/monthly`
- GET `/api/v1/analytics/category-distribution`
- GET `/api/v1/analytics/weekly`
- GET `/api/v1/analytics/faculty`
- GET `/api/v1/users`

## Run

```bash
npm install
copy .env.example .env
node index.js
```

Or:

```bash
npm run dev
```

## Demo accounts

Admin:
`admin@campus.edu`
`admin@123`

Faculty:
`faculty@campus.edu`
`faculty@123`

The accounts are created automatically on server startup outside production. Production startup does not create demo accounts.

## Complaint request

```json
{
  "title": "AC not working",
  "userType": "Student",
  "category": "AC",
  "building": "CSIT Building",
  "room": "Lab 3",
  "severity": "High",
  "affectedUsers": "21 - 50 Users",
  "issueDuration": "1 to 8 Hours",
  "description": "The AC has stopped cooling."
}
```

Send:

`Authorization: Bearer YOUR_JWT_TOKEN`

For a photo, send the complaint as `multipart/form-data` and use the field name `photo`. Maximum image size is 5 MB. JPEG, PNG, and WEBP uploads are decoded and validated before storage, with a 40-megapixel limit; local filenames use the detected image format. Development uploads are served from `/uploads/...`; production uploads use the returned Cloudinary HTTPS URL.

In development, uploads use the local `UPLOAD_DIR` (default: `uploads`). In production, set `NODE_ENV=production` and configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in the server environment. Optionally set `CLOUDINARY_FOLDER` (default: `campuspulse`). Production startup fails explicitly if Cloudinary credentials are missing; credentials should be managed through the hosting environment and never committed to `.env`.

The analytics overview includes `stats.averageResolutionTimeHours` (zero when there are no resolved complaints with valid timestamps). The monthly endpoint returns the last 12 UTC calendar months, including months with zero complaints.

## ML

`ML_ENABLED=false` is intentional. The backend still works without the ML service.
ML requests use a 5-second timeout; timeouts and invalid responses leave the locally calculated complaint priority in place.

When the Python model is ready:

```env
ML_ENABLED=true
ML_SERVICE_URL=http://localhost:8000
```

The Node backend will call:

`POST http://localhost:8000/complaints`

and store the ML result inside `complaint.ml` when the feature is enabled.

## CSV

Place the dataset at:

```text
CampusPulse/
├── backend/
└── campuspulse_akgec_cleaned.csv
```

Then:

```bash
npm run import:csv
```

You can also pass an explicit path:

```bash
node scripts/importCSV.js "C:\path\to\campuspulse_akgec_cleaned.csv"
```
