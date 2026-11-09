# CivicEye — AI-Powered Smart City Problem Reporting Platform

Citizens report civic problems (potholes, garbage, broken streetlights, damaged roads) with a photo. AI identifies the problem, GPS locates it, and an admin dashboard tracks it to resolution.

## Doc Index (read in this order)

| # | File | Purpose |
|---|------|---------|
| 1 | [PLAN.md](PLAN.md) | Phase-by-phase implementation plan (8 weeks) |
| 2 | [FEATURES.md](FEATURES.md) | Each feature → how it is built (nothing skipped) |
| 3 | [ARCHITECTURE.md](ARCHITECTURE.md) | System design, data flow, folder structure |
| 4 | [DATABASE.md](DATABASE.md) | PostgreSQL + PostGIS schema (copy-paste SQL) |
| 5 | [API.md](API.md) | Every REST endpoint |
| 6 | [AI_SERVICE.md](AI_SERVICE.md) | YOLO service: dataset, training, inference API |
| 7 | [FRONTEND.md](FRONTEND.md) | Pages, components, state, map implementation |
| 8 | [SETUP.md](SETUP.md) | Local setup + env variable reference |
| 9 | [DEPLOYMENT.md](DEPLOYMENT.md) | Vercel + Render + Neon + Cloudinary |
| 10 | [TESTING.md](TESTING.md) | Test plan + demo script |
| 11 | [TASKS.md](TASKS.md) | Master checklist (tick as you build) |

## Tech Stack

| Layer | Choice |
|-------|--------|
| Frontend | React (Vite), Tailwind CSS, React Router, TanStack Query, Leaflet (OpenStreetMap), Recharts |
| Backend | Node.js, Express, `pg`, Zod, JWT, multer |
| Database | PostgreSQL + PostGIS (Neon or Supabase) |
| AI | Python, FastAPI, Ultralytics YOLOv8 |
| Storage | Cloudinary |
| Deploy | Vercel (client), Render (server + AI), Neon (DB) |

## Repo Layout

```
civiceye/
├── client/        # React app
├── server/        # Express API
├── ai-service/    # FastAPI + YOLO
├── docs/          # these .md files
└── docker-compose.yml
```
