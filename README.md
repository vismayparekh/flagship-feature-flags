# FlagShip — Feature Flags Platform

FlagShip is a portfolio-grade **Feature Flags + Targeting + Rollouts** platform:
- Multi-tenant: **Organizations → Projects → Environments**
- **Feature flags** with per-environment state (enabled + rollout %)
- **Targeting rules** (basic clause builder) + deterministic rollout
- **RBAC** (Owner/Admin/Developer/Viewer)
- **Audit log** (tracks meaningful changes)
- Public **SDK evaluate endpoint** (protected by per-environment client key)
- Polished **React + Tailwind** UI
- **Django Admin** with superuser access (superuser sees everything)

## 🌐 Live Demo
- Frontend (Web App): https://flagship-feature-flags.vercel.app  
- Backend (API Base): https://flagship-feature-flags.onrender.com  
- Health Check: https://flagship-feature-flags.onrender.com/api/health/  
- Django Admin: https://flagship-feature-flags.onrender.com/admin/  

> Note: Render Free can “sleep” when idle. First API request may take ~30–60 seconds.

---
## What is FlagShip?

FlagShip is a **feature flags platform** (similar to LaunchDarkly) that helps teams **release and control features safely** without redeploying code.

Instead of pushing a risky change directly to 100% users, you can:
- Turn a feature **ON/OFF instantly**
- Roll it out to **5% → 20% → 50% → 100%** gradually
- Target only specific users (example: `vip_*`, country = `US`, plan = `pro`)
- Track who changed what using an **audit log**

This is exactly how real companies ship changes in production without breaking things.

---

## Why is it useful?

In real production systems, releasing features is risky:
- A new UI/checkout can break payments
- A fraud rule change can block real customers
- A backend migration can increase latency

FlagShip solves this by giving you:
✅ **Safe rollouts** (gradual release)  
✅ **Instant rollback** (turn OFF in 1 second)  
✅ **Targeted release** (only certain users get it)  
✅ **Multi-environment control** (staging vs prod)  
✅ **Enterprise access control** (RBAC)  
✅ **Audit trail** (compliance + debugging)

---

## Real-world examples

You would use this platform when:
- You want to test a new checkout with 10% users first
- You want only internal employees to see a “beta” feature
- You want to enable a feature only for premium customers
- You want to roll back instantly if errors increase
- You want full tracking for compliance (finance/healthcare)

---

## What makes this project “enterprise-grade”?

