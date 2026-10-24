import type { WindDataState } from "../hooks/useWindData";
import { formatMW, formatShortDateTime, formatSignedMW } from "../lib/format";
import ChartCard from "./ChartCard";
import DailyAccuracyChart from "./DailyAccuracyChart";
import ErrorDistributionChart from "./ErrorDistributionChart";
import ErrorState from "./ErrorState";
import HourlyProfileChart from "./HourlyProfileChart";
import MetricCard from "./MetricCard";

// "Over-forecast" when the error is positive, "Under-forecast" when it is negative
function direction(error: number): string {
  if (error > 0) return "Over-forecast";
  if (error < 0) return "Under-forecast";
  return "Exact";
}

function ErrorMetricsTab({ data, loading, error, reload }: WindDataState) {
  const metrics = data?.metrics;

  // The periods with the biggest and smallest error. The numbers come from the
  // metrics; we look the periods up in the loaded data only to say when they happened.
  const maxPeriod = data?.all.find((point) => point.error === metrics?.maxError);
  const minPeriod = data?.all.find((point) => point.error === metrics?.minError);

  // The note under "Mean bias" says which way the forecast leans
  let biasNote = "No systematic bias";
  let biasColourClass = "text-fg-secondary";
  if (metrics && metrics.meanBias > 0) {
    biasNote = "Forecast over-predicts";
    biasColourClass = "text-error";
  } else if (metrics && metrics.meanBias < 0) {
    biasNote = "Forecast under-predicts";
    biasColourClass = "text-forecast";
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-fg">Error Metrics</h1>
      <p className="mt-1 text-xs text-fg-secondary">
        Forecast accuracy in depth · day-ahead forecasts (published 24h or more ahead) · 1–31 Jan
        2026
      </p>

      {error ? (
        <div className="mt-6">
          <ErrorState message={error} onRetry={reload} />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {/* Row of four summary cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="RMSE"
              loading={loading}
              value={metrics && formatMW(metrics.rmse)}
              subtext="Weights large misses more"
              subtextClassName="text-info"
            />
            <MetricCard
              label="Mean bias"
              loading={loading}
              value={metrics && formatSignedMW(metrics.meanBias)}
              subtext={biasNote}
              subtextClassName={biasColourClass}
            />
            <MetricCard
              label="Max error"
              loading={loading}
              value={metrics && formatSignedMW(metrics.maxError)}
              subtext={
                metrics &&
                maxPeriod &&
                `${direction(metrics.maxError)} · ${formatShortDateTime(maxPeriod.startTime)}`
              }
              subtextClassName="text-danger"
            />
            <MetricCard
              label="Min error"
              loading={loading}
              value={metrics && formatSignedMW(metrics.minError)}
              subtext={
                metrics &&
                minPeriod &&
                `${direction(metrics.minError)} · ${formatShortDateTime(minPeriod.startTime)}`
              }
              subtextClassName="text-forecast"
            />
          </div>

          <ChartCard
            title="Daily Accuracy Trend"
            subtitle="MAE and RMSE for each day · lower is better"
            loading={loading}
            skeletonHeight={340}
          >
            {data && <DailyAccuracyChart dailyMetrics={data.dailyMetrics} />}
          </ChartCard>

          {/* Two smaller charts side by side */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <ChartCard
              title="Hourly Error Profile"
              subtitle="Mean absolute error by hour of the day, across the whole month"
              loading={loading}
              skeletonHeight={320}
            >
              {data && <HourlyProfileChart hourly={data.hourly} />}
            </ChartCard>

            <ChartCard
              title="Error Distribution"
              subtitle="How many 30-minute periods fell in each error range"
              loading={loading}
              skeletonHeight={320}
            >
              {data && <ErrorDistributionChart points={data.all} />}
            </ChartCard>
          </div>
        </div>
      )}
    </div>
  );
}

export default ErrorMetricsTab;
