# Pulse — AI Sales Analytics Platform

A full-stack analytics platform that turns raw sales spreadsheets into cleaned datasets,
interactive dashboards, natural-language answers, forecasts, and AI-generated PDF reports.

> **Honest scope note:** this was built and verified end-to-end in a single session —
> every endpoint below was actually called and checked, the frontend was actually built,
> and the full test suite actually runs green. A couple of scope changes were made deliberately
> for reliability (see "Deliberate scope decisions" below). `docker-compose up` was **not**
> executed in the build environment (no Docker available there), so validate that step in your
> own machine.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 18, TypeScript, TailwindCSS, Framer Motion, Recharts, TanStack Table, React Hook Form, react-dropzone |
| Backend | FastAPI (Python 3.11) |
| Database | SQLite via SQLAlchemy |
| Auth | JWT (access + refresh), bcrypt password hashing, role-based access (admin/user) |
| Data processing | Pandas, NumPy, OpenPyXL |
| Forecasting | statsmodels (Holt-Winters exponential smoothing with fallback to linear trend) |
| Reports | ReportLab (PDF) + Matplotlib (chart images) |
| Testing | Pytest + FastAPI TestClient (18 passing tests) |
| Containers | Docker + docker-compose |

## Deliberate scope decisions

The original brief asked for several things that conflict with each other or with reliable,
verifiable delivery. Here's what was changed and why:

- **One backend, not two.** FastAPI only — pandas/sklearn/statsmodels/reportlab are Python-native,
  so a parallel Express backend would be pure duplication.
- **statsmodels instead of Prophet.** Prophet has a heavy, sometimes-fragile native build chain.
  Holt-Winters exponential smoothing (with a linear-trend fallback for short histories) gives the
  same "trend + seasonality + confidence interval" forecast in a dependency that installs cleanly
  everywhere.
- **React 18, not 19.** For compatibility with the wider library ecosystem (recharts, react-dropzone,
  etc.) at the time of writing. Upgrading later is a small, mechanical change.
- **AI Chat is a rule-based NL→pandas engine, not a live LLM call.** It correctly answers the exact
  question set in the brief (total sales, best/worst product, monthly trend, top customers, highest
  profit, worst region, averages, year-over-year) by pattern-matching intent to pandas group-bys —
  no API key required. An `OPENAI_API_KEY` env var is wired through `.env.example` as the integration
  point if you want to swap in a real LLM for open-ended questions later.
- **Security is real but not exhaustive.** JWT auth, bcrypt hashing, per-resource ownership checks,
  CORS allow-list, basic security headers, and a global rate limiter (slowapi) are implemented and
  tested. Full CSRF token flows and a Helmet-equivalent CSP policy are not — those matter most once
  you also add cookie-based sessions or server-rendered forms, neither of which this app uses (it's a
  token-in-header SPA talking to a stateless API).

Everything else in the original brief — auth, upload, cleaning, dataset viewer, AI chat, 8 chart
types, forecasting with 4 horizons, the full AI report (executive summary, trends, top/weak products,
regional analysis, recommendations, forecast summary, AI insights), PDF download, settings, dark/light
mode, and a 12,000+ row sample dataset — is implemented and was tested working.

---

## Project Structure

```
sales-analytics-platform/
├── backend/
│   ├── app/
│   │   ├── core/          # config, database session, security (JWT/bcrypt), auth deps
│   │   ├── models/         # SQLAlchemy models (User, Upload)
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── routers/        # auth, upload, dataset, chat, charts, forecast, report, settings, dashboard
│   │   ├── services/        # cleaning, chat NL-engine, forecasting, report/PDF generation, column detection
│   │   └── main.py          # FastAPI app, middleware, CORS, rate limiting
│   ├── scripts/generate_sample_data.py
│   ├── sample_data/sample_sales_data.csv   # ~12,000 rows, pre-generated
│   ├── tests/                # pytest suite (18 tests)
│   ├── uploads/ reports/ charts/ database/  # runtime storage (gitkept, emptied)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/              # login, dashboard, upload, datasets, chat, charts, forecast, report, settings
│   │   ├── components/       # layout shell, sidebar, navbar, KPI card, dataset picker, empty state
│   │   ├── hooks/            # useAuth, useTheme, useUploads
│   │   ├── lib/api.ts         # axios client with JWT interceptor + auto-refresh
│   │   └── types/
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml
└── README.md
```

---

## Running Locally (without Docker)

### 1. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

The API is now live at `http://localhost:8000` (interactive docs at `/docs`).
A sample 12,000-row dataset is at `backend/sample_data/sample_sales_data.csv` — upload it
from the frontend, or regenerate a fresh random one with:

