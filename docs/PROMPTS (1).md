# Implementation Prompts (for Claude Code / Cursor / any AI coding agent)

## How to use
1. Copy the 12 doc files into `civiceye/docs/`.
2. Open your agent at the repo root (`civiceye/`).
3. Paste the **Master Prompt** once.
4. Then paste **Phase 1**, test it, commit, then Phase 2, and so on. Never paste all phases at once.

After each phase, run the app yourself and check the "Done when" line in `docs/PLAN.md`.

---

## MASTER PROMPT (paste first)

```
You are a senior full-stack engineer. Build "CivicEye", an AI-powered civic problem reporting platform, in this repo.

SOURCE OF TRUTH: read every file in /docs before writing code, starting with README.md, then PLAN.md, FEATURES.md, ARCHITECTURE.md, DATABASE.md, API.md, AI_SERVICE.md, FRONTEND.md, SETUP.md. If code and docs disagree, follow the docs and tell me.

STACK (fixed, do not substitute):
- client/: React (Vite), Tailwind, React Router, TanStack Query, react-hook-form + Zod, Leaflet (OpenStreetMap), Recharts
- server/: Node 20, Express, ES modules, pg (raw parameterized SQL, no ORM), Zod, JWT, bcrypt, multer, Cloudinary, nodemailer, pino
- ai-service/: Python, FastAPI, Ultralytics YOLOv8
- DB: PostgreSQL + PostGIS (docker-compose locally)

RULES:
1. Work only on the phase I give you. Do not build later phases.
2. Follow the folder structure in docs/ARCHITECTURE.md exactly.
3. Server pattern: routes -> controller -> service -> db. Validate every input with Zod. Use parameterized SQL only.
4. Use the exact schema in docs/DATABASE.md as migrations. Remember PostGIS uses (lng, lat) and Leaflet uses [lat, lng].
5. All API responses use the format in docs/ARCHITECTURE.md ("Error Format"). Endpoint names/paths must match docs/API.md.
6. Read config only through server/src/config/env.js (Zod-validated). Never hardcode secrets. Keep .env.example files updated.
7. The AI service failing must never block report submission.
8. Mobile-first UI, loading states, error toasts, empty states.
9. Write small, readable code with brief comments only where logic is non-obvious. I am a student learning MERN, so keep it simple and idiomatic.
10. After finishing a phase: list the files you created, the commands to run, and how to verify it works. Then tick the matching items in docs/TASKS.md.
11. If something is ambiguous, ask me ONE short question instead of guessing.

Confirm you have read the docs by summarizing the project in 5 bullet points and the 8 phases in one line each. Do not write code yet.
```

---

## PHASE 1 — Foundation

```
Implement PHASE 1 (Foundation) from docs/PLAN.md.

Do:
- Create client/, server/, ai-service/ with the folder structure from docs/ARCHITECTURE.md.
- Root: docker-compose.yml (postgis/postgis:16-3.4), .gitignore (env files, node_modules, __pycache__, *.pt), root .env.example.
- server: package.json ("type":"module"), src/app.js, src/server.js, config/env.js (Zod), db/pool.js, middleware/errorHandler.js, utils (ApiError, asyncHandler, logger), helmet + CORS allow-list + pino-http.
- server: scripts/migrate.js that runs numbered .sql files in migrations/ and records them; migrations/001_init.sql copied exactly from docs/DATABASE.md.
- server: GET /api/health returning { status, db, ai }.
- ai-service: FastAPI app with GET /health and X-API-Key dependency (stub), config.py from .env.
- client: Vite + React + Tailwind, router with placeholder pages, axios instance reading VITE_API_BASE_URL, basic Navbar/Layout.
- .env.example for each service (use the variable names from docs/SETUP.md and the env lists).

Done when: docker compose up -d, npm run migrate succeeds, and the client page shows the /api/health result (db up, ai up).
Give me the exact commands to run.
```

## PHASE 2 — Authentication & Profiles

```
Implement PHASE 2 (Auth & Profiles).

Server:
- modules/auth: POST /auth/register, /login, /refresh, /logout, GET /auth/me (see docs/API.md).
- bcrypt (rounds from env). JWT access token (15m). Refresh token: random string, store only its hash in refresh_tokens, rotate on every refresh, reject reuse.
- middleware/authenticate.js and requireRole.js.
- modules/users: GET/PATCH /users/me, PATCH /users/me/password, POST /users/me/avatar (Cloudinary).
- Rate limiter on /auth routes (AUTH_RATE_LIMIT_MAX).
- scripts/seed.js: creates admin from ADMIN_SEED_EMAIL/PASSWORD, 3 departments (Roads, Sanitation, Electricity), and 5 citizens.

Client:
- AuthContext (user, login, register, logout), axios interceptor that refreshes on 401 once then retries, ProtectedRoute and AdminRoute.
- Pages: Login, Register, Profile (edit details, change password, notification toggle). Navbar changes by role.

Tests (Vitest + Supertest): register/login/me, wrong password 401, citizen on admin route 403, refresh rotation + reuse rejected.

Done when: citizen and admin can log in, tokens refresh silently, admin route rejects a citizen.
```

