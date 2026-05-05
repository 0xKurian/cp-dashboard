"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { TagWeaknessScore } from "@cp-dashboard/types";

interface WeaknessRadarProps {
  data: TagWeaknessScore[];
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: TagWeaknessScore & { fullMark: number } }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-border bg-card/95 backdrop-blur p-3 text-sm shadow-xl">
      <p className="font-semibold text-foreground capitalize mb-1">{d.tag}</p>
      <div className="space-y-0.5 text-xs text-muted-foreground">
        <p>
          Accepted:{" "}
          <span className="text-green-400 font-medium">{d.accepted}</span>
        </p>
        <p>
          Wrong Answer:{" "}
          <span className="text-red-400 font-medium">{d.wrongAnswer}</span>
        </p>
        <p>
          Weakness Score:{" "}
          <span className="text-primary font-medium">
            {(d.weaknessScore * 100).toFixed(0)}%
          </span>
        </p>
      </div>
    </div>
  );
}

export function WeaknessRadar({ data }: WeaknessRadarProps) {
  if (!data.length) {
    return (
      <div className="rounded-xl border border-border bg-card flex items-center justify-center h-72 text-muted-foreground text-sm">
        No tag data available
      </div>
    );
  }

  // Take top 8 weakest tags
  const top8 = [...data]
    .sort((a, b) => b.weaknessScore - a.weaknessScore)
    .slice(0, 8)
    .map((d) => ({
      ...d,
      tag: d.tag.length > 14 ? d.tag.slice(0, 12) + "…" : d.tag,
      score: Math.round(d.weaknessScore * 100),
      fullMark: 100,
    }));

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-sm font-semibold text-foreground mb-2">
        Weakness Analysis
      </h2>
      <p className="text-xs text-muted-foreground mb-6">
        Higher score = more wrong answers relative to accepted submissions
      </p>
      <ResponsiveContainer width="100%" height={320}>
        <RadarChart data={top8} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid
            stroke="oklch(0.30 0.02 265 / 40%)"
            gridType="polygon"
          />
          <PolarAngleAxis
            dataKey="tag"
            tick={{ fontSize: 11, fill: "oklch(0.55 0.04 265)" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Radar
            name="Weakness"
            dataKey="score"
            stroke="var(--color-chart-4)"
            fill="var(--color-chart-4)"
            fillOpacity={0.25}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
