# FlagShip — Enterprise Feature Flags Platform (LaunchDarkly-style)

FlagShip is a high-level, portfolio-grade **feature flags + targeting** platform:
- Multi-tenant: **Organizations → Projects → Environments**
- **Feature flags** with per-environment state
- Targeting rules (basic) + deterministic percentage rollout
- **RBAC** (Owner/Admin/Developer/Viewer)
- **Audit log**
- Public **SDK evaluate endpoint** (protected by environment client key)
- Polished **React + Tailwind** UI
- **Django Admin** with superuser access

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
- TanStack Query
- Axios
- Lucide icons

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
- Backend API: http://localhost:8000/api/health/
- Django Admin: http://localhost:8000/admin/

### 3) Create superuser (admin)
In a new terminal:
```bash
docker compose exec backend python manage.py createsuperuser
```

### 4) (Optional) Seed demo data
```bash
docker compose exec backend python manage.py seed_demo
```

### 5) Login
- Register a normal user in UI (creates your first org automatically), OR
- Login as the superuser in the UI (superuser can access everything)

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

## How Feature Evaluation Works (SDK endpoint)

### Evaluate all flags for an environment
`POST /api/sdk/evaluate/`

Header:
- `X-Client-Key: <environment_client_sdk_key>`

Body example:
```json
{
  "user": {
    "key": "user_123",
    "email": "user@example.com",
    "country": "US",
    "plan": "pro"
  }
}
```

---

## Project Structure

```
flagship-feature-flags/
  backend/
  frontend/
  docker-compose.yml
```

---

## Notes
- This is designed as a **portfolio-grade enterprise starter**. You can expand it:
  - segments, prerequisites, approvals, multi-variation flags, webhooks
  - SSO, SCIM, granular permissions, change requests, etc.
