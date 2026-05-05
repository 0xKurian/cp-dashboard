"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";
import { format } from "date-fns";
import type { RatingDataPoint } from "@cp-dashboard/types";

interface RatingChartProps {
  data: RatingDataPoint[];
}

const ratingTiers = [
  { value: 800, label: "Newbie", color: "#94a3b8" },
  { value: 1200, label: "Pupil", color: "#4ade80" },
  { value: 1400, label: "Specialist", color: "#2dd4bf" },
  { value: 1600, label: "Expert", color: "#60a5fa" },
  { value: 1900, label: "C. Master", color: "#a78bfa" },
  { value: 2100, label: "Master", color: "#f97316" },
  { value: 2400, label: "G. Master", color: "#f87171" },
];

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: RatingDataPoint }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const delta = d.delta;
  return (
    <div className="rounded-xl border border-border bg-card/95 backdrop-blur p-3 text-sm shadow-xl">
      <p className="font-semibold text-foreground mb-1 max-w-[220px] truncate">
        {d.contestName}
      </p>
      <p className="text-muted-foreground text-xs mb-2">
        {format(new Date(d.date), "dd MMM yyyy")} • Rank #{d.rank}
      </p>
      <div className="flex items-center gap-3">
        <span className="text-foreground font-bold text-base">{d.rating}</span>
        <span
          className={`text-sm font-medium ${delta >= 0 ? "text-green-400" : "text-red-400"}`}
        >
          {delta >= 0 ? "+" : ""}
          {delta}
        </span>
      </div>
    </div>
  );
}

export function RatingChart({ data }: RatingChartProps) {
  if (!data.length) {
    return (
      <div className="rounded-xl border border-border bg-card flex items-center justify-center h-72 text-muted-foreground text-sm">
        No rating history available
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    date: format(new Date(d.date), "MMM ''yy"),
  }));

  const minRating = Math.min(...data.map((d) => d.rating)) - 100;
  const maxRating = Math.max(...data.map((d) => d.rating)) + 100;

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-sm font-semibold text-foreground mb-6">
        Rating History
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="oklch(0.30 0.02 265 / 40%)"
            vertical={false}
          />
          {ratingTiers.map(({ value, color }) =>
            value >= minRating && value <= maxRating ? (
              <ReferenceLine
                key={value}
                y={value}
                stroke={color}
                strokeOpacity={0.25}
                strokeDasharray="4 4"
              />
            ) : null
          )}
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "oklch(0.55 0.04 265)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[minRating, maxRating]}
            tick={{ fontSize: 11, fill: "oklch(0.55 0.04 265)" }}
            tickLine={false}
            axisLine={false}
            width={45}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="rating"
            stroke="var(--color-chart-1)"
            strokeWidth={2.5}
            fill="url(#ratingGradient)"
            dot={false}
            activeDot={{
              r: 5,
              fill: "var(--color-chart-1)",
              stroke: "oklch(0.155 0.018 265)",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
