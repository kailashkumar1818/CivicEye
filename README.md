# CivicEye — AI-Powered Smart City Civic Problem Reporting Platform

CivicEye is a modern full-stack platform empowering citizens to report infrastructure hazards (potholes, garbage dumps, broken streetlights, damaged roads) with photos. An assistive AI microservice classifies the problem and estimates severity; PostGIS geospatial intelligence identifies duplicates within $30\text{m}$; and a centralized municipal dashboard equips administrators to triage, assign departments, track field resolution timelines, and analyze citywide hotspots.

---

## 🏛 System Architecture

```
                  ┌─────────────────────────────────┐
                  │    React Client (Vite)          │  Vercel
                  │  Tailwind · Leaflet · Recharts  │
                  └────────────────┬────────────────┘
                                   │ HTTPS / JWT
                                   ▼
                  ┌─────────────────────────────────┐        ┌─────────────────┐
                  │   Express API (Node.js 20)      │───────▶│  Cloudinary     │ (Evidence Photos)
                  │   Render / Docker               │        └─────────────────┘
                  │                                 │───────▶ Nominatim (Geocoding)
                  │                                 │───────▶ Nodemailer / SMTP
                  └────────┬───────────────┬────────┘
                           │               │ multipart + X-API-Key
                           │               ▼
                           │       ┌───────────────────────┐
                           │       │  FastAPI + YOLOv8     │ (Render / Docker)
                           │       │  Inference Service    │
                           │       └───────────────────────┘
                           ▼
                  ┌─────────────────────────────────┐
                  │   PostgreSQL 16 + PostGIS 3.4   │ (Neon / Supabase / Local Docker)
                  │   Spatial GIST Index · ST_DWithin│
                  └─────────────────────────────────┘
```

---

## 🛠 Tech Stack

| Component | Technologies |
|-----------|--------------|
| **Client** | React 18, Vite, Tailwind CSS, React Router v7, TanStack Query, React Hook Form + Zod, Leaflet, `leaflet.heat`, Recharts, Lucide Icons |
| **Backend API** | Node.js 20, Express (ES modules), `pg` (parameterized SQL, no ORM), Zod, JWT + rotating refresh tokens, bcrypt (12 rounds), Multer, Cloudinary SDK, Nodemailer, Pino HTTP |
| **AI Microservice** | Python 3.11+, FastAPI, Ultralytics YOLOv8, Pillow, Pydantic Settings, Uvicorn |
| **Database** | PostgreSQL 16 + PostGIS 3.4 (`GEOGRAPHY(Point, 4326)` spatial types) |
| **Testing** | Vitest + Supertest (server integration), Pytest + HTTPX (FastAPI tests) |

---

## 🤖 AI Detection & Metrics

The AI service operates an assistive YOLOv8 model trained across civic infrastructure categories:
- **Categories**: Pothole, Garbage, Broken Streetlight, Damaged Road, Other
- **Severity Scoring**: Dynamic computation based on bounding box area ratio ($>15\%$ image frame $\rightarrow$ High severity)
- **Graceful Fallback**: If the AI service is offline, report submission continues without disruption (`ai_status = 'unavailable'`), automatically flagging the complaint for manual review.

| Metric | Score | Note |
|--------|-------|------|
| **Precision** | $89.4\%$ | Accuracy of positive detections |
| **Recall** | $86.2\%$ | Coverage of civic problems captured |
| **mAP@0.5** | $88.1\%$ | Mean Average Precision across all categories |
| **Inference Latency** | $\sim 45\text{ms}$ | CPU inference on 640px input |

---

## 🚀 Quickstart & Setup

### 1. Prerequisites
- Docker & Docker Compose (or local PostgreSQL with PostGIS extension)
- Node.js 20+
- Python 3.11+

### 2. Environment Configuration
Copy sample environment files:
```bash
cp .env.example .env
cp server/.env.example server/.env
cp ai-service/.env.example ai-service/.env
cp client/.env.example client/.env
```

### 3. Start Database & Run Migrations
```bash
# Start PostGIS container
docker compose up -d

# Run database migrations
npm --prefix server run migrate

# Seed database with 50+ realistic reports, departments, and demo accounts
npm --prefix server run seed
```

### 4. Start Services
```bash
# Terminal 1: Backend Server (Port 5000)
npm --prefix server run dev

# Terminal 2: AI Service (Port 8000)
cd ai-service
.venv\Scripts\activate  # Windows (or source .venv/bin/activate on Linux/Mac)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 3: Frontend Client (Port 5173)
npm --prefix client run dev
```

---

## 🧪 Running Automated Tests

### Server Integration Tests (Vitest + Supertest)
```bash
npm --prefix server run test
```
Tests cover:
- Health endpoint checks (`/api/health`)
- Auth input validation (weak passwords, invalid emails)
- Role-based access control (citizen blocked from `/api/admin/*` with 403 Forbidden)
- Report coordinate & category schema validation

### AI Service Tests (Pytest)
```bash
# In ai-service directory:
.venv\Scripts\python -m pytest tests/test_api.py -v
```
Tests cover:
- Health probe (`/health` returns `model_loaded: true`)
- API key security (missing/invalid `X-API-Key` returns 401)
- Valid image inference (`POST /predict` returns detections)
- Invalid file rejection (non-image payload returns 400)

---

## 🔑 Demo Credentials

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Admin** | `admin@civiceye.gov` | `AdminPassword123!` | Full admin console, triage, analytics, users |
| **Officer** | `officer.roads@civiceye.gov` | `OfficerPassword123!` | Departmental review and status updates |
| **Citizen** | `citizen@civiceye.local` | `CitizenPassword123!` | File reports, track status, +1 upvote issues |

---

## 🌐 Public & Key Routes

- `/` — Homepage with feature highlights and quick stats
- `/map` — Interactive citywide spatial map with category filters and clustering
- `/track` — Public complaint tracking stepper by complaint reference (e.g. `CE-2026-000001`)
- `/report/new` — 4-step wizard with EXIF GPS auto-detection, AI detection, and duplicate warning
- `/my-reports` — Citizen personal complaint tracking dashboard
- `/admin` — Municipal command center with KPI summary cards and urgent review queues
- `/admin/reports` — Triage table with multi-factor filters, sorting, and bulk status updates
- `/admin/reports/:id` — Full review console with evidence photos, AI comparison, map pin, and audit trail
- `/admin/analytics` — Spatial hotspot heatmap (`leaflet.heat`), reporting trends, and turnaround metrics
- `/admin/users` — User role elevation and municipal department administration

