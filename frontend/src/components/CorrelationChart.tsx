import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { makeTicks } from "../lib/axis";
import { colors } from "../lib/colors";
import { formatMW, formatNumber } from "../lib/format";
import type { ScatterPoint } from "../types";
import { ChartLegend } from "./ChartCard";
import ChartTooltip from "./ChartTooltip";

interface CorrelationChartProps {
  points: ScatterPoint[];
}

const MW_TICK_STEP = 6000; // wider steps than the other charts, because this one is smaller
const DOT_AREA = 24; // size of each dot
const DOT_OPACITY = 0.4; // see-through, so overlapping dots look darker

function CorrelationChart({ points }: CorrelationChartProps) {
  // Both axes use the same scale, so the line y = x really is a 45 degree
  // diagonal and a dot on it means a perfect forecast.
  const highest = Math.max(...points.flatMap((point) => [point.actual, point.forecast]));
  const ticks = makeTicks(0, highest, MW_TICK_STEP);
  const axisMax = ticks[ticks.length - 1];

  return (
    <div>
      <div className="mb-2">
        <ChartLegend
          align="end"
          items={[{ label: "Settlement period", color: colors.forecast }]}
        />
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <ScatterChart margin={{ top: 8, right: 24, bottom: 16, left: 0 }}>
          <CartesianGrid stroke={colors.grid} strokeOpacity={0.5} />

          <XAxis
            type="number"
            dataKey="actual"
            name="Actual"
            ticks={ticks}
            domain={[0, axisMax]}
            tickFormatter={formatNumber}
            tick={{ fill: colors.textMuted, fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: colors.axis }}
            label={{
              value: "Actual (MW)",
              position: "insideBottom",
              offset: -12,
              fill: colors.textMuted,
              fontSize: 12,
            }}
          />
          <YAxis
            type="number"
            dataKey="forecast"
            name="Forecast"
            ticks={ticks}
            domain={[0, axisMax]}
            tickFormatter={formatNumber}
            width={76}
            tick={{ fill: colors.textMuted, fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: colors.axis }}
            label={{
              value: "Forecast (MW)",
              angle: -90,
              position: "insideLeft",
              fill: colors.textMuted,
              fontSize: 12,
            }}
          />
          <ZAxis range={[DOT_AREA, DOT_AREA]} />

          {/* Dashed diagonal: where forecast = actual */}
          <ReferenceLine
            segment={[
              { x: 0, y: 0 },
              { x: axisMax, y: axisMax },
            ]}
            stroke={colors.textMuted}
            strokeDasharray="4 4"
          />

          <Tooltip
            content={<ChartTooltip formatValue={formatMW} showDots={false} />}
            cursor={{ strokeDasharray: "3 3", stroke: colors.axis }}
          />

          <Scatter
            data={points}
            fill={colors.forecast}
            fillOpacity={DOT_OPACITY}
            isAnimationActive={false}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

export default CorrelationChart;
