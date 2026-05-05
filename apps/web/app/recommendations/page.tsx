"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RecommendationsIndexPage() {
  const [handle, setHandle] = useState("");
  const router = useRouter();

  return (
    <div className="p-8 flex flex-col items-center justify-center h-full gap-6 text-center">
      <h1 className="text-2xl font-bold text-foreground">
        Smart Recommendations
      </h1>
      <p className="text-muted-foreground max-w-sm">
        Enter a Codeforces handle to get personalized problem recommendations.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (handle.trim())
            router.push(`/dashboard/${handle.trim()}/recommendations`);
        }}
        className="flex gap-3 w-full max-w-sm"
        id="recommendations-search-form"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="rec-handle-input"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="Codeforces handle…"
            className="pl-10"
          />
        </div>
        <Button type="submit" id="rec-go-button">
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