## PHASE 3 — Reports & Image Upload

```
Implement PHASE 3 (Report submission + image upload).

Server:
- middleware/upload.js: multer memory storage, max 3 images, MAX_IMAGE_SIZE_MB, allow jpeg/png/webp, plus a magic-byte check.
- services/cloudinary.js: upload buffer, return { url, public_id }.
- services/complaintId.js: CE-YYYY-000123 using the report_seq sequence.
- modules/reports: POST /reports (multipart), GET /reports/mine (pagination + status filter), GET /reports/:id (owner or admin only; hide internal history notes from citizens).
- On create: insert report + report_images + initial report_status_history row in ONE transaction. Location stored as GEOGRAPHY via ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography.
- Zod schema: title 5-150, category enum, lat -90..90, lng -180..180.

Client:
- ImageUploader (preview, client-side compression to max 1600px with browser-image-compression, camera capture on mobile).
- Temporary simple report form (the full wizard comes later), MyReports page with status badges, ReportDetail page (images, status, details).
- StatusBadge, CategoryIcon, ReportCard, Skeleton, EmptyState components.

Done when: a citizen submits a report with an image and sees it in My Reports with the Cloudinary image.
```

## PHASE 4 — GPS & Interactive Map

```
Implement PHASE 4 (GPS + Map).

Client:
- hooks/useGeolocation.js (high accuracy, 10s timeout, warn when accuracy > 100m).
- Read EXIF GPS with exifr as fallback; manual fallback with LocationPicker (Leaflet, draggable marker, click to move).
- Store locationSource: gps | exif | manual.
- ReportMap component: react-leaflet + OSM tiles from VITE_MAP_TILE_URL, leaflet.markercluster, divIcon markers colored by category (colors in docs/FRONTEND.md), popup with thumbnail/title/status/link.
- Fetch GET /map/reports?bbox=... on moveend, debounced 400ms. Filter bar (category, status, date range) and legend.
- Public page /map.

Server:
- services/geocode.js: Nominatim reverse geocode with the required User-Agent, in-memory cache, fail silently (address stays null).
- On POST /reports save address, area, city from geocoding.
- GET /map/reports: PostGIS bbox query from docs/DATABASE.md, max 500 rows, public, returns only non-sensitive fields (no user info).

Done when: opening the report form auto-fills location + address, and /map shows clustered markers for the visible area.
Remind me about the lat/lng order pitfalls you handled.
```

## PHASE 5 — AI Detection

```
Implement PHASE 5 (AI) following docs/AI_SERVICE.md.

ai-service:
- detector.py loads the model once at startup from MODEL_PATH. If I have no custom weights yet, MODEL_PATH=yolov8n.pt just to test the plumbing.
- POST /predict (multipart image, X-API-Key): returns category, confidence, severity, detections[] (label, confidence, bbox, area_ratio), image size, inference_ms. Category = highest confidence x area_ratio. Severity thresholds from env. No detections => category "other".
- Reject non-images and files over MAX_IMAGE_SIZE_MB. Add pytest tests.
- Dockerfile as in docs/DEPLOYMENT.md.
- Also create training/train.py and training/data.yaml (4 classes) with a README note on dataset merging.

server:
- services/aiClient.js: axios + form-data, API key header, timeout, one retry, never throws to the caller (returns { ai_status: 'unavailable' }).
- POST /reports/analyze (image -> AI result, no DB write).
- In POST /reports re-run AI server-side and store ai_status, ai_category, ai_confidence, ai_severity, ai_detections; set needs_review when confidence < AI_MIN_CONFIDENCE or the AI is unavailable.
- Keep the user-confirmed category in reports.category (the AI one is stored separately).

client:
- Call /reports/analyze right after a photo is chosen: show "Analyzing..." and a cold-start message if slow; show a chip like "Pothole 87% - High"; pre-select the category; user can override.
- Call /health on form open to warm the AI service.

Done when: a pothole photo pre-selects "Pothole" with a confidence score, and stopping the AI service still lets reports be submitted.
```

