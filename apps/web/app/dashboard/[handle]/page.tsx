"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  RefreshCw,
  Star,
  TrendingUp,
  User,
  Zap,
  BookOpen,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { RatingChart } from "@/components/charts/rating-chart";
import { WeaknessRadar } from "@/components/charts/weakness-radar";
import { TagBreakdownBar } from "@/components/charts/tag-breakdown";
import { api } from "@/lib/api";
import { toast } from "@/components/toaster";
import { useHandleStore } from "@/lib/handle-store";
import type { AnalyticsSummaryDto, UserProfileDto } from "@cp-dashboard/types";

interface DashboardPageProps {
  params: Promise<{ handle: string }>;
}

function StatCard({
  label,
  value,
  icon: Icon,
  colorClass,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  colorClass?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
      <div className={`rounded-lg p-2.5 ${colorClass ?? "bg-primary/10"}`}>
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

export default function DashboardPage({ params }: DashboardPageProps) {
  const { handle } = use(params);
  const queryClient = useQueryClient();
  const setLastHandle = useHandleStore((s) => s.setHandle);
  const [isSyncing, setIsSyncing] = useState(false);

  // Persist handle to localStorage on navigation
  useEffect(() => {
    setLastHandle(handle);
  }, [handle, setLastHandle]);

  // ─── Profile query ─────────────────────────────────────────
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useQuery<UserProfileDto>({
    queryKey: ["profile", handle],
    queryFn: () => api.getProfile(handle),
    retry: 1,
  });

  // ─── Analytics query ────────────────────────────────────────
  const { data: analytics, isLoading: analyticsLoading } =
    useQuery<AnalyticsSummaryDto>({
      queryKey: ["analytics", handle],
      queryFn: () => api.getAnalytics(handle),
      enabled: !!profile,
    });

  // ─── Auto-sync: if profile 404, trigger sync automatically ──
  const syncMutation = useMutation({
    mutationFn: () => api.syncUser(handle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", handle] });
      queryClient.invalidateQueries({ queryKey: ["analytics", handle] });
    },
  });

  useEffect(() => {
    if (profileError && !syncMutation.isPending && !syncMutation.isSuccess) {
      // Profile not found → auto-trigger sync
      const tid = toast.loading(
        `Syncing ${handle}…`,
        "Fetching data from Codeforces for the first time"
      );
      syncMutation.mutate(undefined, {
        onSuccess: () => {
          toast.resolve(tid, "success", `Synced ${handle}!`, "Dashboard is ready");
          queryClient.invalidateQueries({ queryKey: ["profile", handle] });
          queryClient.invalidateQueries({ queryKey: ["analytics", handle] });
        },
        onError: (err) => {
          toast.resolve(tid, "error", "Sync failed", (err as Error).message);
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileError]);

  // ─── Manual sync handler ────────────────────────────────────
  const handleSync = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    const tid = toast.loading(`Syncing ${handle}…`, "This may take a few seconds");
    try {
      const result = await api.syncUser(handle);
      toast.resolve(
        tid,
        "success",
        `Synced ${handle}!`,
        `${result.submissionsCount.toLocaleString()} submissions, ${result.problemsCount.toLocaleString()} problems`
      );
      queryClient.invalidateQueries({ queryKey: ["profile", handle] });
      queryClient.invalidateQueries({ queryKey: ["analytics", handle] });
    } catch (err) {
      toast.resolve(tid, "error", "Sync failed", (err as Error).message);
    } finally {
      setIsSyncing(false);
    }
  }, [handle, isSyncing, queryClient]);

  // ─── Loading skeleton ───────────────────────────────────────
  if (profileLoading || (profileError && syncMutation.isPending)) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
        {syncMutation.isPending && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Syncing {handle} from Codeforces…</span>
          </div>
        )}
      </div>
    );
  }

  if (profileError && !syncMutation.isPending && syncMutation.isError) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-full gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium text-foreground">
          User not found:{" "}
          <span className="text-primary">{handle}</span>
        </p>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          This handle doesn&apos;t exist on Codeforces, or the CF API is unreachable.
        </p>
        <Button
          variant="outline"
          onClick={handleSync}
          id="retry-button"
          disabled={isSyncing}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  if (!profile) return null;

  const ratingColor =
    (profile.currentRating ?? 0) >= 2400
      ? "text-red-400"
      : (profile.currentRating ?? 0) >= 2100
        ? "text-orange-400"
        : (profile.currentRating ?? 0) >= 1900
          ? "text-violet-400"
          : (profile.currentRating ?? 0) >= 1600
            ? "text-blue-400"
            : "text-teal-400";

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-5">
          <Avatar className="h-16 w-16 border-2 border-primary/40">
            <AvatarImage src={profile.avatar ?? undefined} alt={handle} />
            <AvatarFallback className="text-lg bg-primary/20 text-primary font-bold">
              {handle.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{handle}</h1>
              {profile.rank && (
                <Badge
                  variant="outline"
                  className={`text-xs font-semibold border-primary/40 ${ratingColor}`}
                >
                  {profile.rank}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {profile.country ?? "Unknown location"} •{" "}
              {profile.lastSynced
                ? `Last synced ${new Date(profile.lastSynced).toLocaleDateString()}`
                : "Not yet synced"}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="border-primary/30 hover:bg-primary/10 hover:text-primary"
            id="view-recommendations-button"
          >
            <Link href={`/dashboard/${handle}/recommendations`}>
              <Zap className="mr-2 h-4 w-4" />
              Recommendations
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing}
            className="border-border hover:bg-secondary"
            id="sync-button"
          >
            {isSyncing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sync Data
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Current Rating"
          value={profile.currentRating ?? "N/A"}
          icon={Star}
          colorClass="bg-primary/10"
        />
        <StatCard
          label="Max Rating"
          value={profile.maxRating ?? "N/A"}
          icon={TrendingUp}
          colorClass="bg-amber-400/10"
        />
        <StatCard
          label="Problems Solved"
          value={analytics?.solvedProblems?.toLocaleString() ?? "—"}
          icon={User}
          colorClass="bg-teal-400/10"
        />
        <StatCard
          label="Accept Rate"
          value={
            analytics?.acceptedRate != null
              ? `${(analytics.acceptedRate * 100).toFixed(1)}%`
              : "—"
          }
          icon={Star}
          colorClass="bg-green-400/10"
        />
      </div>

      {/* Charts */}
      {analyticsLoading ? (
        <Skeleton className="h-80 rounded-xl" />
      ) : !analytics ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground text-sm">
          Analytics not available. Click &quot;Sync Data&quot; to refresh.
        </div>
      ) : (
        <Tabs defaultValue="rating" className="space-y-4">
          <TabsList className="bg-card border border-border" id="analytics-tabs">
            <TabsTrigger value="rating">Rating History</TabsTrigger>
            <TabsTrigger value="weakness">Weakness Radar</TabsTrigger>
            <TabsTrigger value="tags">Tag Breakdown</TabsTrigger>
          </TabsList>

          <TabsContent value="rating" className="mt-0">
            <RatingChart data={analytics.ratingHistory} />
          </TabsContent>
          <TabsContent value="weakness" className="mt-0">
            <WeaknessRadar data={analytics.tagWeaknesses} />
          </TabsContent>
          <TabsContent value="tags" className="mt-0">
            <TagBreakdownBar data={analytics.tagWeaknesses} />
          </TabsContent>
        </Tabs>
      )}

      {/* Quick links row */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href={`/dashboard/${handle}/recommendations`}
          className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
          id="recommendations-card"
        >
          <div className="rounded-lg p-2.5 bg-primary/10">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              Smart Recommendations
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Problems rated +100–300 above your level
            </p>
          </div>
          <ExternalLink className="ml-auto h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </Link>

        <Link
          href="/notes"
          className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 hover:border-teal-400/40 hover:shadow-lg hover:shadow-teal-400/5 transition-all duration-200"
          id="notes-card"
        >
          <div className="rounded-lg p-2.5 bg-teal-400/10">
            <BookOpen className="h-5 w-5 text-teal-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground group-hover:text-teal-400 transition-colors">
              Editorial Notes
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Write and export Obsidian-compatible markdown
            </p>
          </div>
          <ExternalLink className="ml-auto h-4 w-4 text-muted-foreground group-hover:text-teal-400 transition-colors" />
        </Link>
      </div>
    </div>
  );
}
