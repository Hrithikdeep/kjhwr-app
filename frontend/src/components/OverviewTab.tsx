import { useState } from "react";
import type { WindDataState } from "../hooks/useWindData";
import { formatMW, formatPct, formatSignedMW } from "../lib/format";
import type { Metrics } from "../types";
import ChartCard from "./ChartCard";
import CorrelationChart from "./CorrelationChart";
import ErrorOverTimeChart from "./ErrorOverTimeChart";
import ErrorState from "./ErrorState";
import ForecastActualChart, { type Range } from "./ForecastActualChart";
import MetricCard from "./MetricCard";

const RANGE_OPTIONS: { id: Range; label: string }[] = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "all", label: "All" },
];

// The "vs forecast" line is green if actual is within 5% of the forecast,
// amber if within 10%, and red beyond that.
const CLOSE_LIMIT_PCT = 5;
const FAR_LIMIT_PCT = 10;

// Builds the line under "AVG ACTUAL GENERATION", e.g. "↓ 13.8% vs forecast"
function actualVsForecast(metrics: Metrics): { text: string; colourClass: string } {
  const differencePct =
    ((metrics.avgActual - metrics.avgForecast) / metrics.avgForecast) * 100;
  const size = Math.abs(differencePct);

  const arrow = differencePct < 0 ? "↓" : "↑";
  let colourClass = "text-danger";
  if (size <= CLOSE_LIMIT_PCT) {
    colourClass = "text-actual";
  } else if (size <= FAR_LIMIT_PCT) {
    colourClass = "text-error";
  }

  return { text: `${arrow} ${formatPct(size)} vs forecast`, colourClass };
}

function OverviewTab({ data, loading, error, reload }: WindDataState) {
  const [range, setRange] = useState<Range>("daily");

  const metrics = data?.metrics;
  const trend = metrics ? actualVsForecast(metrics) : null;

  // The Daily / Weekly / All buttons shown at the top right of the main chart
  const rangeButtons = (
    <div className="flex gap-2">
      {RANGE_OPTIONS.map((option) => {
        const isActive = option.id === range;
        const colourClass = isActive
          ? "border-forecast bg-forecast/20 text-forecast"
          : "border-transparent bg-elevated text-fg-secondary hover:text-fg";

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => setRange(option.id)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${colourClass}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-fg">Overview</h1>
      <p className="mt-1 text-xs text-fg-secondary">
        UK wind fleet · 30-minute settlement periods · 1–31 Jan 2026
      </p>

      {error ? (
        <div className="mt-6">
          <ErrorState message={error} onRetry={reload} />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {/* Row of four metric cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Avg actual generation"
              loading={loading}
              value={metrics && formatMW(metrics.avgActual)}
              subtext={trend?.text}
              subtextClassName={trend?.colourClass}
            />
            <MetricCard
              label="Avg forecasted"
              loading={loading}
              value={metrics && formatMW(metrics.avgForecast)}
              subtext={metrics && `${formatSignedMW(metrics.meanBias)} mean bias`}
              subtextClassName="text-forecast"
            />
            <MetricCard
              label="MAE"
              loading={loading}
              value={metrics && formatMW(metrics.mae)}
              subtext={metrics && `± ${formatMW(metrics.mae)} avg error`}
              subtextClassName="text-error"
            />
            <MetricCard
              label="MAPE"
              loading={loading}
              value={metrics && formatPct(metrics.mape, 2)}
              subtext="Mean absolute % error"
              subtextClassName="text-fg-secondary"
            />
          </div>

          {/* Main chart: forecast vs actual over the month */}
          <ChartCard
            title="Forecast vs Actual Generation"
            actions={rangeButtons}
            loading={loading}
            skeletonHeight={340}
          >
            {data && <ForecastActualChart range={range} daily={data.daily} all={data.all} />}
          </ChartCard>

          {/* Two smaller charts side by side */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <ChartCard
              title="Forecast Error Over Time"
              subtitle="Daily mean error (forecast − actual) · colour by magnitude"
              loading={loading}
              skeletonHeight={280}
            >
              {data && <ErrorOverTimeChart daily={data.daily} />}
            </ChartCard>

            <ChartCard
              title="Forecast vs Actual Correlation"
              subtitle="Each dot is a 30-min period · dashed line = perfect forecast"
              loading={loading}
              skeletonHeight={280}
            >
              {data && <CorrelationChart points={data.scatter} />}
            </ChartCard>
          </div>
        </div>
      )}
    </div>
  );
}

export default OverviewTab;
