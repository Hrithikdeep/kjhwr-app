import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { makeTicks } from "../lib/axis";
import { colors } from "../lib/colors";
import { formatDateTime, formatMW, formatNumber, formatShortDate } from "../lib/format";
import type { AlignedPoint, DailyComparisonPoint } from "../types";
import { ChartLegend } from "./ChartCard";
import ChartTooltip from "./ChartTooltip";

export type Range = "daily" | "weekly" | "all";

// The three things the chart needs from every point
interface SeriesPoint {
  startTime: string;
  actual: number;
  forecast: number;
}

interface ForecastActualChartProps {
  range: Range;
  daily: DailyComparisonPoint[];
  all: AlignedPoint[];
}

const DAYS_PER_WEEK = 7;
const MW_TICK_STEP = 3000;

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

// Groups the daily points into blocks of 7 days (1-7 Jan, 8-14 Jan, ...)
// and averages each block. The last block is shorter (29-31 Jan).
function toWeekly(daily: DailyComparisonPoint[]): SeriesPoint[] {
  const weeks: SeriesPoint[] = [];

  for (let start = 0; start < daily.length; start += DAYS_PER_WEEK) {
    const days = daily.slice(start, start + DAYS_PER_WEEK);
    weeks.push({
      startTime: days[0].startTime,
      actual: average(days.map((day) => day.actual)),
      forecast: average(days.map((day) => day.forecast)),
    });
  }
  return weeks;
}

function pickSeries(
  range: Range,
  daily: DailyComparisonPoint[],
  all: AlignedPoint[]
): SeriesPoint[] {
  if (range === "weekly") {
    return toWeekly(daily);
  }
  if (range === "all") {
    return all;
  }
  return daily;
}

// The heading shown in the tooltip, which depends on what one point means
function tooltipLabel(range: Range, label: string | number): string {
  const text = String(label);
  if (range === "all") {
    return formatDateTime(text);
  }
  if (range === "weekly") {
    return `Week of ${formatShortDate(text)}`;
  }
  return formatShortDate(text);
}

function ForecastActualChart({ range, daily, all }: ForecastActualChartProps) {
  const series = pickSeries(range, daily, all);

  // Y axis: 0, 3,000, 6,000 ... up to just above the highest value
  const highest = Math.max(...series.flatMap((point) => [point.actual, point.forecast]));
  const ticks = makeTicks(0, highest, MW_TICK_STEP);

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={series} margin={{ top: 8, right: 24, bottom: 0, left: 0 }}>
          {/* Fades each line's colour from see-through-ish at the top to clear at the bottom */}
          <defs>
            <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.forecast} stopOpacity={0.3} />
              <stop offset="100%" stopColor={colors.forecast} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="actualFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.actual} stopOpacity={0.3} />
              <stop offset="100%" stopColor={colors.actual} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid vertical={false} stroke={colors.grid} strokeOpacity={0.5} />

          <XAxis
            dataKey="startTime"
            tickFormatter={formatShortDate}
            interval="preserveStartEnd"
            minTickGap={24}
            tick={{ fill: colors.textMuted, fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: colors.axis }}
          />
          <YAxis
            ticks={ticks}
            domain={[ticks[0], ticks[ticks.length - 1]]}
            tickFormatter={formatNumber}
            width={72}
            tick={{ fill: colors.textMuted, fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: colors.axis }}
            label={{
              value: "MW",
              angle: -90,
              position: "insideLeft",
              fill: colors.textMuted,
              fontSize: 12,
            }}
          />

          <Tooltip
            content={
              <ChartTooltip
                formatLabel={(label) => tooltipLabel(range, label)}
                formatValue={formatMW}
                showDifference
              />
            }
            cursor={{ stroke: colors.axis }}
          />

          {/* "monotone" draws a smooth curve that never overshoots the data */}
          <Area
            type="monotone"
            dataKey="forecast"
            name="Forecast"
            stroke={colors.forecast}
            strokeWidth={2}
            fill="url(#forecastFill)"
            dot={false}
          />
          <Area
            type="monotone"
            dataKey="actual"
            name="Actual"
            stroke={colors.actual}
            strokeWidth={2}
            fill="url(#actualFill)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-3">
        <ChartLegend
          items={[
            { label: "Forecast", color: colors.forecast },
            { label: "Actual", color: colors.actual },
          ]}
        />
      </div>
    </div>
  );
}

export default ForecastActualChart;
