# Local Setup

## Prerequisites
Node 20+, Python 3.10+, Docker (for PostGIS), Git.
Accounts (free): Cloudinary. Optional: Gmail app password for email.

## 1. Clone and structure
```bash
mkdir civiceye && cd civiceye
mkdir client server ai-service docs
git init
```

## 2. Database
`docker-compose.yml`
```yaml
services:
  db:
    image: postgis/postgis:16-3.4
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]
volumes:
  pgdata:
```
```bash
docker compose up -d
```

## 3. Server
```bash
cd server
npm init -y
npm i express pg zod jsonwebtoken bcrypt cors helmet express-rate-limit multer \
      cloudinary axios form-data nodemailer pino pino-http dotenv
npm i -D nodemon vitest supertest
```
`package.json` → `"type": "module"`, scripts: `dev` (nodemon src/server.js), `migrate`, `seed`, `test`.
```bash
cp .env.example .env     # fill values
npm run migrate && npm run seed
npm run dev              # http://localhost:5000
```

## 4. AI Service
```bash
cd ai-service
python -m venv .venv && source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# put weights in models/civiceye-yolov8n.pt
uvicorn app.main:app --reload --port 8000
```
No custom weights yet? Set `MODEL_PATH=yolov8n.pt` (generic COCO model) to test the plumbing. It won't detect civic issues.

## 5. Client
```bash
cd client
npm create vite@latest . -- --template react
# install deps from FRONTEND.md
cp .env.example .env
npm run dev              # http://localhost:5173
```

## 6. Verify
1. `GET http://localhost:5000/api/health` → db up, ai up
2. Login as seeded admin
3. Submit a report with a pothole photo
4. See it on `/map` and in `/admin/reports`

## Env Variable Reference
Full lists for `client/.env`, `server/.env`, `ai-service/.env` and the root `.env` were provided earlier. Key links between services:

| Must match | A | B |
|-----------|---|---|
| API base | `client` `VITE_API_BASE_URL` | server URL + `/api` |
| CORS | `server` `CORS_ORIGINS` | client origin |
| AI secret | `server` `AI_SERVICE_API_KEY` | `ai-service` `AI_SERVICE_API_KEY` |
| AI URL | `server` `AI_SERVICE_URL` | AI service URL |

## Troubleshooting
| Problem | Fix |
|---------|-----|
| `type "geography" does not exist` | PostGIS not enabled → `CREATE EXTENSION postgis;` |
| CORS error | Add the client origin to `CORS_ORIGINS` |
| Map tiles blank | Container height missing / Leaflet CSS not imported |
| Markers show no icon | Use `divIcon` or set icon URLs manually |
| AI timeout | Cold start; increase `AI_REQUEST_TIMEOUT_MS`, call `/health` first |
| Lat/lng swapped | PostGIS uses `(lng, lat)`; Leaflet uses `[lat, lng]` |
