interface MetricCardProps {
  label: string; // small uppercase title, e.g. "MAE"
  value?: string; // the big number, e.g. "2,067 MW"
  subtext?: string; // the line under the number
  subtextClassName?: string; // Tailwind colour class for that line, e.g. "text-error"
  loading?: boolean; // show a pulsing placeholder instead of the content
}

function MetricCard({
  label,
  value,
  subtext,
  subtextClassName = "text-fg-secondary",
  loading = false,
}: MetricCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-border-active">
      <p className="text-xs font-medium uppercase tracking-wider text-fg-secondary">
        {label}
      </p>

      {loading ? (
        <div className="mt-3 space-y-3">
          <div className="h-8 w-32 animate-pulse rounded bg-elevated" />
          <div className="h-3 w-24 animate-pulse rounded bg-elevated" />
        </div>
      ) : (
        <>
          <p className="mt-2 text-3xl font-bold text-fg">{value}</p>
          <p className={`mt-2 text-xs ${subtextClassName}`}>{subtext}</p>
        </>
      )}
    </div>
  );
}

export default MetricCard;
