import type { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode; // controls shown on the right of the title, e.g. toggle buttons
  loading?: boolean; // show a pulsing placeholder instead of the chart
  skeletonHeight: number; // height in pixels of that placeholder
  children?: ReactNode; // can be left out while loading
}

// A titled card that wraps one chart
function ChartCard({
  title,
  subtitle,
  actions,
  loading = false,
  skeletonHeight,
  children,
}: ChartCardProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-fg">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-fg-secondary">{subtitle}</p>}
        </div>
        {actions}
      </div>

      {loading ? (
        <div
          className="animate-pulse rounded-lg bg-elevated"
          style={{ height: skeletonHeight }}
        />
      ) : (
        children
      )}
    </section>
  );
}

interface LegendItem {
  label: string;
  color: string;
}

interface ChartLegendProps {
  items: LegendItem[];
  align?: "center" | "end";
}

// A row of coloured dots with labels, shown under or above a chart
export function ChartLegend({ items, align = "center" }: ChartLegendProps) {
  const alignClass = align === "end" ? "justify-end" : "justify-center";

  return (
    <div
      className={`flex flex-wrap items-center gap-4 text-xs text-fg-secondary ${alignClass}`}
    >
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

export default ChartCard;
