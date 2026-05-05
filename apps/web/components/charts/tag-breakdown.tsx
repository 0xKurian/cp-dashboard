"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import type { TagWeaknessScore } from "@cp-dashboard/types";

interface TagBreakdownBarProps {
  data: TagWeaknessScore[];
}

export function TagBreakdownBar({ data }: TagBreakdownBarProps) {
  if (!data.length) {
    return (
      <div className="rounded-xl border border-border bg-card flex items-center justify-center h-72 text-muted-foreground text-sm">
        No tag data available
      </div>
    );
  }

  const top12 = [...data]
    .sort((a, b) => b.total - a.total)
    .slice(0, 12)
    .map((d) => ({
      ...d,
      tag: d.tag.length > 18 ? d.tag.slice(0, 16) + "…" : d.tag,
    }));

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-sm font-semibold text-foreground mb-2">
        Submission Breakdown by Tag
      </h2>
      <p className="text-xs text-muted-foreground mb-6">
        Green = Accepted, Red = Wrong Answer
      </p>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={top12}
          margin={{ top: 10, right: 10, left: 0, bottom: 60 }}
          barCategoryGap="25%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="oklch(0.30 0.02 265 / 40%)"
            horizontal={true}
            vertical={false}
          />
          <XAxis
            dataKey="tag"
            tick={{ fontSize: 10, fill: "oklch(0.55 0.04 265)" }}
            tickLine={false}
            axisLine={false}
            angle={-40}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "oklch(0.55 0.04 265)" }}
            tickLine={false}
            axisLine={false}
            width={35}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "oklch(0.155 0.018 265)",
              border: "1px solid oklch(0.30 0.02 265 / 60%)",
              borderRadius: "0.75rem",
              fontSize: "12px",
              color: "oklch(0.97 0.005 265)",
            }}
            cursor={{ fill: "oklch(0.22 0.025 265 / 50%)" }}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px", color: "oklch(0.55 0.04 265)" }}
          />
          <Bar dataKey="accepted" name="Accepted" fill="oklch(0.72 0.18 130)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="wrongAnswer" name="Wrong Answer" fill="oklch(0.65 0.20 25)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
