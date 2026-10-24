import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { colors } from "../lib/colors";
import { formatNumber, formatPct } from "../lib/format";
import type { AlignedPoint } from "../types";
import { ChartLegend } from "./ChartCard";
import ChartTooltip from "./ChartTooltip";

interface ErrorDistributionChartProps {
  points: AlignedPoint[];
}

const BUCKET_SIZE_MW = 500;
const TICK_STEP_MW = 2000; // axis labels every 2,000 MW (the bars are still 500 MW wide)

// One bar of the histogram: errors from "start" up to (not including) "end"
interface Bucket {
  start: number;
  end: number;
  label: string; // e.g. "-500 to 0"
  count: number; // how many periods had an error in this range
}

// Sorts every period into a 500 MW wide bucket by its error.
// The range comes from the data, so the biggest and smallest errors always fit.
function buildBuckets(points: AlignedPoint[]): Bucket[] {
  const errors = points.map((point) => point.error);
  const firstStart = Math.floor(Math.min(...errors) / BUCKET_SIZE_MW) * BUCKET_SIZE_MW;
  const bucketCount = Math.floor((Math.max(...errors) - firstStart) / BUCKET_SIZE_MW) + 1;

  const buckets: Bucket[] = [];
  for (let index = 0; index < bucketCount; index++) {
    const start = firstStart + index * BUCKET_SIZE_MW;
    const end = start + BUCKET_SIZE_MW;
    buckets.push({
      start,
      end,
      label: `${formatNumber(start)} to ${formatNumber(end)}`,
      count: 0,
    });
  }

  for (const error of errors) {
    const index = Math.floor((error - firstStart) / BUCKET_SIZE_MW);
    buckets[index].count += 1;
  }
  return buckets;
}

function ErrorDistributionChart({ points }: ErrorDistributionChartProps) {
  const buckets = buildBuckets(points);

  // The numeric x axis runs from the first bucket's start to the last bucket's end,
  // with a tick at every 2,000 MW that falls inside that range (including 0)
  const axisMin = buckets[0].start;
  const axisMax = buckets[buckets.length - 1].end;
  const axisTicks: number[] = [];
  for (let tick = Math.ceil(axisMin / TICK_STEP_MW) * TICK_STEP_MW; tick <= axisMax; tick += TICK_STEP_MW) {
    axisTicks.push(tick);
  }

  // Colours: blue for under-forecast buckets (below 0). Over-forecast buckets
  // fade from amber, just above 0, to red for the biggest errors.
  const lastStart = buckets[buckets.length - 1].start;
  function barColor(bucket: Bucket): string {
    if (bucket.start < 0) {
      return colors.forecast;
    }
    const redPercent = Math.round((bucket.start / lastStart) * 100);
    return `color-mix(in srgb, ${colors.danger} ${redPercent}%, ${colors.error})`;
  }

  const overCount = points.filter((point) => point.error > 0).length;
  const underCount = points.filter((point) => point.error < 0).length;
  const overPercent = (overCount / points.length) * 100;
  const underPercent = (underCount / points.length) * 100;

  return (
    <div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={buckets}
          barCategoryGap="8%"
          margin={{ top: 24, right: 24, bottom: 16, left: 0 }}
        >
          <CartesianGrid vertical={false} stroke={colors.grid} strokeOpacity={0.5} />

          {/* The bars use this axis, which is hidden. It only spreads the buckets evenly. */}
          <XAxis dataKey="label" hide />

          {/* The axis people see: a number line, so its ticks sit exactly on the
              edges between buckets and 0 is really the edge between two bars */}
          <XAxis
            xAxisId="mw"
            type="number"
            domain={[axisMin, axisMax]}
            ticks={axisTicks}
            tickFormatter={formatNumber}
            tick={{ fill: colors.textMuted, fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: colors.axis }}
            label={{
              value: "Error (MW) = forecast − actual",
              position: "insideBottom",
              offset: -14,
              fill: colors.textMuted,
              fontSize: 12,
            }}
          />
          <YAxis
            allowDecimals={false}
            tickFormatter={formatNumber}
            width={56}
            tick={{ fill: colors.textMuted, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            label={{
              value: "Periods",
              angle: -90,
              position: "insideLeft",
              fill: colors.textMuted,
              fontSize: 12,
            }}
          />

          {/* Vertical line at 0: a perfect forecast */}
          <ReferenceLine
            xAxisId="mw"
            x={0}
            stroke={colors.textSecondary}
            strokeDasharray="4 4"
            label={{
              value: "Perfect forecast",
              position: "top",
              fill: colors.textSecondary,
              fontSize: 11,
            }}
          />

          <Tooltip
            content={
              <ChartTooltip
                formatLabel={(label) => `${label} MW`}
                formatValue={(value) => `${formatNumber(value)} periods`}
                showDots={false}
              />
            }
            cursor={{ fill: colors.hoverFill, fillOpacity: 0.5 }}
          />

          <Bar dataKey="count" name="Periods" radius={[2, 2, 0, 0]}>
            {buckets.map((bucket) => (
              <Cell key={bucket.start} fill={barColor(bucket)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-3">
        <ChartLegend
          items={[
            { label: "Under-forecast (error below 0)", color: colors.forecast },
            { label: "Over-forecast (error above 0)", color: colors.error },
          ]}
        />
      </div>

      <p className="mt-4 text-xs leading-relaxed text-fg-secondary">
        {formatPct(overPercent)} of the {formatNumber(points.length)} periods were over-forecast (error above
        0) and {formatPct(underPercent)} were under-forecast. When the bars sit mostly to the right of the
        line, the forecast is too high more often than too low, which is what a positive mean
        bias looks like.
      </p>
    </div>
  );
}

export default ErrorDistributionChart;
