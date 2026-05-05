"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useHandleStore } from "@/lib/handle-store";
import { Loader2 } from "lucide-react";

export default function DashboardIndexPage() {
  const router = useRouter();
  const { lastHandle } = useHandleStore();

  useEffect(() => {
    if (lastHandle) {
      router.replace(`/dashboard/${lastHandle}`);
    } else {
      router.replace("/");
    }
  }, [lastHandle, router]);

  return (
    <div className="flex h-full items-center justify-center gap-2 text-muted-foreground text-sm">
      <Loader2 className="h-4 w-4 animate-spin" />
      Redirecting…
    </div>
  );
}
