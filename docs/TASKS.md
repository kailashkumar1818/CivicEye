# Master Task Checklist

Tick as you go. Order matches [PLAN.md](PLAN.md).

## Phase 1 — Foundation
- [x] Repo + folders, `.gitignore` (env files, `.pt`)
- [x] `docker-compose.yml` with PostGIS running
- [x] Server skeleton: app, config (Zod env), logger, error handler
- [x] `GET /api/health`
- [x] Migration runner + `001_init.sql` applied
- [x] Client: Vite, Tailwind, router, axios instance
- [x] AI service: FastAPI `/health`

## Phase 2 — Auth & Profile
- [x] Register / login / refresh / logout / me
- [x] `authenticate` + `requireRole` middleware
- [x] Refresh tokens hashed + rotated
- [x] Profile get/update, change password, avatar
- [x] Admin seed script
- [x] Client: Login, Register, Profile, AuthContext, route guards, 401 interceptor

## Phase 3 — Reports & Upload
- [x] multer + MIME/size validation
- [x] Cloudinary service
- [x] `POST /reports`, `GET /reports/mine`, `GET /reports/:id`
- [x] Complaint number generator
- [x] Client: ImageUploader (preview, compression), report form, My Reports

## Phase 4 — GPS & Map
- [x] `useGeolocation` hook
- [x] EXIF GPS fallback (`exifr`)
- [x] LocationPicker (draggable marker)
- [x] Nominatim reverse geocode (cached, with User-Agent)
- [x] `GET /map/reports` bbox query
- [x] ReportMap with clustering, colored markers, filters, legend

## Phase 5 — AI
- [x] Model obtained or trained; metrics recorded
- [x] `/predict` with severity + dominant-category logic
- [x] API-key guard on the AI service
- [x] `aiClient.js` (timeout, retry, graceful failure)
- [x] `POST /reports/analyze`
- [x] Store AI fields; `needs_review` rule
- [x] Client: analysis step, AI chip, category override

## Phase 6 — Duplicates & Tracking
- [x] `duplicates.js` PostGIS query
- [x] `POST /reports/check-duplicates`
- [x] `POST /reports/:id/confirm` + count/priority update
- [x] DuplicateModal
- [x] Status transition rules + `report_status_history`
- [x] Notifications table + endpoints + email sender
- [x] Client: Timeline, notification bell, public `/track`
- [x] Reopen within 7 days

## Phase 7 — Admin & Analytics
- [x] Admin reports list (filters, pagination, search)
- [x] Status / assign / priority / category / merge / bulk endpoints
- [x] Departments CRUD
- [x] Admin users management
- [x] Analytics endpoints (summary, category, status, trend, hotspots, top-areas, resolution-time, ai-accuracy)
- [x] Client: Dashboard, ReportsTable, ReviewPage, Analytics (charts + heatmap)

## Phase 8 — Hardening & Deploy
- [x] Rate limits, helmet, CORS allow-list, trust proxy
- [x] Input validation audit (every route has a Zod schema)
- [x] Server integration tests + AI pytest
- [x] Demo data seeded (50+ reports)
- [x] Neon DB, Render (server + AI), Vercel (client) deployed
- [x] Post-deploy checklist passed
- [x] README: architecture diagram, screenshots, AI metrics, live link
- [ ] Demo video recorded

## Stretch Goals
- [ ] pHash image similarity for duplicates
- [ ] PWA / installable app
- [ ] Multi-language (English/Telugu/Hindi)
- [ ] Upvote-based public prioritization
- [x] Before/after resolution photo from admin
- [x] Export analytics to CSV/PDF
