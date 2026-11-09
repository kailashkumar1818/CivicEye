# Implementation Plan (8 Weeks)

Build **vertical slices** (one working feature end-to-end) instead of finishing all backend first.

```
Week 1  Foundation        ▓▓
Week 2  Auth + Profiles   ▓▓
Week 3  Reports + Upload  ▓▓
Week 4  GPS + Map         ▓▓
Week 5  AI Detection      ▓▓
Week 6  Dedup + Tracking  ▓▓
Week 7  Admin + Analytics ▓▓
Week 8  Polish + Deploy   ▓▓
```

---

## Phase 1 — Foundation (Week 1)
**Goal:** three services run locally and talk to each other.

1. Create repo with `client/`, `server/`, `ai-service/`, `docs/`.
2. `docker-compose.yml` with `postgis/postgis:16-3.4`.
3. Server: Express skeleton, `GET /api/health`, config loader, pino logger, global error handler, CORS, helmet.
4. Client: Vite + React + Tailwind, router, layout, API client (axios).
5. AI service: FastAPI with `GET /health`.
6. Run SQL from [DATABASE.md](DATABASE.md) via a migration script (`node-pg-migrate` or plain `.sql` runner).

**Done when:** client calls `/api/health`, which calls `ai-service /health`.

## Phase 2 — Authentication & Profiles (Week 2)
**Features:** user authentication and profiles.

1. `POST /auth/register`, `/login`, `/refresh`, `/logout`, `GET /auth/me`.
2. bcrypt hashing, JWT access (15m) + refresh (7d, stored hashed in DB).
3. Middleware: `authenticate`, `requireRole('admin')`.
4. Profile: `GET/PATCH /users/me`, change password, avatar (optional).
5. Client: Login, Register, Profile pages, `AuthContext`, protected routes, axios refresh interceptor.
6. Seed script creates the first admin.

**Done when:** citizen and admin can log in; admin routes reject citizens.

## Phase 3 — Report Submission + Image Upload (Week 3)
**Features:** upload images of civic problems.

1. multer (memory storage, 5 MB, jpeg/png/webp only).
2. Cloudinary upload service.
3. `POST /reports` (multipart): title, description, category, lat, lng, image.
4. `GET /reports/mine`, `GET /reports/:id`.
5. Client: Report form with image preview, My Reports list.

**Done when:** a citizen submits a report and sees it in their list with the image.

## Phase 4 — GPS + Interactive Map (Week 4)
**Features:** GPS-based location detection, interactive map.

1. Browser `navigator.geolocation` + EXIF GPS fallback + manual pin drag.
2. Reverse geocoding via Nominatim (server-side, cached).
3. `GET /reports/map?bbox=...` using PostGIS `ST_MakeEnvelope`.
4. Client: Leaflet map, marker clustering, category-colored markers, popup with thumbnail and status.

**Done when:** map loads reports in the viewport and the form auto-fills location.

## Phase 5 — AI Detection (Week 5)
**Features:** AI automatically identifies the problem.

1. Get or train a multi-class YOLO model ([AI_SERVICE.md](AI_SERVICE.md)).
2. FastAPI `POST /predict` returns detections, top category, confidence, severity.
3. Server calls AI during `POST /reports`; stores `ai_category`, `ai_confidence`, `ai_severity`, `ai_detections`.
4. Low confidence → `needs_review = true`.
5. Client: "Analyzing image..." step, shows the detected category; user can confirm or override.

**Done when:** uploading a pothole photo pre-selects "Pothole" with a confidence score.

## Phase 6 — Duplicate Detection + Status Tracking (Week 6)
**Features:** duplicate detection, citizens track complaint status.

1. `POST /reports/check-duplicates` (called before the final submit): same category, open status, within 30 m, last 30 days (`ST_DWithin`).
2. Client shows nearby matches: "Confirm existing" (adds a row to `report_confirmations`) or "Submit anyway".
3. Status workflow with history timeline (`report_status_history`).
4. Notifications (in-app + email) on every status change.
5. Client: Report detail page with timeline.

**Done when:** a second report 10 m away prompts a duplicate warning, and a status change updates the citizen's timeline.

## Phase 7 — Admin Dashboard + Analytics (Week 7)
**Features:** government/admin dashboard, analytics of most problematic areas.

1. Admin list with filters (status, category, severity, date, needs_review), pagination, search.
2. Actions: change status, assign to department, add internal note, reject as invalid, merge duplicates.
3. Analytics endpoints: totals, by category, by status, trend, avg resolution time, hotspots (grid clustering), top areas.
4. Client: Recharts dashboards + Leaflet heatmap.

**Done when:** admin sees hotspot heatmap and can resolve a report end-to-end.

## Phase 8 — Hardening + Deployment (Week 8)
1. Rate limiting, input validation audit, security headers.
2. Tests ([TESTING.md](TESTING.md)).
3. Deploy ([DEPLOYMENT.md](DEPLOYMENT.md)).
4. Seed demo data (50+ reports across a city), screenshots, demo video, README polish.

---

## Definition of Done (project level)
- [ ] All 9 features in [FEATURES.md](FEATURES.md) work on the live URL
- [ ] Mobile-responsive
- [ ] Demo data seeded
- [ ] README with architecture diagram and screenshots
- [ ] AI metrics (precision/recall/mAP) documented honestly
