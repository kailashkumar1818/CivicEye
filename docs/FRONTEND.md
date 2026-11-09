# Frontend Implementation (React + Vite + Tailwind)

## Dependencies
```
npm i react-router-dom axios @tanstack/react-query react-hook-form zod @hookform/resolvers
npm i leaflet react-leaflet leaflet.markercluster leaflet.heat
npm i recharts exifr browser-image-compression react-hot-toast date-fns lucide-react
npm i -D tailwindcss postcss autoprefixer
```

## Routes

| Path | Page | Access |
|------|------|--------|
| `/` | Home (hero, stats, how it works) | public |
| `/map` | Public map of reports | public |
| `/track` | Track by complaint number | public |
| `/login`, `/register` | Auth | guest |
| `/report/new` | New report wizard | citizen |
| `/my-reports` | My complaints | citizen |
| `/reports/:id` | Detail + timeline | owner/admin |
| `/profile` | Profile, notifications settings | citizen |
| `/admin` | Dashboard | admin |
| `/admin/reports` | Table with filters | admin |
| `/admin/reports/:id` | Review + actions | admin |
| `/admin/analytics` | Charts + heatmap | admin |
| `/admin/users` | User management | admin |

## State
- **Server state:** TanStack Query (reports, analytics, notifications), with cache keys like `['reports','mine',filters]`.
- **Auth state:** `AuthContext` (user, tokens in memory + refresh token in `localStorage`).
- **Axios interceptor:** on 401, call `/auth/refresh` once, then retry the request; on failure, log out.

## Key Screens

### 1. New Report Wizard (4 steps)
```
Step 1 Photo      → pick/take photo, preview, compress, read EXIF GPS
        └─ POST /reports/analyze  → AI result chip: "Pothole · 87%"
Step 2 Location   → useGeolocation(); LocationPicker map (draggable marker);
                    show reverse-geocoded address
Step 3 Details    → category (pre-filled by AI, editable), title, description
        └─ POST /reports/check-duplicates → DuplicateModal if matches
Step 4 Review     → summary + Submit → POST /reports → redirect to detail
```
`DuplicateModal`: lists nearby matches (photo, distance, status) with buttons **"Same issue (add my vote)"** and **"This is different"**.

### 2. Report Detail
Image carousel · StatusBadge · map pin · AI result · confirmation count · **Timeline** (status history) · Reopen button if resolved within 7 days.

### 3. Public Map (`ReportMap`)
- `MapContainer` + OSM `TileLayer` (URL from `VITE_MAP_TILE_URL`).
- `MarkerClusterGroup`; marker color by category, ring by status.
- On `moveend` (debounced 400 ms) call `/map/reports?bbox=...`.
- Filter bar: category, status, date range.
- Legend component.

### 4. Admin Dashboard
- KPI cards: total, open, resolved, avg resolution time, needs review.
- Charts (Recharts): category pie, status bar, trend line.
- Top areas table; link to the heatmap.

### 5. Admin Reports Table
Filters, search, pagination, row select + bulk status. Badge for **needs review** and **AI ≠ citizen category**.

### 6. Admin Review Page
Left: images + map. Right: AI result vs citizen category, status dropdown with note, department assign, priority, merge-duplicate dialog, history with internal notes.

### 7. Analytics Page
Heatmap (`leaflet.heat` fed by `/analytics/hotspots`), top areas, resolution time by category, AI accuracy.

## Reusable Components
`StatusBadge`, `SeverityBadge`, `CategoryIcon`, `Timeline`, `ImageUploader`, `LocationPicker`, `ReportCard`, `DataTable`, `Modal`, `ConfirmDialog`, `EmptyState`, `Skeleton`, `ProtectedRoute`, `AdminRoute`.

## `useGeolocation` Hook (behavior)
```
request getCurrentPosition({enableHighAccuracy:true, timeout:10000})
 ├─ success → {lat, lng, accuracy}
 ├─ denied  → fall back to EXIF coords, else manual pin
 └─ warn if accuracy > 100 m ("Please adjust the pin")
```

## Leaflet + Vite Gotchas
- Import `leaflet/dist/leaflet.css` once.
- Default marker icons break under Vite: set icons explicitly via `L.icon({iconUrl, ...})` or use `L.divIcon` (recommended for colored markers).
- Map container needs an explicit height (`h-[70vh]`).

## UX Requirements
- Mobile-first (citizens use phones); camera capture via `<input type="file" accept="image/*" capture="environment">`.
- Loading skeletons, toast errors, empty states.
- Accessibility: labels, focus states, color + text for status (not color alone).
- Show "AI is analyzing..." and a cold-start message for slow AI responses.

## Design Tokens (Tailwind)
Category colors: pothole `orange`, garbage `green`, streetlight `yellow`, damaged road `red`, other `gray`.
Status colors: submitted `slate`, under_review `blue`, assigned `indigo`, in_progress `amber`, resolved `emerald`, rejected `rose`.
