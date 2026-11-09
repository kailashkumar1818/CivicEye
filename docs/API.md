# REST API Reference

Base URL: `/api` · Auth: `Authorization: Bearer <accessToken>` · JSON unless noted.

## Auth
| Method | Path | Auth | Body / Notes |
|--------|------|------|--------------|
| POST | `/auth/register` | – | `{name, email, password, phone?}` |
| POST | `/auth/login` | – | `{email, password}` → `{user, accessToken, refreshToken}` |
| POST | `/auth/refresh` | – | `{refreshToken}` → new pair (rotation) |
| POST | `/auth/logout` | user | revokes refresh token |
| GET  | `/auth/me` | user | current user |

## Users
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET   | `/users/me` | user | profile + report stats |
| PATCH | `/users/me` | user | name, phone, city, notification pref |
| POST  | `/users/me/avatar` | user | multipart `avatar` |
| PATCH | `/users/me/password` | user | `{currentPassword, newPassword}` |

## Reports (citizen)
| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/reports/analyze` | user | multipart `image` → `{category, confidence, severity, detections}` (no DB write) |
| POST | `/reports/check-duplicates` | user | `{lat, lng, category}` → nearby open reports |
| POST | `/reports` | user | multipart: `images[]` (1–3), `title`, `description`, `category`, `lat`, `lng`, `locationSource` |
| GET  | `/reports/mine` | user | `?status=&page=&limit=` |
| GET  | `/reports/:id` | user | owner or admin; includes images + timeline (internal notes only for admin) |
| POST | `/reports/:id/confirm` | user | "same issue" (one per user) |
| POST | `/reports/:id/reopen` | owner | allowed ≤ 7 days after `resolved` |
| GET  | `/reports/track/:complaintNo` | – | public status lookup (limited fields) |

## Map (public)
| Method | Path | Notes |
|--------|------|-------|
| GET | `/map/reports` | `?bbox=w,s,e,n&category=&status=&from=&to=` (max 500, clustered client-side) |

## Notifications
| Method | Path | Notes |
|--------|------|-------|
| GET   | `/notifications` | `?unread=true` |
| PATCH | `/notifications/:id/read` | |
| PATCH | `/notifications/read-all` | |

## Admin (role: admin / officer)
| Method | Path | Notes |
|--------|------|-------|
| GET   | `/admin/reports` | filters: `status, category, severity, needsReview, area, q, from, to, sort, page, limit` |
| GET   | `/admin/reports/:id` | full detail + AI vs citizen category + confirmations |
| PATCH | `/admin/reports/:id/status` | `{status, note?, isInternal?, rejectionReason?}` |
| PATCH | `/admin/reports/:id/assign` | `{departmentId, assignedTo?}` |
| PATCH | `/admin/reports/:id/priority` | `{priority}` |
| PATCH | `/admin/reports/:id/category` | correct the category |
| POST  | `/admin/reports/:id/merge` | `{duplicateOfId}` |
| POST  | `/admin/reports/bulk-status` | `{ids[], status}` |
| GET   | `/admin/departments` | list |
| POST  | `/admin/departments` | create (admin only) |
| GET   | `/admin/users` | list/search |
| PATCH | `/admin/users/:id` | role / active (admin only) |

## Analytics (admin)
| Method | Path | Returns |
|--------|------|---------|
| GET | `/analytics/summary` | totals, open, resolved, avg resolution time, needs-review count |
| GET | `/analytics/by-category` | `[{category, count}]` |
| GET | `/analytics/by-status` | `[{status, count}]` |
| GET | `/analytics/trend?interval=day|week&from=&to=` | time series |
| GET | `/analytics/hotspots?limit=100` | `[{lat, lng, total}]` for heatmap |
| GET | `/analytics/top-areas?limit=10` | areas ranked by open reports |
| GET | `/analytics/resolution-time` | avg per category |
| GET | `/analytics/ai-accuracy` | AI vs final category match rate |

## Health
`GET /health` → `{status:"ok", db:"up", ai:"up|down"}`

## Status Transitions (enforced server-side)
```
submitted ──▶ under_review ──▶ assigned ──▶ in_progress ──▶ resolved
    │              │              │             │              │
    └──────────────┴──────────────┴─────────────┴──▶ rejected   └──▶ (reopen) under_review
```

## Status Codes
`200/201` ok · `400` validation · `401` unauthenticated · `403` forbidden · `404` not found · `409` conflict (e.g., already confirmed) · `413` file too large · `429` rate limited · `502` AI service error (non-fatal for submission)
