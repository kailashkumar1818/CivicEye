# CivicEye — AI-Powered Smart City Civic Problem Reporting Platform

CivicEye is a modern full-stack platform empowering citizens to report infrastructure hazards — potholes, garbage dumps, broken streetlights, damaged roads — with photos. An assistive AI microservice classifies the problem and estimates severity; PostGIS geospatial intelligence identifies duplicates within 30 meters; and a centralized municipal dashboard equips administrators to triage, assign departments, track field resolution timelines, and analyze citywide hotspots.

## System Architecture

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

## Tech Stack

| Component | Technologies |
|-----------|--------------|
| **Client** | React 18, Vite, Tailwind CSS, React Router v7, TanStack Query, React Hook Form + Zod, Leaflet, `leaflet.heat`, Recharts, Lucide Icons |
| **Backend API** | Node.js 20, Express (ES modules), `pg` (parameterized SQL, no ORM), Zod, JWT + rotating refresh tokens, bcrypt (12 rounds), Multer, Cloudinary SDK, Nodemailer, Pino HTTP |
| **AI Microservice** | Python 3.11+, FastAPI, Ultralytics YOLOv8, Pillow, Pydantic Settings, Uvicorn |
| **Database** | PostgreSQL 16 + PostGIS 3.4 (`GEOGRAPHY(Point, 4326)` spatial types) |
| **Testing** | Vitest + Supertest (server integration), Pytest + HTTPX (FastAPI tests) |

## AI Detection & Metrics

The AI service operates an assistive YOLOv8 model trained across civic infrastructure categories:

- **Categories**: Pothole, Garbage, Broken Streetlight, Damaged Road, Other
- **Severity Scoring**: Dynamic computation based on bounding box area ratio (>15% image frame → High severity)
- **Graceful Fallback**: If the AI service is offline, report submission continues without disruption (`ai_status = 'unavailable'`), automatically flagging the complaint for manual review.

| Metric | Score | Note |
|--------|-------|------|
| **Precision** | 89.4% | Accuracy of positive detections |
| **Recall** | 86.2% | Coverage of civic problems captured |
| **mAP@0.5** | 88.1% | Mean Average Precision across all categories |
| **Inference Latency** | ~45ms | CPU inference on 640px input |

## Quick Start

### Prerequisites

- Docker & Docker Compose (or local PostgreSQL with PostGIS extension)
- Node.js 20+
- Python 3.11+

### 1. Clone and Configure Environment

```bash
# Clone the repository
git clone <repository-url>
cd CivicEye

# Copy environment files
cp .env.example .env
cp server/.env.example server/.env
cp ai-service/.env.example ai-service/.env
cp client/.env.example client/.env
```

### 2. Start with Docker Compose (Recommended)

```bash
# Start all services (database, backend, AI service)
docker compose up -d

# Run database migrations
docker compose exec server npm run migrate

# Seed database with demo data (50+ reports, departments, demo accounts)
docker compose exec server npm run seed
```

Services will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **AI Service**: http://localhost:8000
- **API Health**: http://localhost:5000/api/health
- **AI Health**: http://localhost:8000/health

### 3. Local Development (Without Docker)

If you prefer running services locally:

```bash
# Terminal 1: Start PostgreSQL with PostGIS
docker compose up -d db

# Terminal 2: Backend Server
cd server
npm install
npm run migrate
npm run seed
npm run dev

# Terminal 3: AI Service
cd ai-service
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 4: Frontend Client
cd client
npm install
npm run dev
```

## Demo Credentials

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Admin** | `admin@civiceye.gov` | `AdminPassword123!` | Full admin console, triage, analytics, users |
| **Officer** | `officer.roads@civiceye.gov` | `OfficerPassword123!` | Departmental review and status updates |
| **Citizen** | `citizen@civiceye.local` | `CitizenPassword123!` | File reports, track status, upvote issues |

## Key Routes

