import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { makeTicks } from "../lib/axis";
import { colors } from "../lib/colors";
import { formatMW, formatNumber } from "../lib/format";
import type { HourlyProfile } from "../types";
import ChartTooltip from "./ChartTooltip";

interface HourlyProfileChartProps {
  hourly: HourlyProfile[];
}

const MW_TICK_STEP = 500;

function HourlyProfileChart({ hourly }: HourlyProfileChartProps) {
  // The hours with the smallest and the biggest average error
  let best = hourly[0];
  let worst = hourly[0];
  for (const hour of hourly) {
    if (hour.meanAbsError < best.meanAbsError) best = hour;
    if (hour.meanAbsError > worst.meanAbsError) worst = hour;
  }

  const ticks = makeTicks(0, worst.meanAbsError, MW_TICK_STEP);

  // Bars are amber, except the best hour (green) and the worst hour (red)
  function barColor(hour: HourlyProfile): string {
    if (hour.hour === best.hour) return colors.actual;
    if (hour.hour === worst.hour) return colors.danger;
    return colors.error;
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={290}>
        <BarChart data={hourly} margin={{ top: 8, right: 24, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={colors.grid} strokeOpacity={0.5} />

          <XAxis
            dataKey="label"
            interval="preserveStartEnd"
            minTickGap={16}
            tick={{ fill: colors.textMuted, fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: colors.axis }}
          />
          <YAxis
            ticks={ticks}
            domain={[0, ticks[ticks.length - 1]]}
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

          <Tooltip
            content={
              <ChartTooltip
                formatLabel={(label) => `Hour starting ${label}`}
                formatValue={formatMW}
                showDots={false}
              />
            }
            cursor={{ fill: colors.hoverFill, fillOpacity: 0.5 }}
          />

          <Bar dataKey="meanAbsError" name="Mean absolute error" radius={[2, 2, 0, 0]}>
            {hourly.map((hour) => (
              <Cell key={hour.hour} fill={barColor(hour)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <p className="mt-4 text-xs leading-relaxed text-fg-secondary">
        Forecasts were most accurate at {best.label} (MAE {formatMW(best.meanAbsError)}, green) and
        least accurate at {worst.label} (MAE {formatMW(worst.meanAbsError)}, red). Hours are UTC,
        which is the same as UK time in January.
      </p>
    </div>
  );
}

export default HourlyProfileChart;
