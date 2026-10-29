# JalSwaraj

A community water accountability platform for housing societies. Track water usage, identify discrepancies, and compete on the conservation leaderboard.

## Tech Stack

- **Backend**: Python · FastAPI · SQLAlchemy · SQLite (dev) / PostgreSQL (prod) · Argon2 · PyJWT
- **Frontend**: React 19 · Vite · Tailwind CSS · Recharts · Framer Motion · Axios

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env          # edit SECRET_KEY
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
# from project root
npm install
npm run dev                   # http://localhost:5173
```

API docs: http://localhost:8000/docs

## Features

- Society registration & committee login (httpOnly cookie JWT)
- Water report submission with auto water-balance calculation
- Automated alert rules (high unaccounted water, inconsistent totals, late reports, etc.)
- Dashboard with analytics charts (Recharts)
- Public leaderboard scored on efficiency, improvement & accountability
- Educational water articles

## Project Structure

```
jal-swaraj/
├── backend/app/
│   ├── api/          # FastAPI routers
│   ├── calculations/ # Water math & scoring
│   ├── models/       # SQLAlchemy ORM models
│   ├── schemas/      # Pydantic schemas
│   ├── security/     # JWT & Argon2
│   └── services/     # Business logic
├── frontend/src/
│   ├── components/
│   ├── context/
│   ├── layouts/
│   ├── pages/
│   └── services/
└── docs/
```

> **Note:** All water figures are self-reported by societies and are not independently verified. This is a student project.
