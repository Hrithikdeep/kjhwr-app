// TypeScript types that match the JSON returned by the WindSight backend.
// All power values are in megawatts (MW). Times are UTC ISO strings.

// The three tabs of the dashboard
export type Tab = "overview" | "forecast" | "errors";

// One matched period: an actual and the forecast made for it
// (GET /api/comparison?aggregation=all)
export interface AlignedPoint {
  startTime: string; // e.g. "2026-01-01T00:30:00Z"
  actual: number;
  forecast: number;
  error: number; // forecast - actual (positive = forecast too high)
  absError: number;
  pctError: number | null; // null when the actual is 0 (cannot divide by zero)
}

// One day of averages (GET /api/comparison?aggregation=daily)
export interface DailyComparisonPoint {
  startTime: string; // a date, e.g. "2026-01-01"
  actual: number;
  forecast: number;
  error: number;
}

// Summary error metrics (GET /api/metrics)
export interface Metrics {
  mae: number; // mean absolute error
  rmse: number; // root mean squared error
  mape: number | null; // mean absolute percentage error, null if every actual is 0
  meanBias: number; // average of error: shows over- or under-forecasting
  avgActual: number;
  avgForecast: number;
  count: number; // number of periods the metrics are based on
  maxError: number; // biggest over-forecast
  minError: number; // biggest under-forecast (most negative)
}

// Metrics for one calendar day (GET /api/metrics/daily)
export interface DailyMetric extends Metrics {
  date: string; // e.g. "2026-01-01"
}

// Average error for one hour of the day (GET /api/metrics/hourly)
export interface HourlyProfile {
  hour: number; // 0 to 23
  label: string; // e.g. "14:00"
  meanError: number;
  meanAbsError: number;
  count: number;
}

// One published forecast for a given day (part of GET /api/forecast-vintages)
export interface Vintage {
  publishTime: string; // when this forecast was published
  hoursAhead: number; // hours before midnight at the start of the day (negative = after it began)
  forecastAvg: number; // average of the values this forecast gave for the day
  periodsCovered: number; // how many of the day's 24 hours this forecast covered
}

// How the forecast for one day changed as new forecasts were published
// (GET /api/forecast-vintages?date=...), oldest forecast first
export interface ForecastVintages {
  date: string; // e.g. "2026-01-11"
  actualAvg: number; // what really happened that day, on average
  vintages: Vintage[];
}

// One point on the forecast vs actual scatter plot (GET /api/scatter)
export interface ScatterPoint {
  actual: number;
  forecast: number;
}
