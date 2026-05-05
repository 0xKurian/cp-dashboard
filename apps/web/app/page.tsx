"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ArrowRight,
  Trophy,
  Zap,
  Target,
  BookOpen,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHandleStore } from "@/lib/handle-store";

const features = [
  {
    icon: Trophy,
    title: "Rating Analytics",
    description:
      "Visualize your rating journey with an interactive area chart and contest-by-contest breakdown.",
    color: "text-amber-400",
    bg: "bg-amber-400/10 border-amber-400/20",
  },
  {
    icon: Target,
    title: "Weakness Radar",
    description:
      "Identify your weakest algorithm topics from submission history — dp, graphs, math, and more.",
    color: "text-rose-400",
    bg: "bg-rose-400/10 border-rose-400/20",
  },
  {
    icon: Zap,
    title: "Smart Recommendations",
    description:
      "Get problem suggestions rated 100–300 above your current level, prioritized by your weak tags.",
    color: "text-primary",
    bg: "bg-primary/10 border-primary/20",
  },
  {
    icon: BookOpen,
    title: "Editorial Notes",
    description:
      "Write solution notes with code snippets and export them as Obsidian-compatible Markdown files.",
    color: "text-teal-400",
    bg: "bg-teal-400/10 border-teal-400/20",
  },
];

const EXAMPLE_HANDLES = ["tourist", "Benq", "jiangly", "ecnerwala"];

export default function HomePage() {
  const [handle, setHandle] = useState("");
  const router = useRouter();
  const { lastHandle } = useHandleStore();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = handle.trim();
    if (!trimmed) return;
    router.push(`/dashboard/${trimmed}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center flex-1 px-6 py-24 text-center overflow-hidden">
        {/* Glow background */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 right-1/4 w-[300px] h-[200px] bg-teal-500/8 blur-[100px] rounded-full" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary mb-8">
          <Zap className="h-3.5 w-3.5" />
          Built for Codeforces — From Pupil to Legendary Grandmaster
        </div>

        <h1 className="text-5xl font-bold tracking-tight text-foreground max-w-2xl leading-tight mb-6">
          Level up your{" "}
          <span className="bg-gradient-to-r from-primary to-teal-400 bg-clip-text text-transparent">
            competitive programming
          </span>{" "}
          with data
        </h1>

        <p className="text-lg text-muted-foreground max-w-xl mb-10 leading-relaxed">
          Enter your Codeforces handle to get a full performance breakdown,
          identify weak topics, and receive smart problem recommendations.
        </p>

        {/* Search form */}
        <form
          onSubmit={handleSearch}
          className="flex items-center gap-3 w-full max-w-md"
          id="handle-search-form"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="handle-input"
              type="text"
              placeholder="Enter Codeforces handle…"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="pl-10 h-12 bg-card border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
            />
          </div>
          <Button
            type="submit"
            size="lg"
            className="h-12 px-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all"
            id="analyze-button"
          >
            Analyze
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>

        {/* Continue button if last handle exists */}
        {lastHandle && (
          <button
            onClick={() => router.push(`/dashboard/${lastHandle}`)}
            className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
            id="continue-button"
          >
            <History className="h-3.5 w-3.5" />
            Continue as{" "}
            <span className="font-semibold text-primary">{lastHandle}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}

        <p className="mt-4 text-xs text-muted-foreground">
          Try:{" "}
          {EXAMPLE_HANDLES.map((h) => (
            <button
              key={h}
              onClick={() => router.push(`/dashboard/${h}`)}
              className="text-primary hover:underline mx-1 transition-colors"
            >
              {h}
            </button>
          ))}
        </p>
      </section>

      {/* Features grid */}
      <section className="px-8 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {features.map(({ icon: Icon, title, description, color, bg }) => (
            <div
              key={title}
              className={`rounded-xl border p-5 ${bg} transition-all duration-200 hover:scale-[1.02] hover:shadow-lg`}
            >
              <Icon className={`h-6 w-6 ${color} mb-3`} />
              <h3 className="text-sm font-semibold text-foreground mb-1.5">
                {title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
