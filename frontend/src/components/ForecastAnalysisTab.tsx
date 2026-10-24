import type { WindDataState } from "../hooks/useWindData";
import ChartCard from "./ChartCard";
import ErrorState from "./ErrorState";
import ForecastEvolutionCard from "./ForecastEvolutionCard";
import PeriodTable from "./PeriodTable";

function ForecastAnalysisTab({ data, loading, error, reload }: WindDataState) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-fg">Forecast Analysis</h1>
      <p className="mt-1 text-xs text-fg-secondary">
        How the forecast changed over time · every 30-minute period · 1–31 Jan 2026
      </p>

      {error ? (
        <div className="mt-6">
          <ErrorState message={error} onRetry={reload} />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {/* While the data loads, each card shows a pulsing placeholder */}
          {data ? (
            <ForecastEvolutionCard dailyMetrics={data.dailyMetrics} />
          ) : (
            <ChartCard title="Forecast Evolution" loading={loading} skeletonHeight={400} />
          )}

          {data ? (
            <PeriodTable points={data.all} />
          ) : (
            <ChartCard title="Period Detail" loading={loading} skeletonHeight={520} />
          )}
        </div>
      )}
    </div>
  );
}

export default ForecastAnalysisTab;
