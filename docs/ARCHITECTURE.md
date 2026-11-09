# Architecture

## System Diagram

```
                ┌──────────────────────┐
                │   React Client       │  Vercel
                │ Vite · Tailwind      │
                │ Leaflet · Recharts   │
                └─────────┬────────────┘
                          │ HTTPS (JWT)
                          ▼
                ┌──────────────────────┐        ┌─────────────────┐
                │   Express API        │───────▶│  Cloudinary     │ images
                │   Render             │        └─────────────────┘
                │                      │───────▶ Nominatim (geocode)
                │                      │───────▶ SMTP (email)
                └───────┬──────┬───────┘
                        │      │ multipart + API key
                        │      ▼
                        │  ┌──────────────────┐
                        │  │ FastAPI + YOLO   │ Render / HF Spaces
                        │  └──────────────────┘
                        ▼
                ┌──────────────────────┐
                │ PostgreSQL + PostGIS │ Neon / Supabase
                └──────────────────────┘
```

## Report Submission Flow

```
1. User picks photo ──▶ client compresses + reads EXIF GPS
2. Client gets browser GPS (fallback EXIF / manual pin)
3. POST /reports/analyze (image) ──▶ server ──▶ AI /predict
        ◀── {category, confidence, severity}
4. POST /reports/check-duplicates {category, lat, lng}
        ◀── [nearby open reports]
5. User confirms category, picks "same issue" or "submit anyway"
6. POST /reports (multipart)
      server: validate → upload Cloudinary → reverse geocode
              → INSERT report + status_history → notify admins
7. Citizen sees tracking page CE-2026-000123
```

Analyze and submit are separate calls so the user sees the AI result before filing. Submit re-runs AI server-side so the stored result can't be forged by the client.

## Server Folder Structure

```
server/
├── package.json
├── .env / .env.example
├── migrations/           # SQL files, numbered
├── scripts/
│   ├── migrate.js
│   └── seed.js           # admin + demo data
└── src/
    ├── server.js         # starts HTTP
    ├── app.js            # express app, middleware, routes
    ├── config/env.js     # validates env with Zod
    ├── db/pool.js
    ├── middleware/
    │   ├── authenticate.js
    │   ├── requireRole.js
    │   ├── validate.js       # Zod wrapper
    │   ├── upload.js         # multer
    │   ├── rateLimit.js
    │   └── errorHandler.js
    ├── modules/
    │   ├── auth/         (routes, controller, service, schema)
    │   ├── users/
    │   ├── reports/
    │   ├── admin/
    │   ├── analytics/
    │   └── notifications/
    ├── services/
    │   ├── cloudinary.js
    │   ├── aiClient.js
    │   ├── geocode.js
    │   ├── mailer.js
    │   └── duplicates.js
    └── utils/ (ApiError, asyncHandler, logger, complaintId)
```

Pattern per module: `routes → controller (HTTP) → service (logic + SQL) → db`.

## Client Folder Structure

```
client/src/
├── main.jsx · App.jsx · router.jsx
├── api/            # axios instance, per-resource functions
├── context/        # AuthContext
├── hooks/          # useGeolocation, useReports, useDebounce
├── components/
│   ├── layout/     # Navbar, Sidebar, Footer
│   ├── map/        # ReportMap, LocationPicker, HeatLayer
│   ├── reports/    # ReportCard, StatusBadge, Timeline, DuplicateModal
│   ├── charts/     # CategoryPie, TrendLine, HotspotBar
│   └── ui/         # Button, Input, Modal, Spinner, Toast
├── pages/
│   ├── public/     # Home, Login, Register, PublicMap
│   ├── citizen/    # NewReport, MyReports, ReportDetail, Profile
│   └── admin/      # Dashboard, ReportsTable, ReportReview, Analytics
└── utils/ (constants, formatters)
```

## Security Checklist
- Passwords: bcrypt, 12 rounds. Never log secrets or tokens.
- JWT: short access token; refresh token stored hashed and rotated on use.
- Helmet, strict CORS allow-list, rate limits (stricter on `/auth`).
- All input validated with Zod; SQL parameterized only (`$1, $2`).
- Upload: size limit, MIME + magic-byte check, random filenames (Cloudinary IDs).
- AI service accepts only requests carrying `X-API-Key`.
- Admin routes enforced server-side, not just hidden in the UI.
- Users can only read/modify their own reports (ownership check).
- Privacy: citizen contact details hidden on the public map.

## Error Format (all endpoints)
```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [] } }
```
Success: `{ "success": true, "data": {...}, "meta": {...} }`
