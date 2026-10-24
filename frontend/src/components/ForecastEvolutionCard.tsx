import { useState } from "react";
import { useForecastVintages } from "../hooks/useForecastVintages";
import { formatShortDate, formatWeekdayDate } from "../lib/format";
import type { DailyMetric } from "../types";
import ChartCard from "./ChartCard";
import ErrorState from "./ErrorState";
import ForecastEvolutionChart from "./ForecastEvolutionChart";

interface ForecastEvolutionCardProps {
  dailyMetrics: DailyMetric[];
}

// A forecast that covers fewer hours than this is not shown. Each published
// forecast covers a window of about two days, so the first and last forecasts
// for a day only cover part of it. Their averages are for different hours of
// the day, so they cannot be compared with the others.
const MIN_HOURS_COVERED = 20;

// The day with the biggest average error (MAE)
function findWorstDay(dailyMetrics: DailyMetric[]): string {
  let worst = dailyMetrics[0];
  for (const day of dailyMetrics) {
    if (day.mae > worst.mae) {
      worst = day;
    }
  }
  return worst.date;
}

function ForecastEvolutionCard({ dailyMetrics }: ForecastEvolutionCardProps) {
  const worstDay = findWorstDay(dailyMetrics);
  const [date, setDate] = useState(worstDay);
  const { data, loading, error, reload } = useForecastVintages(date);

  // Only keep forecasts that cover (nearly) the whole day
  const shown = data ? data.vintages.filter((v) => v.periodsCovered >= MIN_HOURS_COVERED) : [];
  const hiddenCount = data ? data.vintages.length - shown.length : 0;

  // The date picker, plus a label or button about the worst day
  const controls = (
    <div className="flex flex-wrap items-center justify-end gap-3">
      {date === worstDay ? (
        <span className="rounded-full border border-error/40 bg-error/10 px-2.5 py-1 text-xs font-medium text-error">
          Worst forecast day
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setDate(worstDay)}
          className="text-xs text-fg-secondary underline-offset-2 transition-colors hover:text-fg hover:underline"
        >
          Go to worst day ({formatShortDate(worstDay)})
        </button>
      )}

      <select
        value={date}
        onChange={(event) => setDate(event.target.value)}
        aria-label="Choose a day"
        className="rounded-lg border border-border bg-elevated px-3 py-1.5 text-sm text-fg transition-colors hover:border-border-active"
      >
        {dailyMetrics.map((day) => (
          <option key={day.date} value={day.date}>
            {formatWeekdayDate(day.date)}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <ChartCard
      title="Forecast Evolution"
      actions={controls}
      loading={loading}
      skeletonHeight={400}
    >
      {error && <ErrorState message={error} onRetry={reload} embedded />}

      {!error && data && shown.length > 0 && (
        <>
          <ForecastEvolutionChart vintages={shown} actualAvg={data.actualAvg} />

          <p className="mt-4 text-xs leading-relaxed text-fg-secondary">
            Shows how the forecast for {formatShortDate(data.date)} changed as new forecasts were
            published, compared to what actually happened. Dots to the right of "Day starts" were
            published after the day had already begun.
            {hiddenCount > 0 &&
              ` ${hiddenCount} forecast${hiddenCount === 1 ? "" : "s"} covering fewer than ${MIN_HOURS_COVERED} of the day's 24 hours ${hiddenCount === 1 ? "is" : "are"} not shown.`}
          </p>
        </>
      )}

      {!error && data && shown.length === 0 && (
        <p className="py-16 text-center text-sm text-fg-secondary">
          No forecast covering the whole day is available for {formatShortDate(data.date)}.
        </p>
      )}
    </ChartCard>
  );
}

export default ForecastEvolutionCard;