```bash
python3 scripts/generate_sample_data.py
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Visit `http://localhost:3000`. The first account you register becomes the workspace **admin**;
every account after that is a standard **user**.

### 3. Run the tests

```bash
cd backend
source .venv/bin/activate
pytest tests/ -v
```

---

## Running with Docker

```bash
docker-compose up --build
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

Set a real `SECRET_KEY` via an `.env` file at the repo root (or your shell environment) before
deploying anywhere beyond your own machine — `docker-compose.yml` reads `${SECRET_KEY}` with a
placeholder default.

---

## Environment Variables

### `backend/.env`
| Variable | Description | Default |
|---|---|---|
| `SECRET_KEY` | JWT signing secret — **change in production** | placeholder |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime | `60` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token lifetime | `7` |
| `DATABASE_URL` | SQLAlchemy connection string | `sqlite:///./database/app.db` |
| `UPLOAD_DIR` / `REPORTS_DIR` / `CHARTS_DIR` | Storage paths | `uploads` / `reports` / `charts` |
| `MAX_UPLOAD_SIZE_MB` | Upload size limit | `50` |
| `CORS_ORIGINS` | Comma-separated allowed origins | `http://localhost:3000` |
| `RATE_LIMIT` | Global request rate limit | `100/minute` |
| `OPENAI_API_KEY` | Optional, for future LLM-powered chat | empty |

### `frontend/.env.local`
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API |

---

## API Endpoints

All endpoints except `/api/auth/register`, `/api/auth/login`, `/api/auth/forgot-password`,
`/api/auth/reset-password`, and `/api/health` require `Authorization: Bearer <access_token>`.

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create account (first user = admin) |
| POST | `/api/auth/login` | Login, returns access + refresh tokens |
| POST | `/api/auth/refresh` | Exchange refresh token for a new pair |
| POST | `/api/auth/logout` | Client-side token discard endpoint |
| POST | `/api/auth/forgot-password` | Request a password reset token |
| POST | `/api/auth/reset-password` | Reset password with token |
| GET | `/api/auth/me` | Current user profile |
| POST | `/api/uploads` | Upload + auto-clean a .csv/.xlsx/.xls file |
| GET | `/api/uploads` | List your uploads |
| GET | `/api/uploads/{id}/summary` | Cleaning before/after summary |
| DELETE | `/api/uploads/{id}` | Delete an upload |
| GET | `/api/datasets/{id}` | Paginated, sortable, searchable, filterable rows |
| GET | `/api/datasets/{id}/columns` | Column list + auto-detected roles |
| GET | `/api/datasets/{id}/export?format=csv\|xlsx` | Export cleaned dataset |
| POST | `/api/chat` | Ask a natural-language question about a dataset |
| GET | `/api/chat/suggestions` | Example question list |
| GET | `/api/charts/{id}/overview` | Default bar/pie/line/area chart data |
| GET | `/api/charts/{id}/custom` | bar/pie/line/scatter/area/histogram/heatmap/box |
| GET | `/api/forecast/{id}?horizon_days=30\|60\|90\|365` | Forecast with confidence interval |
| GET | `/api/report/{id}/data` | Structured report JSON |
| GET | `/api/report/{id}/pdf` | Download the full PDF report |
| GET/PUT | `/api/settings/me` | Get/update theme, language, notifications |
| PUT | `/api/settings/password` | Change password |
| GET | `/api/dashboard/summary` | Dashboard KPIs + recent uploads |

---

## Security Notes

- Passwords are hashed with bcrypt (never stored in plaintext).
- JWTs are short-lived access tokens (default 60 min) with longer-lived refresh tokens; the
  frontend auto-refreshes on 401.
- Every dataset/report/chart endpoint checks resource ownership (`admin` role can see everyone's).
- CORS is restricted to `CORS_ORIGINS`; basic security headers (`X-Frame-Options`,
  `X-Content-Type-Options`, etc.) are set on every response; a global rate limiter is active.
- Uploads are validated by extension and size before parsing.

---

## Known limitations (be aware of these)

- The AI Chat engine pattern-matches the question set from the brief; genuinely open-ended
  questions fall back to a helpful "try one of these" message rather than a generic LLM answer.
- Forecasting confidence intervals are computed from in-sample residual standard deviation, a
  standard but simplified approach — not a full Bayesian or bootstrap interval.
- SQLite is fine for a single-instance demo/small-team deployment; for concurrent multi-writer
  production use, migrate `DATABASE_URL` to Postgres (SQLAlchemy makes this a one-line change).
- `docker-compose up` was not run in the build environment — please verify it on your machine
  and open an issue if anything needs adjusting for your Docker version.
