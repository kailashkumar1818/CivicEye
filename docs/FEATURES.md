# Feature → Implementation Map

All 9 features from the original spec.

| # | Feature | Phase |
|---|---------|-------|
| 1 | User authentication and profiles | 2 |
| 2 | Upload images of civic problems | 3 |
| 3 | AI automatically identifies the problem | 5 |
| 4 | GPS-based location detection | 4 |
| 5 | Interactive map of reported problems | 4 |
| 6 | Citizens track complaint status | 6 |
| 7 | Government/admin dashboard | 7 |
| 8 | Analytics of most problematic areas | 7 |
| 9 | Duplicate complaint detection | 6 |

---

## 1. Authentication & Profiles
- **Roles:** `citizen`, `admin` (optionally `officer` for department staff).
- **Backend:** `modules/auth`, `modules/users`. bcrypt (12 rounds), JWT access + rotating refresh token (hash stored in `refresh_tokens`).
- **Frontend:** Login, Register, Profile, `ProtectedRoute`, `AdminRoute`.
- **Profile fields:** name, email, phone, avatar, city, notification preferences.

## 2. Image Upload
- Client validates type/size, shows preview, compresses to max 1600 px before upload (`browser-image-compression`).
- Server validates with multer and magic-byte check, uploads to Cloudinary, saves `image_url` and `image_public_id`.
- Up to 3 images per report (`report_images` table).

## 3. AI Problem Identification
- Python service runs YOLO. Server sends the image bytes and receives `{category, confidence, severity, detections[]}`.
- Categories: `pothole`, `garbage`, `broken_streetlight`, `damaged_road`, `other`.
- Severity from bounding-box area ratio (`low` / `medium` / `high`).
- Confidence below `AI_MIN_CONFIDENCE` → `needs_review = true`. If the AI is down, the report is still accepted with `ai_status = 'unavailable'`.
- User can override the AI category; both values are stored so the override rate can be measured.

## 4. GPS Location Detection
Priority order:
1. `navigator.geolocation.getCurrentPosition` (high accuracy)
2. EXIF GPS from the photo (`exifr`)
3. Manual: click or drag the marker on the map
- Reverse geocode to an address (Nominatim, cached) and store `address`, `city`, `ward`/`area`.
- Store as `GEOGRAPHY(Point, 4326)`.

## 5. Interactive Map
- Leaflet + OpenStreetMap tiles (no API key), `leaflet.markercluster`.
- Markers colored by category, border by status.
- Fetches only reports inside the viewport (`bbox`), debounced on `moveend`.
- Filters: category, status, date range. Popup: photo, title, status, "View details".

## 6. Complaint Status Tracking
- Statuses: `submitted → under_review → assigned → in_progress → resolved` (or `rejected`).
- Each change inserts into `report_status_history` (who, when, note).
- Citizen sees a timeline; gets email + in-app notification.
- Complaint ID format: `CE-2026-000123`.
- Citizen can reopen within 7 days of resolution if the issue persists.

## 7. Admin Dashboard
- Table with filters, search, pagination, bulk status update.
- Report detail: AI result vs citizen category, map, history, internal notes.
- Actions: update status, assign department, set priority, reject, mark duplicate/merge.
- "Needs review" queue for low-confidence AI results.
- Role guard on every route (server and client).

## 8. Analytics
| Metric | Method |
|--------|--------|
| Totals / open / resolved | `COUNT` + `FILTER` |
| By category / status / severity | `GROUP BY` |
| Trend over time | `date_trunc('day'/'week')` |
| Avg resolution time | `AVG(resolved_at - created_at)` |
| Hotspots | `ST_SnapToGrid` (about 500 m) → count per cell |
| Most problematic areas | `GROUP BY area` ordered by open count |
| Heatmap | `leaflet.heat` fed by hotspot cells |

## 9. Duplicate Detection
```
New report (category C, point P)
   │
   ▼
SELECT ... WHERE category = C
   AND status NOT IN ('resolved','rejected')
   AND created_at > now() - interval '30 days'
   AND ST_DWithin(location, P, 30)       -- meters
   │
   ├─ none  → create normally
   └─ found → show matches to the citizen
               ├─ "Same issue" → add confirmation (upvote), no new report
               └─ "Different"  → create, flag possible_duplicate_of
```
- Confirmation count raises priority. Admin can merge duplicates (`duplicate_of`).
- Optional upgrade: perceptual image hash (`pHash`) to boost matching confidence.
