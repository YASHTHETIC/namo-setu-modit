# Deployment Guide — Namo Setu + MODIT

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    VERCEL (CDN)                      │
│  ┌───────────────────┐  ┌───────────────────┐       │
│  │  Namo Setu        │  │  MODIT            │       │
│  │  namo-setu.       │  │  modit.           │       │
│  │  vercel.app/namo  │  │  vercel.app/modit │       │
│  └────────┬──────────┘  └────────┬──────────┘       │
└───────────┼──────────────────────┼───────────────────┘
            │                      │
            ▼                      ▼
┌─────────────────────────────────────────────────────┐
│                RAILWAY (Backend)                     │
│  FastAPI + Alembic + Uvicorn                        │
│  your-app.up.railway.app                            │
│  /api/v1/healthz                                    │
└───────┬──────────────────────────┬──────────────────┘
        │                          │
        ▼                          ▼
┌──────────────────┐    ┌──────────────────┐
│  NEON (Postgres) │    │  UPSTASH (Redis) │
│  ep-xxx.neon.tech│    │  xxx.upstash.io  │
└──────────────────┘    └──────────────────┘
```

## Cost

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Hobby | Free |
| Railway | Hobby ($5 credit) | Free (demo usage) |
| Neon | Free tier | Free |
| Upstash | Free tier | Free |
| **Total** | | **$0/month** |

## Deployment Order

1. **Neon** → Create PostgreSQL database → Get connection string
2. **Upstash** → Create Redis database → Get connection URL
3. **Railway** → Deploy backend → Set env vars → Verify health
4. **Vercel** → Deploy Namo Setu → Set API URL → Verify
5. **Vercel** → Deploy MODIT → Set API URL → Verify

---

## Step 1: Neon PostgreSQL

### Setup
1. Go to https://neon.tech → Sign up (free)
2. Click "Create Project"
3. Choose region: **AWS US East (Ohio)** or closest to your users
4. Project name: `namo-setu-modit`
5. Click "Create"
6. Copy the connection string (it looks like):
   ```
   postgresql://neondb_owner:xxxx@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
7. **Important**: Replace `postgresql://` with `postgresql+asyncpg://` for the backend
   ```
   postgresql+asyncpg://neondb_owner:xxxx@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### Run Migrations
After Railway is deployed, migrations run automatically. Or run manually:
```bash
DATABASE_URL="postgresql+asyncpg://..." PYTHONPATH=. alembic -c backend/alembic.ini upgrade head
```

### Seed Data
```bash
DATABASE_URL="postgresql+asyncpg://..." PYTHONPATH=. python -m seeds.runner
```

---

## Step 2: Upstash Redis

### Setup
1. Go to https://upstash.com → Sign up (free)
2. Click "Create Database"
3. Name: `namo-setu-modit`
4. Region: **US East (N. Virginia)** or closest
5. Click "Create"
6. Copy the **Redis URL** (REST API URL):
   ```
   redis://default:xxxx@xxx.upstash.io:6379
   ```

---

## Step 3: Railway (Backend)

### Setup
1. Go to https://railway.app → Sign up with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will auto-detect Python
5. Go to **Settings**:
   - **Root Directory**: `.` (leave empty or set to `.`)
   - **Build Command**: `pip install --no-cache-dir -r requirements.txt`
   - **Start Command**: `chmod +x railway-start.sh && ./railway-start.sh`
6. Go to **Variables** and add:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql+asyncpg://neondb_owner:xxxx@ep-xxx.neon.tech/neondb?sslmode=require` |
| `REDIS_URL` | `redis://default:xxxx@xxx.upstash.io:6379` |
| `JWT_SECRET_KEY` | (generate: `python -c "import secrets; print(secrets.token_hex(32))"`) |
| `BACKEND_CORS_ORIGINS` | `https://namo-setu.vercel.app,https://modit.vercel.app` |
| `ENVIRONMENT` | `production` |
| `LOG_LEVEL` | `INFO` |

7. Click "Deploy" → Wait for deployment
8. Note your Railway URL (e.g., `https://your-app.up.railway.app`)

### Verify
```bash
curl https://your-app.up.railway.app/api/v1/healthz
# Should return: {"status":"ok","dependencies":{"database":true,"redis":true}}
```

### Swagger Docs
Open: `https://your-app.up.railway.app/docs`

---

## Step 4: Vercel — Namo Setu

### Setup
1. Go to https://vercel.com → Sign up with GitHub
2. Click "Add New Project" → "Import Git Repository"
3. Select your repository
4. **Important**: Configure as follows:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/namo-setu/web` (click "Edit" and set)
   - **Build Command**: (leave default or set `npm install && cd ../../.. && npm install && cd apps/namo-setu/web && npm run build`)
   - **Output Directory**: `.next`
5. Click "Environment Variables" and add:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_BASE_URL` | `https://your-app.up.railway.app/api/v1` |

6. Click "Deploy"
7. Note your URL: `https://namo-setu-xxx.vercel.app`

### If build fails (monorepo issue)
If Vercel can't find shared packages, set these in project settings:
- **Install Command**: `cd ../../.. && npm install`
- **Build Command**: `cd ../../.. && npm install && cd apps/namo-setu/web && npm run build`

### Verify
Open: `https://your-project.vercel.app/namo`

---

## Step 5: Vercel — MODIT

### Setup
1. In the same Vercel team, click "Add New Project"
2. Import the same repository
3. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/modit/web`
   - **Build Command**: (same as Namo Setu)
   - **Output Directory**: `.next`
4. Add environment variable:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_BASE_URL` | `https://your-app.up.railway.app/api/v1` |

5. Click "Deploy"
6. Note your URL: `https://modit-xxx.vercel.app`

### Verify
Open: `https://your-project.vercel.app/modit`

---

## Post-Deployment Checklist

- [ ] Neon database is running and accessible
- [ ] Upstash Redis is running and accessible
- [ ] Railway backend health check passes: `GET /api/v1/healthz`
- [ ] Railway runs Alembic migrations automatically
- [ ] Railway seeds demo data automatically
- [ ] Namo Setu loads at Vercel URL
- [ ] MODIT loads at Vercel URL
- [ ] API calls from frontend to backend work (check browser console)
- [ ] CORS is configured correctly (no CORS errors in browser)
- [ ] Swagger UI accessible at backend URL `/docs`

## Troubleshooting

### Backend won't start
- Check Railway logs for migration errors
- Verify DATABASE_URL uses `postgresql+asyncpg://` (not `postgresql://`)
- Verify `?sslmode=require` is in the Neon URL

### Frontend can't reach API
- Check `NEXT_PUBLIC_API_BASE_URL` is set correctly in Vercel
- Verify CORS includes your Vercel domain
- Check browser Network tab for failed requests

### Build fails on Vercel
- Ensure root `package.json` has workspaces configured
- Try setting install command to: `cd ../../.. && npm install`
- Check that `@foundation/*` packages are installed

### Migrations fail
- Ensure DATABASE_URL is set in Railway env vars
- Check Railway logs for PostgreSQL connection errors
- Verify Neon database is not paused (free tier pauses after inactivity)
