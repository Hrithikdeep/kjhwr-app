// Hook that loads how the forecast for one day changed over time.
// It loads again whenever the date changes.

import { useEffect, useState } from "react";
import { getForecastVintages } from "../lib/api";
import type { ForecastVintages } from "../types";

export function useForecastVintages(date: string) {
  const [data, setData] = useState<ForecastVintages | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Changing this number makes the effect below run again (used by retry)
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // If the date changes before this request finishes, the "cancelled" flag
    // makes sure the old, slower reply cannot overwrite the newer one.
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const result = await getForecastVintages(date);
        if (!cancelled) {
          setData(result);
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
  }, [date, attempt]);

  function reload() {
    setAttempt((current) => current + 1);
  }

  return { data, loading, error, reload };
}
