# WindSight

A dashboard that compares forecast and actual UK wind power generation
(from the Elexon BMRS API) and reports forecast accuracy using MAE, RMSE
and MAPE.

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, Recharts
- Backend: Python, FastAPI
- Packaging: Docker

## Project structure

- `backend/` - the API and the calculations
- `frontend/` - the dashboard UI
- `docker-compose.yml` - runs both together

## How the numbers are produced

- Actual generation: Elexon dataset FUELHH, wind only, half-hourly (MW).
- Forecasts: Elexon dataset WINDFOR, hourly (MW). Each hourly forecast is used
  for both half-hours inside that hour.
- The data covers January 2026.
- Day-ahead rule: each period is compared with the latest forecast that was
  published at least 24 hours before it started.
- Error = forecast - actual, so a positive error means the forecast was too
  high. MAE, RMSE and MAPE are calculated from that error.

## Running it with Docker

You need Docker Desktop (or Docker Engine with the Compose plugin).

```
cp backend/.env.example backend/.env   # only needed once, on a new machine
docker compose up --build
```

Then open http://localhost:8080. The backend API is at http://localhost:8000.

- The frontend is built into static files and served by nginx on port 8080.
- The backend runs `uvicorn` on port 8000 inside its container.
- Both ports are on your own computer, so stop anything already using 8000
  or 8080 first, for example a backend started with `uvicorn --reload`. If two
  servers share port 8000, the browser may reach the wrong one.
- The first page load can take from a few seconds up to about half a minute,
  because the backend downloads the data from Elexon once and then keeps it in
  memory. The dashboard shows loading placeholders until it arrives.
- Stop everything with `docker compose down`.

The address the browser uses to reach the backend is written into the
JavaScript when the frontend image is built, so it is a build argument, not a
setting of the running container. To use another address, set `VITE_API_URL`
when you build, for example
`VITE_API_URL=https://api.example.com docker compose up --build`. Also set
`FRONTEND_ORIGIN` in `backend/.env` to the address the dashboard is opened at,
or the browser will block its requests.

## Running it locally

Start the backend (from `backend/`):

```
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

Start the frontend (from `frontend/`, in a second terminal):

```
npm install
npm run dev
```

Then open http://localhost:5173. The first page load takes a few seconds,
because the backend fetches the data from Elexon once and then keeps it in
memory.

The frontend reads the backend address from `VITE_API_URL` (see
`frontend/.env.example`). It defaults to `http://localhost:8000`. The backend
only accepts requests from the address in `FRONTEND_ORIGIN` (see
`backend/.env.example`), which defaults to `http://localhost:5173`.

## Production build of the frontend

```
cd frontend
npm run build
```

The files are written to `frontend/dist/`. `VITE_API_URL` is read when the
build runs, so set it before building for any address other than localhost.
The Docker image does this build for you.

## API

All endpoints are under `/api`. Interactive documentation is at `/docs`.

| Endpoint | Returns |
| --- | --- |
| `GET /api/health` | `{"status": "ok"}` |
| `GET /api/actuals`, `GET /api/forecasts` | The raw data from Elexon |
| `GET /api/comparison?aggregation=all\|daily` | Forecast vs actual per period, or averaged per day |
| `GET /api/metrics` | MAE, RMSE, MAPE, bias and more for the month |
| `GET /api/metrics/daily` | The same metrics for each day |
| `GET /api/metrics/hourly` | Average error for each hour of the day |
| `GET /api/scatter` | Actual and forecast pairs for a scatter plot |
| `GET /api/forecast-vintages?date=YYYY-MM-DD` | How the forecast for one day changed as new forecasts were published |
| `POST /api/cache/clear` | Empties the in-memory cache |
