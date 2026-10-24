# WindSight — Wind Generation Intelligence

A dashboard for UK energy traders to compare wind power generation forecasts against actual outturn, and to quantify the historical accuracy of those forecasts — built on live data from Elexon BMRS.

## Live Demo

- **App:** https://kjhwr-app.vercel.app
- **Backend API:** https://kjhwr-app-production.up.railway.app
- **API docs (interactive):** https://kjhwr-app-production.up.railway.app/docs

> Note: the backend runs on a free-tier host and may take 30–50 seconds to wake up on the first request after a period of inactivity. Subsequent requests are fast.

## What this does

Energy utilities that buy electricity from the UK day-ahead market need to know, roughly a day in advance, how much power they can expect from renewable sources like wind — so they know how much extra to procure from other generation (e.g. thermal plants). This tool helps a trader:

1. **See the latest day-ahead wind generation forecast**, compared against what actually happened historically.
2. **Quantify how accurate that forecast has been**, so the error can be factored into purchasing decisions.

All data is for **January 2026**, at the national GB level, for wind generation only, sourced from two Elexon BMRS datasets:

- `FUELHH` (actual generation, filtered to `fuelType=WIND`)
- `WINDFOR` (wind generation forecasts)

### The three tabs

- **Overview** — headline metrics (avg actual, avg forecast, MAE, MAPE), a forecast-vs-actual chart, a daily error chart, and a forecast/actual correlation scatter plot.
- **Forecast Analysis** — shows how the forecast for a chosen day changed as new forecasts were published in the lead-up to delivery (forecast "convergence"), plus a searchable, sortable table of every 30-minute period in the month.
- **Error Metrics** — a deeper statistical breakdown: RMSE, bias, daily accuracy trend, hourly error profile (is accuracy worse at certain times of day?), and the distribution of errors across the month.

## Project structure

```
windsight/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app: routes, CORS, startup pre-fetch
│   │   ├── routes/
│   │   │   └── wind.py              # All /api/* endpoints
│   │   ├── services/
│   │   │   ├── elexon.py            # Fetches + caches data from Elexon BMRS
│   │   │   └── analysis.py          # Forecast/actual alignment + error metrics (MAE, RMSE, MAPE, bias)
│   │   └── models/                  # (reserved for response models)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx                  # Tab routing + shared data loading
│   │   ├── types/                   # TypeScript types matching backend responses
│   │   ├── lib/
│   │   │   ├── api.ts               # API client (one function per backend endpoint)
│   │   │   └── format.ts            # Number/date formatting helpers
│   │   ├── hooks/                   # Data-fetching hooks
│   │   └── components/
│   │       ├── Header.tsx
│   │       ├── OverviewTab.tsx
│   │       ├── ForecastAnalysisTab.tsx (+ ForecastEvolutionCard, PeriodTable)
│   │       └── ErrorMetricsTab.tsx (+ DailyAccuracyChart, HourlyProfileChart, ErrorDistributionChart)
│   ├── package.json
│   ├── vite.config.ts
│   ├── Dockerfile
│   └── .env.example
│
├── docker-compose.yml                # Runs backend + frontend together locally
└── README.md
```

## How to run locally

**Prerequisites:** Python 3.11+, Node 18+, Docker (optional, for the containerized route).

### Option A — Docker (recommended)

```bash
cd windsight
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up --build
```

Open the URL shown in the compose output (frontend is served via nginx; check `docker-compose.yml` for the mapped port).

### Option B — Run manually

**Backend:**
```bash
cd windsight/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend** (in a separate terminal):
```bash
cd windsight/frontend
npm install
npm run dev
```

The frontend reads the backend URL from `VITE_API_URL` in `frontend/.env` (defaults to `http://localhost:8000`).

## Key technical decisions

**Forecast selection (24-hour minimum lead time).** For any given 30-minute settlement period, Elexon's `WINDFOR` dataset contains many forecasts published at different times. We select the most recent forecast that was published **at least 24 hours before** the period it predicts — not simply the most recent forecast overall. This matters because the business use case is day-ahead purchasing: a forecast published after (or shortly before) the delivery period began would never have been available to a trader making that decision, and using it would understate real-world forecast error.

**A known data limitation.** Across January 2026, the forecast systematically runs about 16% above the actual (`FUELHH`) generation figure. As specified by the assignment, actuals come from `FUELHH`, which (per Elexon's own documentation) reflects generation outturn at a national level, while `WINDFOR` is explicitly documented as covering "wind farms which are visible to the ESO and have operational metering" — not necessarily the same scope. A spot comparison against a second actuals dataset (`B1630`, onshore + offshore wind) for a sample week showed it running ~17% above `FUELHH` for the same hours, and much closer to the forecast — consistent with `FUELHH` not capturing all wind generation (e.g. smaller, embedded/distribution-connected wind farms). This is a plausible explanation for part of the observed bias, though it is not confirmed in Elexon's documentation, and should be treated as a flagged limitation rather than a proven cause.

**Caching.** Elexon data for January 2026 is fetched once per backend process and cached in memory, since the dataset is static (historical, not live-updating) — this avoids repeated calls to the Elexon API on every dashboard request.

## AI tools disclosure

This project was built with AI assistance. Claude was used throughout development — backend architecture, the forecast-alignment and error-metric logic, frontend components, debugging, Docker configuration, and deployment setup. Lovable was used early on only to prototype a visual design reference (colours, layout, chart placement); no code from that prototype was reused — the production application (React/TypeScript frontend, FastAPI backend) was built from scratch and connects to live Elexon BMRS data.

## Tech stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Recharts
- **Backend:** Python, FastAPI, httpx
- **Infra:** Docker, deployed on Vercel (frontend) and Railway (backend)
- **Data source:** Elexon BMRS API (`FUELHH`, `WINDFOR`)
