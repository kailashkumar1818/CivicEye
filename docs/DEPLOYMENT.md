# Deployment

```
Vercel (client) ──▶ Render (server) ──▶ Neon (Postgres+PostGIS)
                          │
                          ├──▶ Render / HF Spaces (ai-service)
                          └──▶ Cloudinary
```

## Free-Tier Realities
- Render free web services sleep after 15 min idle, so the first request takes about a minute.
- **Render's free Postgres expires after 30 days. Use Neon or Supabase for the database.**
- Free services share 750 instance hours per month across the workspace.
- Hugging Face Spaces (Docker) is a good alternative for the AI service if Render's free RAM is too small for PyTorch + YOLO.

Check current limits before deploying, as free tiers change.

## Order of Deployment
1. Database → 2. AI service → 3. Server → 4. Client → 5. Update CORS.

## 1. Database (Neon)
1. Create a project and database `civiceye`.
2. SQL editor: `CREATE EXTENSION IF NOT EXISTS postgis;`
3. Copy the connection string (with `?sslmode=require`).
4. Run migrations from your machine: `DATABASE_URL=... npm run migrate && npm run seed`.

## 2. AI Service (Render, Docker)
`ai-service/Dockerfile`
```dockerfile
FROM python:3.11-slim
RUN apt-get update && apt-get install -y libgl1 libglib2.0-0 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
```
- Install CPU-only torch to save memory: `pip install torch --index-url https://download.pytorch.org/whl/cpu`.
- Keep weights small (yolov8n). Do not commit `.pt` files, so either use Git LFS or set `MODEL_DOWNLOAD_URL`.
- Env: `AI_SERVICE_API_KEY`, `MODEL_PATH`, `CONFIDENCE_THRESHOLD`, `DEVICE=cpu`, `ALLOWED_ORIGINS`.
- Health check path: `/health`.

## 3. Server (Render, Node web service)
- Root directory: `server` · Build: `npm ci` · Start: `node src/server.js`
- Health check: `/api/health`
- Env (all from `server/.env`), with these changes:
  - `NODE_ENV=production`, `DB_SSL=true`
  - `DATABASE_URL` = Neon string
  - `CLIENT_URL` / `CORS_ORIGINS` = Vercel URL
  - `AI_SERVICE_URL` = AI service URL
  - New, strong `JWT_*` secrets
- Add `app.set('trust proxy', 1)` so rate limiting sees real IPs behind Render.

## 4. Client (Vercel)
- Root directory: `client` · Framework: Vite · Build: `npm run build` · Output: `dist`
- Env: `VITE_API_BASE_URL=https://<server>.onrender.com/api`
- Add `client/vercel.json` for SPA routing:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
```

## 5. Final Wiring
- Set the Vercel URL in the server's `CORS_ORIGINS`, then redeploy the server.
- Keep-alive (optional): a free uptime pinger (e.g., UptimeRobot) hitting `/api/health` every 10 min reduces cold starts but uses free hours.

## Post-Deploy Checklist
- [ ] `/api/health` shows db and ai up
- [ ] Register, login, refresh token works over HTTPS
- [ ] Image upload reaches Cloudinary
- [ ] AI analysis works from the live client
- [ ] Map, duplicate check, admin dashboard work
- [ ] Email notification sent (or disabled gracefully)
- [ ] No secrets in the Git history (`git log -p | grep -i secret`)
- [ ] CORS limited to the real client origin

## CI (optional, GitHub Actions)
On push: install, lint, run server tests and a client build. Deploys happen automatically via Render and Vercel Git integration.
