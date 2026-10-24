import { formatNumber, formatSignedMW } from "../lib/format";

// One line in the tooltip. Recharts supplies these in "payload".
interface TooltipEntry {
  name?: string | number;
  value?: number | string;
  color?: string;
}

interface ChartTooltipProps {
  // These three are filled in by Recharts when it shows the tooltip
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;

  // These are set by us where we use the tooltip
  formatLabel?: (label: string | number) => string; // how to show the heading
  formatValue?: (value: number) => string; // how to show each number
  showDots?: boolean; // show a coloured dot before each line
  showDifference?: boolean; // add a "Difference" line (forecast - actual) under the others
}

// The popup shown when hovering over a chart
function ChartTooltip({
  active,
  payload,
  label,
  formatLabel,
  formatValue = formatNumber,
  showDots = true,
  showDifference = false,
}: ChartTooltipProps) {
  // Nothing to show unless the mouse is over a data point
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  // Forecast minus actual, found by the names of the two lines on the chart.
  // Positive means the forecast was too high.
  const forecast = payload.find((entry) => entry.name === "Forecast")?.value;
  const actual = payload.find((entry) => entry.name === "Actual")?.value;
  const hasDifference = showDifference && forecast !== undefined && actual !== undefined;

  return (
    <div className="rounded-lg border border-border-active bg-elevated px-3 py-2 text-xs">
      {label !== undefined && formatLabel && (
        <p className="mb-1 font-medium text-fg-secondary">{formatLabel(label)}</p>
      )}

      {payload.map((entry) => (
        <div key={String(entry.name)} className="flex items-center gap-2 text-fg">
          {showDots && (
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
          )}
          <span className="text-fg-secondary">{entry.name}</span>
          <span className="ml-auto pl-4 font-semibold">
            {formatValue(Number(entry.value))}
          </span>
        </div>
      ))}

      {hasDifference && (
        <div className="mt-1.5 flex items-center gap-2 border-t border-border pt-1.5 text-error">
          {/* Empty space the size of a dot, so the label lines up with the rows above */}
          {showDots && <span className="h-2 w-2" />}
          <span>Difference</span>
          <span className="ml-auto pl-4 font-semibold">
            {formatSignedMW(Number(forecast) - Number(actual))}
          </span>
        </div>
      )}
    </div>
  );
}

export default ChartTooltip;