FlagShip is built like a real enterprise SaaS product:
- Multi-tenant structure: **Organizations → Projects → Environments**
- **RBAC permissions** (Owner/Admin/Developer/Viewer)
- **Audit log** for every meaningful change
- Deterministic rollout (same user gets consistent results)
- Public **SDK Evaluate** endpoint protected by a client key
- Clean professional UI (React + Tailwind)
- Django Admin (superuser sees all data like a platform admin)

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Quick Start (Docker)](#quick-start-docker--recommended)
- [First Run: End-to-End Example](#first-run-end-to-end-example)
- [SDK Evaluate API](#sdk-evaluate-api)
- [RBAC (Who can do what)](#rbac-who-can-do-what)
- [Environment Variables](#environment-variables)
- [Local Setup (No Docker)](#local-setup-no-docker)
- [Troubleshooting](#troubleshooting)
- [GitHub: Push the project](#github-push-the-project)
- [Deployment Options (Recommended)](#deployment-options-recommended)
- [Roadmap Ideas](#roadmap-ideas)

---

## Features

### Feature Flags
- Create a flag once per Project
- Each Environment has its own state:
  - `enabled` (true/false)
  - `rollout_percentage` (0–100)

### Targeting Rules
- Per-flag-state rules:
  - Priority ordering (lower runs first)
  - Clause matching (field/op/value)
  - Optional per-rule rollout %
  - Variation output (basic boolean value)

### SDK Tester behavior
- Deterministic rollout:
  - Same user key always gets same result for a given flag
  - Useful for safe production ramp-ups

---

## Tech Stack

**Backend**
- Python 3.11
- Django + Django REST Framework
- SimpleJWT (access/refresh tokens)
- PostgreSQL (Docker), SQLite fallback (local)

**Frontend**
- React + TypeScript (Vite)
- TailwindCSS
- React Router
- Axios
- Lucide icons

---

## Architecture

**UI (React)** talks to **API (Django REST)** via JWT auth.

**SDK Evaluate endpoint** is public but protected using the environment **client key**:
- `POST /api/sdk/evaluate/`
- `X-Client-Key: <env_client_sdk_key>`
- Returns all flag decisions for the given environment + user.

---

## Quick Start (Docker – Recommended)

### 1) Prereqs
- Docker + Docker Compose

### 2) Start everything
```bash
cd flagship-feature-flags
docker compose up --build
```

Services:
- Frontend: http://localhost:5173
- Backend API health: http://localhost:8000/api/health/
- Django Admin: http://localhost:8000/admin/

### 3) Create superuser (admin)
In a new terminal:
```bash
docker compose exec backend python manage.py createsuperuser
```

### 4) Login
- Register a normal user in the UI (recommended for testing multi-tenancy), OR
- Login as the superuser (superuser can access everything)

### 5) Stop / start later
```bash
# stop containers
docker compose down

# start again
docker compose up
```

---

## First Run: End-to-End Example

This is a full real-world flow to confirm EVERYTHING works.

### Step 1 — Create a normal user
1. Open UI: http://localhost:5173
2. Go to **Register**
3. Create a user (example):
   - Email: `alice@test.com`
   - Password: `StrongPass123!`
4. Login

✅ Expected: your first org is created (or you can create org from UI if enabled).

---

### Step 2 — Create a project and environments
1. Go to **Projects**
2. Click **New Project**
   - Name: `Payments Platform`
   - Key: `payments`
   - Description: `Checkout & payments services`
3. Click the project → add environments:
   - `Staging` / `stage`
   - `Production` / `prod`

✅ Expected:
- Environments show client/server keys
- Copy button works

---

### Step 3 — Create feature flags
1. Go to **Feature Flags**
2. Select:
   - Project: `Payments Platform`
   - Environment: `Production (prod)`
3. Click **New Flag**
   - Name: `New Checkout`
   - Key: `new_checkout`
   - Description: `Enable new checkout UI`

✅ Expected:
- You see the flag row
- Toggle works (Enabled on/off)

---

### Step 4 — Rollout % test
1. In **Production**, enable the flag
2. Click the rollout pill (ex: `100%`)
3. Set rollout to `20%`, Save

✅ Expected:
- Pill updates to 20%
- SDK tester shows `reason: rollout_excluded` for many users

---

### Step 5 — Rules test (target VIP users)
1. Click **Rules** icon on `new_checkout`
2. Add rule:
   - Priority: `0`
   - Rollout: `100`
   - Variation: `true`
   - Clause: `User key` → `starts_with` → `vip_`
3. Save

✅ Expected:
- `vip_123` gets `reason: rule_match` + `value: true`
- normal users still follow rollout/default

---

## SDK Evaluate API

### Endpoint
`POST /api/sdk/evaluate/`

### Auth
Header:
- `X-Client-Key: <environment_client_sdk_key>`

Body example:
```json
{
  "user": {
    "key": "user_123",
    "email": "user@example.com",
    "country": "US",
    "plan": "pro",
    "segment": "beta"
  }
}
```

### Curl example
```bash
curl -X POST "http://localhost:8000/api/sdk/evaluate/" \
  -H "Content-Type: application/json" \
  -H "X-Client-Key: YOUR_ENV_CLIENT_KEY" \
  -d '{"user":{"key":"user_123","email":"user@example.com","country":"US","plan":"pro"}}'
```

Response example:
```json
{
  "environment": "prod",
  "flags": {
    "new_checkout": {
      "value": false,
      "reason": "rollout_excluded",
      "variation": { "on": true, "off": false }
    }
  }
}
```

**Reason meanings**
- `off` → flag disabled in this env
- `rollout_excluded` → flag enabled but user falls outside rollout %
- `rule_match` → first matching rule returned a value
- `default` → no rules matched; default variation returned

---

## RBAC (Who can do what)

Roles:
- `viewer` → read-only
- `developer` → create/update flags, states, rules
- `admin` → higher-level project/org actions (varies by implementation)
- `owner` → full org control

**Superuser**
- Sees all orgs/projects/environments/flags across all users
- Bypasses org membership checks

---

## Environment Variables

### Backend (`backend/.env`)
Common local values:
```env
DJANGO_DEBUG=1
DJANGO_SECRET_KEY=dev-secret-change-me
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

CORS_ALLOWED_ORIGINS=http://localhost:5173
CSRF_TRUSTED_ORIGINS=http://localhost:5173

# Docker/Postgres (compose) example:
DATABASE_URL=postgres://postgres:postgres@db:5432/postgres
```

**Production notes**
- Set `DJANGO_DEBUG=0`
- Use a strong `DJANGO_SECRET_KEY`
- Set `DJANGO_ALLOWED_HOSTS=your-domain.com`
- Set CORS/CSRF origins to your frontend domain

### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## Local Setup (No Docker)

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # mac/linux
# .venv\Scripts\activate    # windows

pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Backend: http://localhost:8000

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend: http://localhost:5173

---

## Troubleshooting

### 1) CORS error for `X-Client-Key`
If you see:
`Request header field x-client-key is not allowed by Access-Control-Allow-Headers`

Fix in Django settings:
- ensure CORS is configured to allow `X-Client-Key` header
- then restart backend container

### 2) 404 favicon.ico
This is harmless during dev. If you want to fix it:
- add a favicon to `frontend/public/favicon.ico`

### 3) Reset DB fully (Docker)
⚠️ This deletes all data:
```bash
docker compose down -v
docker compose up --build
```

### 4) View logs
```bash
docker compose logs -f backend
docker compose logs -f frontend
```

---

## GitHub: Push the project

From the repo root (`flagship-feature-flags/`):
```bash
git init
git add .
git commit -m "Initial commit: FlagShip feature flags platform"
```

Create a repo on GitHub (empty), then:
```bash
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

Recommended `.gitignore` checks:
- Make sure you are NOT committing:
  - `.env`
  - `db.sqlite3`
  - `node_modules/`
  - python `__pycache__/`

---

## Deployment Options (Recommended)

### Option A (Simple): Deploy Backend + Frontend separately
**Backend**
- Deploy Django API (Docker) on any platform that supports containers
- Use Postgres in production
- Run migrations on deploy

**Frontend**
- Build static site and deploy to Netlify/Vercel, set:
  - `VITE_API_BASE_URL=https://your-backend-domain`

### Option B (All-in-one): Docker deploy
- Deploy `docker-compose.yml` to a VM (DigitalOcean / AWS EC2 / Lightsail)
- Put Nginx in front (TLS + routing)

**Production checklist**
- DEBUG off
- proper ALLOWED_HOSTS
- Postgres managed DB
- secure SECRET_KEY
- HTTPS enabled
- rotate keys as needed

---

## Roadmap Ideas
To make it even more “enterprise”:
- Multi-variation flags (string/number/json)
- Segments (saved audiences)
- Prerequisites (flag depends on other flag)
- Approvals / change requests
- Webhooks + event streaming
- Metrics: flag toggles graph, rollout trends, impact insights
