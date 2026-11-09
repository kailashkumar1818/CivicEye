# Testing Plan & Demo Script

## Tools
Server: Vitest + Supertest (use a separate test DB) · Client: Vitest + React Testing Library · AI: pytest · Manual: Postman/Thunder Client collection.

## Priority Tests (do these, skip the rest if short on time)

### Server (integration)
| Area | Test |
|------|------|
| Auth | register → login → access protected route; wrong password → 401; refresh rotation; reused refresh token rejected |
| Roles | citizen calling `/admin/*` → 403 |
| Ownership | user A cannot read user B's report detail → 403/404 |
| Reports | valid submission → 201 with `complaint_no`; invalid category/lat/lng → 400; oversized/non-image file → 413/400 |
| Duplicates | report at P, then check 10 m away → match; 100 m away → none; resolved report → no match |
| Confirm | second confirm by the same user → 409; count increments |
| Status | invalid transition (`submitted → resolved`) → 400; valid change writes history row + notification |
| Map | bbox returns only inside-viewport reports |
| Analytics | counts match seeded data |
| AI down | mock the AI client to fail → report still created with `ai_status='unavailable'` |

### AI service (pytest)
- `/health` returns model_loaded true
- Known pothole sample → category `pothole`
- Blank/normal-road image → `other` or low confidence
- Missing/invalid `X-API-Key` → 401
- Non-image file → 400

### Client
- Login form validation
- `ProtectedRoute` / `AdminRoute` redirect
- Report wizard: step gating, duplicate modal shows on matches

## AI Evaluation (for the README)
Hold out a test set the model never saw.

| Metric | Result |
|--------|--------|
| Precision | |
| Recall | |
| mAP@0.5 | |
| Confusion matrix | (image) |
| Category match: AI vs final | from `/analytics/ai-accuracy` |

## Manual QA Checklist
- [ ] Mobile Chrome and Safari: camera capture, GPS permission prompt, map gestures
- [ ] GPS denied → manual pin works
- [ ] Photo with no EXIF and no GPS
- [ ] Very large photo (10 MB) rejected with a friendly message
- [ ] Slow network / AI cold start shows a loading message
- [ ] Token expiry while on a page refreshes silently
- [ ] Two reports at the same spot trigger a duplicate prompt
- [ ] Admin changes status → citizen timeline + notification update

## Demo Script (3–4 minutes)
1. **Home** — problem statement in one line.
2. **Citizen** registers, takes a pothole photo → AI shows "Pothole · 87%, High".
3. Location auto-detected, address filled → submit → complaint number.
4. **Duplicate:** a second user reports at the same spot → "Similar report 12 m away" → "Same issue" (confirmation count goes to 2).
5. **Public map** with clusters and filters.
6. **Admin** logs in → needs-review queue → assigns to Roads dept → "In progress" → "Resolved" with note.
7. Switch back to the citizen: the timeline and notification update.
8. **Analytics:** heatmap, top areas, trend, resolution time.
9. Close with architecture diagram + AI metrics.

## Interview Talking Points
- Why PostGIS (`ST_DWithin` duplicate search, GIST index, bbox queries)
- Why the AI is "assistive": confidence threshold + human review + override tracking
- Graceful degradation when the AI service is down
- Refresh-token rotation and role enforcement on the server
- Free-tier constraints and the decisions they forced (Neon over Render DB)
