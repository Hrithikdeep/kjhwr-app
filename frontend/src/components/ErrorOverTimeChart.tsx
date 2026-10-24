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
import { makeTicks } from "../lib/axis";
import { colors } from "../lib/colors";
import { formatMW, formatNumber, formatShortDate } from "../lib/format";
import type { DailyComparisonPoint } from "../types";
import { ChartLegend } from "./ChartCard";
import ChartTooltip from "./ChartTooltip";

interface ErrorOverTimeChartProps {
  daily: DailyComparisonPoint[];
}

// Bar colour depends on the size of the error (in MW), ignoring its sign
const SMALL_ERROR_LIMIT = 500;
const MEDIUM_ERROR_LIMIT = 1000;

const MW_TICK_STEP = 1000;

function barColor(error: number): string {
  const size = Math.abs(error);

  if (size < SMALL_ERROR_LIMIT) {
    return colors.forecast; // blue
  }
  if (size <= MEDIUM_ERROR_LIMIT) {
    return colors.error; // amber
  }
  return colors.danger; // red
}

function ErrorOverTimeChart({ daily }: ErrorOverTimeChartProps) {
  // Y axis covers the lowest and highest daily error (bars can be negative)
  const errors = daily.map((day) => day.error);
  const ticks = makeTicks(Math.min(0, ...errors), Math.max(0, ...errors), MW_TICK_STEP);

  return (
    <div>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={daily} margin={{ top: 8, right: 24, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={colors.grid} strokeOpacity={0.5} />

          <XAxis
            dataKey="startTime"
            tickFormatter={formatShortDate}
            interval="preserveStartEnd"
            minTickGap={24}
            tick={{ fill: colors.textMuted, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            ticks={ticks}
            domain={[ticks[0], ticks[ticks.length - 1]]}
            tickFormatter={formatNumber}
            width={72}
            tick={{ fill: colors.textMuted, fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            label={{
              value: "MW",
              angle: -90,
              position: "insideLeft",
              fill: colors.textMuted,
              fontSize: 12,
            }}
          />

          {/* The zero line: bars above it over-forecast, bars below under-forecast */}
          <ReferenceLine y={0} stroke={colors.axis} />

          <Tooltip
            content={
              <ChartTooltip
                formatLabel={(label) => formatShortDate(String(label))}
                formatValue={formatMW}
                showDots={false}
              />
            }
            cursor={{ fill: colors.hoverFill, fillOpacity: 0.5 }}
          />

          <Bar dataKey="error" name="Mean error" radius={[2, 2, 0, 0]}>
            {daily.map((day) => (
              <Cell key={day.startTime} fill={barColor(day.error)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-3">
        <ChartLegend
          items={[
            { label: "< 500 MW", color: colors.forecast },
            { label: "500–1,000 MW", color: colors.error },
            { label: "> 1,000 MW", color: colors.danger },
          ]}
        />
      </div>
    </div>
  );
}

export default ErrorOverTimeChart;
