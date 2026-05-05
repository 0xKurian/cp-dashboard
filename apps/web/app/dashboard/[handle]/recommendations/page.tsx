"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Zap, AlertCircle, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { RecommendedProblem, RecommendationsDto } from "@cp-dashboard/types";

interface RecommendationsPageProps {
  params: Promise<{ handle: string }>;
}

function DifficultyBadge({ rating }: { rating: number }) {
  const color =
    rating >= 2400
      ? "border-red-400/40 text-red-400 bg-red-400/10"
      : rating >= 2100
        ? "border-orange-400/40 text-orange-400 bg-orange-400/10"
        : rating >= 1900
          ? "border-violet-400/40 text-violet-400 bg-violet-400/10"
          : rating >= 1600
            ? "border-blue-400/40 text-blue-400 bg-blue-400/10"
            : "border-teal-400/40 text-teal-400 bg-teal-400/10";

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${color}`}
    >
      ★ {rating}
    </span>
  );
}

function ProblemCard({
  problem,
  handle,
}: {
  problem: RecommendedProblem;
  handle: string;
}) {
  return (
    <Card className="bg-card border-border hover:border-primary/40 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 p-5 group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Rating + weakness badges */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <DifficultyBadge rating={problem.rating} />
            {problem.weaknessTags.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs text-primary">
                <Zap className="h-3 w-3" />
                Targets your weak tags
              </span>
            )}
          </div>

          {/* Problem name */}
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-3 truncate">
            {problem.name}
          </h3>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {problem.tags.slice(0, 5).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className={`text-xs ${
                  problem.weaknessTags.includes(tag)
                    ? "bg-primary/20 text-primary border-primary/30 border"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {tag}
              </Badge>
            ))}
            {problem.tags.length > 5 && (
              <Badge variant="secondary" className="text-xs text-muted-foreground">
                +{problem.tags.length - 5}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Action row */}
      <div className="flex items-center gap-2 pt-3 border-t border-border">
        <a
          href={problem.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary py-2 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-all"
          aria-label={`Open ${problem.name} on Codeforces`}
          id={`open-problem-${problem.id}`}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Solve on Codeforces
        </a>
        <Link
          href={`/problem/${problem.id}/note?handle=${handle}`}
          className="flex items-center justify-center gap-2 rounded-lg border border-teal-500/30 bg-teal-500/10 py-2 px-3 text-xs text-teal-400 hover:bg-teal-500/20 transition-all"
          id={`note-problem-${problem.id}`}
        >
          <FileText className="h-3.5 w-3.5" />
          Note
        </Link>
      </div>
    </Card>
  );
}

export default function RecommendationsPage({
  params,
}: RecommendationsPageProps) {
  const { handle } = use(params);

  const { data, isLoading, error } = useQuery<RecommendationsDto>({
    queryKey: ["recommendations", handle],
    queryFn: () => api.getRecommendations(handle),
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 flex flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-muted-foreground">
          Could not load recommendations. Sync your data first.
        </p>
        <Button variant="outline" asChild>
          <Link href={`/dashboard/${handle}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground -ml-2">
            <Link href={`/dashboard/${handle}`}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              {handle}
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <Zap className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">
            Recommendations
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {data.problems.length > 0
            ? `${data.problems.length} unsolved problems in rating range `
            : "No unsolved problems found in rating range "}
          <span className="text-foreground font-medium">
            {data.targetRatingMin}–{data.targetRatingMax}
          </span>
          , sorted by your weakness profile.{" "}
          <span className="text-primary border border-primary/20 rounded px-1.5 py-0.5 bg-primary/5 text-xs">
            Your rating: {data.currentRating}
          </span>
        </p>
      </div>

      {/* Problem grid */}
      {data.problems.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center space-y-3">
          <Zap className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground font-medium">
            No unsolved problems found in this rating range.
          </p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            This often means you&apos;ve solved most problems at this difficulty — or you&apos;re at
            the top! Try syncing your data again or check a lower rating range.
          </p>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          id="recommendations-grid"
        >
          {data.problems.map((problem) => (
            <ProblemCard key={problem.id} problem={problem} handle={handle} />
          ))}
        </div>
      )}
    </div>
  );
}
