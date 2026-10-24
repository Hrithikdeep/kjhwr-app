// Functions that call the WindSight backend. Components use these
// instead of calling fetch themselves.

import type {
  AlignedPoint,
  DailyComparisonPoint,
  DailyMetric,
  ForecastVintages,
  HourlyProfile,
  Metrics,
  ScatterPoint,
} from "../types";

// The backend address comes from the .env file, with a local default
const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

type Aggregation = "all" | "daily";

// Turns a failed response into a readable message.
// The backend sends errors like {"detail": "Could not fetch data from Elexon"}.
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body.detail === "string") {
      return body.detail;
    }
  } catch {
    // The body was not JSON, so fall through to the generic message
  }
  return `Request failed with status ${response.status}`;
}

// Shared helper: GET a path from the backend and return the parsed JSON
async function get<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`);
  } catch {
    // fetch only throws when the server cannot be reached at all
    throw new Error(`Could not reach the WindSight API at ${API_URL}`);
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return response.json() as Promise<T>;
}

// The two overloads tell TypeScript which shape comes back:
// "all" gives one point per period, "daily" gives one point per day.
export function getComparison(aggregation: "all"): Promise<AlignedPoint[]>;
export function getComparison(aggregation: "daily"): Promise<DailyComparisonPoint[]>;
export function getComparison(
  aggregation: Aggregation
): Promise<AlignedPoint[] | DailyComparisonPoint[]> {
  return get(`/api/comparison?aggregation=${aggregation}`);
}

export function getMetrics(): Promise<Metrics> {
  return get("/api/metrics");
}

export function getDailyMetrics(): Promise<DailyMetric[]> {
  return get("/api/metrics/daily");
}

export function getHourlyProfile(): Promise<HourlyProfile[]> {
  return get("/api/metrics/hourly");
}

export function getScatter(): Promise<ScatterPoint[]> {
  return get("/api/scatter");
}

// date looks like "2026-01-11"
export function getForecastVintages(date: string): Promise<ForecastVintages> {
  return get(`/api/forecast-vintages?date=${date}`);
}