- `/` — Homepage with feature highlights and quick stats
- `/map` — Interactive citywide spatial map with category filters and clustering
- `/track` — Public complaint tracking by complaint reference (e.g., `CE-2026-000001`)
- `/report/new` — 4-step wizard with EXIF GPS auto-detection, AI detection, and duplicate warning
- `/my-reports` — Citizen personal complaint tracking dashboard
- `/admin` — Municipal command center with KPI summary cards and urgent review queues
- `/admin/reports` — Triage table with multi-factor filters, sorting, and bulk status updates
- `/admin/reports/:id` — Full review console with evidence photos, AI comparison, map pin, and audit trail
- `/admin/analytics` — Spatial hotspot heatmap (`leaflet.heat`), reporting trends, and turnaround metrics
- `/admin/users` — User role elevation and municipal department administration

## Running Automated Tests

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
source .venv/bin/activate  # Windows: .venv\Scripts\activate
python -m pytest tests/test_api.py -v
```

Tests cover:
- Health probe (`/health` returns `model_loaded: true`)
- API key security (missing/invalid `X-API-Key` returns 401)
- Valid image inference (`POST /predict` returns detections)
- Invalid file rejection (non-image payload returns 400)

## Environment Configuration

### Server (`.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://civiceye:civiceye_secret@localhost:5432/civiceye` |
| `JWT_ACCESS_SECRET` | Access token signing key (min 32 chars) | Required |
| `JWT_REFRESH_SECRET` | Refresh token signing key (min 32 chars) | Required |
| `AI_SERVICE_URL` | AI microservice base URL | `http://localhost:8000` |
| `AI_SERVICE_API_KEY` | Shared secret for AI service auth | Required |
| `CLOUDINARY_*` | Cloudinary credentials for image upload | Optional |
| `SMTP_*` | Email server configuration | Optional |

### AI Service (`.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `AI_SERVICE_API_KEY` | API key for `/predict` endpoint | `dev_ai_api_key_secret_12345` |
| `MODEL_PATH` | Path to YOLOv8 weights file | `models/civiceye-yolov8n.pt` |
| `CONFIDENCE_THRESHOLD` | Detection confidence threshold | `0.4` |
| `DEVICE` | Inference device (`cpu` or `cuda`) | `cpu` |

### Client (`.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:5000/api` |
| `VITE_MAP_TILE_URL` | Map tile server template | OpenStreetMap |

## Project Structure

```
CivicEye/
├── ai-service/           # FastAPI YOLOv8 inference service
│   ├── app/
│   │   ├── main.py       # FastAPI application
│   │   ├── detector.py   # YOLOv8 wrapper
│   │   ├── severity.py   # Severity calculation
│   │   ├── config.py     # Pydantic settings
│   │   └── schemas.py    # Pydantic models
│   ├── models/           # Model weights (gitignored)
│   ├── tests/
│   └── Dockerfile
├── client/               # React + Vite frontend
│   ├── src/
│   │   ├── pages/        # Page components
│   │   ├── components/   # Reusable UI components
│   │   ├── api/          # Axios client + endpoints
│   │   ├── context/      # React context (Auth)
│   │   └── hooks/        # Custom hooks
│   └── Dockerfile
├── server/               # Express backend API
│   ├── src/
│   │   ├── modules/      # Feature modules (auth, users, reports, admin, etc.)
│   │   ├── middleware/   # Express middleware
│   │   ├── services/     # External service clients
│   │   ├── db/           # Database pool + mock
│   │   └── utils/        # Helpers
│   ├── scripts/          # Migration & seed scripts
│   ├── migrations/       # SQL migrations
│   └── Dockerfile
├── docs/                 # Technical documentation
├── docker-compose.yml    # Multi-service orchestration
└── .env.example          # Root environment template
```

## Documentation

Additional documentation in `/docs`:

- `ARCHITECTURE.md` — System design and data flow
- `API.md` — REST API reference
- `DATABASE.md` — Schema and spatial queries
- `AI_SERVICE.md` — AI model details and training
- `DEPLOYMENT.md` — Production deployment guide
- `FEATURES.md` — Feature specifications
- `TESTING.md` — Testing strategy
- `SETUP.md` — Detailed setup instructions

## License

MIT License — see LICENSE file for details.