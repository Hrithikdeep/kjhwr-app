import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { makeTicks } from "../lib/axis";
import { colors } from "../lib/colors";
import { formatMW, formatNumber, formatShortDate, formatWeekdayDate } from "../lib/format";
import type { DailyMetric } from "../types";
import { ChartLegend } from "./ChartCard";
import ChartTooltip from "./ChartTooltip";

interface DailyAccuracyChartProps {
  dailyMetrics: DailyMetric[];
}

const MW_TICK_STEP = 1000;

function DailyAccuracyChart({ dailyMetrics }: DailyAccuracyChartProps) {
  // Y axis starts at 0 and goes up to just above the biggest value of either line
  const highest = Math.max(...dailyMetrics.flatMap((day) => [day.mae, day.rmse]));
  const ticks = makeTicks(0, highest, MW_TICK_STEP);

  // The best and worst day, judged by MAE
  let best = dailyMetrics[0];
  let worst = dailyMetrics[0];
  for (const day of dailyMetrics) {
    if (day.mae < best.mae) best = day;
    if (day.mae > worst.mae) worst = day;
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={dailyMetrics} margin={{ top: 8, right: 24, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={colors.grid} strokeOpacity={0.5} />

          <XAxis
            dataKey="date"
            tickFormatter={formatShortDate}
            interval="preserveStartEnd"
            minTickGap={24}
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
                formatLabel={(label) => formatWeekdayDate(String(label))}
                formatValue={formatMW}
              />
            }
            cursor={{ stroke: colors.axis }}
          />

          <Line
            type="linear"
            dataKey="mae"
            name="MAE"
            stroke={colors.error}
            strokeWidth={2}
            dot={{ r: 2.5, fill: colors.error, stroke: colors.error }}
            activeDot={{ r: 4 }}
          />
          <Line
            type="linear"
            dataKey="rmse"
            name="RMSE"
            stroke={colors.info}
            strokeWidth={2}
            dot={{ r: 2.5, fill: colors.info, stroke: colors.info }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-3">
        <ChartLegend
          items={[
            { label: "MAE (mean absolute error)", color: colors.error },
            { label: "RMSE (root mean squared error)", color: colors.info },
          ]}
        />
      </div>

      <p className="mt-4 text-xs leading-relaxed text-fg-secondary">
        RMSE is never below MAE, and the gap between them grows when a day has a few very large
        misses. The worst day was {formatShortDate(worst.date)} (MAE {formatMW(worst.mae)}) and the
        best was {formatShortDate(best.date)} (MAE {formatMW(best.mae)}).
      </p>
    </div>
  );
}

export default DailyAccuracyChart;
