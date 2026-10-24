// Hook that loads the data shared by the dashboard tabs and tracks loading and error state.

import { useEffect, useState } from "react";
import {
  getComparison,
  getDailyMetrics,
  getHourlyProfile,
  getMetrics,
  getScatter,
} from "../lib/api";
import type {
  AlignedPoint,
  DailyComparisonPoint,
  DailyMetric,
  HourlyProfile,
  Metrics,
  ScatterPoint,
} from "../types";

export interface WindData {
  metrics: Metrics;
  dailyMetrics: DailyMetric[]; // error metrics for each day
  hourly: HourlyProfile[]; // average error for each hour of the day
  daily: DailyComparisonPoint[]; // one point per day
  all: AlignedPoint[]; // one point per 30-minute period
  scatter: ScatterPoint[];
}

export function useWindData() {
  const [data, setData] = useState<WindData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Changing this number makes the effect below run again (used by retry)
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // If the component goes away before the data arrives, we must not update it
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // The first request makes the backend fetch from Elexon (slow) and
        // cache the result. The others then read from that cache, so we wait
        // for the first before sending them.
        const metrics = await getMetrics();
        const [dailyMetrics, hourly, daily, all, scatter] = await Promise.all([
          getDailyMetrics(),
          getHourlyProfile(),
          getComparison("daily"),
          getComparison("all"),
          getScatter(),
        ]);

        if (!cancelled) {
          setData({ metrics, dailyMetrics, hourly, daily, all, scatter });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Something went wrong");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  function reload() {
    setAttempt((current) => current + 1);
  }

  return { data, loading, error, reload };
}

// The value the hook returns. The tabs receive this as their props.
export type WindDataState = ReturnType<typeof useWindData>;