## PHASE 6 — Duplicates & Status Tracking

```
Implement PHASE 6 (Duplicates, tracking, notifications).

Server:
- services/duplicates.js using the ST_DWithin query from docs/DATABASE.md (same category, open status, DUPLICATE_RADIUS_METERS, DUPLICATE_WINDOW_DAYS).
- POST /reports/check-duplicates and POST /reports/:id/confirm (one per user, 409 on repeat, increments confirmation_count and raises priority).
- Status workflow: a transition map enforcing docs/API.md rules; every change writes report_status_history in a transaction, sets resolved_at, and creates a notification (+ email via nodemailer if the user enabled it; failures must not break the request).
- Notifications endpoints (list, mark read, read-all).
- POST /reports/:id/reopen (owner, within 7 days of resolved).
- Public GET /reports/track/:complaintNo returning limited fields.

Client:
- Replace the temporary form with the 4-step wizard from docs/FRONTEND.md: Photo -> Location -> Details -> Review.
- DuplicateModal with buttons "Same issue (add my vote)" and "This is different".
- Timeline component on ReportDetail, notification bell with unread count, public /track page.

Tests: duplicate at 10m matches, at 100m does not, resolved reports excluded, double confirm 409, invalid transition 400.

Done when: a second report 10m away triggers the modal, and a status change appears in the citizen's timeline and notifications.
```

## PHASE 7 — Admin Dashboard & Analytics

```
Implement PHASE 7 (Admin + Analytics).

Server (role admin/officer enforced on every route):
- GET /admin/reports with filters (status, category, severity, needsReview, area, q, from, to), sort, pagination.
- GET /admin/reports/:id (AI vs citizen category, confirmations, full history incl. internal notes).
- PATCH status / assign / priority / category, POST merge (sets duplicate_of, moves confirmations), POST bulk-status.
- Departments list/create, users list/update (admin only).
- modules/analytics: summary, by-category, by-status, trend (day|week), hotspots (ST_SnapToGrid), top-areas, resolution-time, ai-accuracy. Use the SQL in docs/DATABASE.md.

Client:
- /admin dashboard: KPI cards + Recharts (category pie, status bar, trend line).
- /admin/reports table with filters, search, pagination, row selection + bulk status, badges for "needs review" and "AI differs from citizen".
- /admin/reports/:id review page: images, map, AI result, status dropdown with note, assign department, priority, merge dialog, history.
- /admin/analytics: Leaflet heatmap (leaflet.heat) from hotspots, top areas, resolution time by category, AI accuracy.
- /admin/users page.

Update seed.js to create 50+ demo reports around my city with mixed categories, statuses and dates so analytics looks real.

Done when: admin sees the heatmap and can take a report from submitted to resolved end to end.
```

## PHASE 8 — Hardening, Tests, Deploy

```
Implement PHASE 8 (Hardening + deployment prep).

- Audit: every route has Zod validation, ownership checks, and correct role guards; add rate limiting, trust proxy, strict CORS; confirm no secrets are logged.
- Add the Vitest/Supertest + pytest suites listed in docs/TESTING.md that are still missing; make `npm test` pass.
- Add client/vercel.json (SPA rewrite), ai-service/Dockerfile, a GitHub Actions workflow (install, test, build).
- Write the root README.md: overview, architecture diagram, feature list, setup, env table, AI metrics placeholder table, deployment steps, screenshots section.
- Walk me through docs/DEPLOYMENT.md step by step (Neon, Render x2, Vercel) and the post-deploy checklist.

Done when: tests pass, the production build works, and the deployment checklist is complete.
```

---

## Helper prompts (use anytime)

**Debugging**
```
I'm getting this error: <paste error + the file/command>.
Explain the root cause in 3 lines, then give the smallest fix. Do not refactor unrelated code.
```

**Review a finished phase**
```
Review what you built for Phase <N> against docs/PLAN.md, docs/API.md and docs/DATABASE.md.
List: (1) anything missing, (2) any mismatch with the docs, (3) security issues, (4) untested paths. Fix the real problems.
```

**Learning mode (explain as you go)**
```
For the code you just wrote, explain the request flow step by step with a small ASCII trace, and the 3 key concepts I should understand to explain this in an interview.
```

**Commit message**
```
Summarize this phase's changes as a conventional commit message (feat:, fix:, chore:) with a short body.
```

## Tips
- One phase per session. If the agent drifts, paste the Master Prompt again plus the phase.
- Commit after every phase so you can roll back.
- Run each phase yourself before moving on. Do not stack untested phases.
- Rotate any secret you accidentally paste into a prompt.
