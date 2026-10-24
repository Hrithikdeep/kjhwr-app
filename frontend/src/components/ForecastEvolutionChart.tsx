import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { makeTicks } from "../lib/axis";
import { colors } from "../lib/colors";
import { formatDateTime, formatMW, formatNumber } from "../lib/format";
import type { Vintage } from "../types";
import { ChartLegend } from "./ChartCard";

interface ForecastEvolutionChartProps {
  vintages: Vintage[]; // oldest forecast first
  actualAvg: number;
}

const HOURS_TICK_STEP = 12;
const MW_TICK_STEP = 2000;

// X axis labels: how long before (or after) the day started the forecast came out
function hoursLabel(hours: number): string {
  if (hours === 0) {
    return "Day starts";
  }
  return hours > 0 ? `${hours}h before` : `${-hours}h after`;
}

interface VintageTooltipProps {
  active?: boolean; // filled in by Recharts
  payload?: { payload: Vintage }[]; // filled in by Recharts
}

// The popup shown when hovering over one of the dots
function VintageTooltip({ active, payload }: VintageTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const vintage = payload[0].payload;
  const timing =
    vintage.hoursAhead >= 0
      ? `${vintage.hoursAhead}h before the day starts`
      : `${-vintage.hoursAhead}h after the day had started`;

  return (
    <div className="rounded-lg border border-border-active bg-elevated px-3 py-2 text-xs">
      <p className="font-medium text-fg-secondary">
        Published {formatDateTime(vintage.publishTime)}
      </p>
      <p className="mb-1 text-fg-muted">{timing}</p>
      <div className="flex items-center gap-2 text-fg">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.forecast }} />
        <span className="text-fg-secondary">Forecast average</span>
        <span className="ml-auto pl-4 font-semibold">{formatMW(vintage.forecastAvg)}</span>
      </div>
      <p className="mt-1 text-fg-muted">Covers {vintage.periodsCovered} of 24 hours</p>
    </div>
  );
}

function ForecastEvolutionChart({ vintages, actualAvg }: ForecastEvolutionChartProps) {
  // X axis: from the earliest to the latest forecast, always including 0 (the day starting)
  const hours = vintages.map((vintage) => vintage.hoursAhead);
  const hourTicks = makeTicks(Math.min(0, ...hours), Math.max(0, ...hours), HOURS_TICK_STEP);

  // Y axis: fits the forecasts and the actual line. It does not start at 0,
  // because the changes between forecasts would be too small to see.
  const values = [...vintages.map((vintage) => vintage.forecastAvg), actualAvg];
  const mwTicks = makeTicks(Math.min(...values), Math.max(...values), MW_TICK_STEP);

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={vintages} margin={{ top: 8, right: 24, bottom: 16, left: 0 }}>
          <CartesianGrid vertical={false} stroke={colors.grid} strokeOpacity={0.5} />

          {/* "reversed" puts the earliest forecast (most hours ahead) on the left,
              so time reads left to right */}
          <XAxis
            type="number"
            dataKey="hoursAhead"
            reversed
            ticks={hourTicks}
            domain={[hourTicks[0], hourTicks[hourTicks.length - 1]]}
            tickFormatter={hoursLabel}
            tick={{ fill: colors.textMuted, fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: colors.axis }}
            label={{
              value: "When the forecast was published",
              position: "insideBottom",
              offset: -12,
              fill: colors.textMuted,
              fontSize: 12,
            }}
          />
          <YAxis
            ticks={mwTicks}
            domain={[mwTicks[0], mwTicks[mwTicks.length - 1]]}
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

          {/* Vertical line: the moment the day started. Dots to its right were
              published after the day had already begun. */}
          <ReferenceLine x={0} stroke={colors.axis} strokeDasharray="2 4" />

          {/* Horizontal dashed line: what actually happened */}
          <ReferenceLine
            y={actualAvg}
            stroke={colors.actual}
            strokeDasharray="6 4"
            strokeWidth={2}
            label={{
              value: `Actual ${formatMW(actualAvg)}`,
              position: "insideTopRight",
              fill: colors.actual,
              fontSize: 12,
            }}
          />

          <Tooltip content={<VintageTooltip />} cursor={{ stroke: colors.axis }} />

          <Line
            type="linear"
            dataKey="forecastAvg"
            name="Forecast average"
            stroke={colors.forecast}
            strokeWidth={2}
            dot={{ r: 3, fill: colors.forecast, stroke: colors.forecast }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-3">
        <ChartLegend
          items={[
            { label: "Forecast average", color: colors.forecast },
            { label: "Actual average", color: colors.actual },
          ]}
        />
      </div>
    </div>
  );
}

export default ForecastEvolutionChart;
