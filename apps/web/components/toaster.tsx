"use client";

import { useEffect, useCallback, useRef } from "react";
import { X, CheckCircle, AlertCircle, Loader2, Info } from "lucide-react";
import { create } from "zustand";
import { cn } from "@/lib/utils";

// ─── Toast Store (Zustand) ────────────────────────────────────
export type ToastType = "success" | "error" | "loading" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms; 0 = persist until dismissed
}

interface ToastStore {
  toasts: Toast[];
  add: (t: Omit<Toast, "id">) => string;
  remove: (id: string) => void;
  update: (id: string, patch: Partial<Toast>) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (t) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, ...t }] }));
    return id;
  },
  remove: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  update: (id, patch) =>
    set((s) => ({
      toasts: s.toasts.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    })),
}));

// ─── Convenience helpers ───────────────────────────────────────
export const toast = {
  success: (title: string, message?: string) =>
    useToastStore.getState().add({ type: "success", title, message, duration: 4000 }),
  error: (title: string, message?: string) =>
    useToastStore.getState().add({ type: "error", title, message, duration: 6000 }),
  loading: (title: string, message?: string) =>
    useToastStore.getState().add({ type: "loading", title, message, duration: 0 }),
  info: (title: string, message?: string) =>
    useToastStore.getState().add({ type: "info", title, message, duration: 4000 }),
  dismiss: (id: string) => useToastStore.getState().remove(id),
  resolve: (id: string, type: "success" | "error", title: string, message?: string) => {
    useToastStore.getState().update(id, { type, title, message, duration: 4000 });
  },
};

// ─── Single Toast Item ─────────────────────────────────────────
function ToastItem({ t, onDismiss }: { t: Toast; onDismiss: () => void }) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!t.duration) return;
    timer.current = setTimeout(onDismiss, t.duration);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [t.duration, onDismiss]);

  const icons = {
    success: <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />,
    error: <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />,
    loading: <Loader2 className="h-4 w-4 text-primary animate-spin flex-shrink-0" />,
    info: <Info className="h-4 w-4 text-blue-400 flex-shrink-0" />,
  };

  const borderColors = {
    success: "border-green-500/30",
    error: "border-red-500/30",
    loading: "border-primary/30",
    info: "border-blue-500/30",
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border bg-card/95 backdrop-blur-sm px-4 py-3 shadow-2xl",
        "animate-in slide-in-from-right-5 fade-in duration-300",
        "max-w-sm w-full",
        borderColors[t.type]
      )}
      role="alert"
    >
      {icons[t.type]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{t.title}</p>
        {t.message && (
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {t.message}
          </p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ─── Toaster Container ─────────────────────────────────────────
export function Toaster() {
  const { toasts, remove } = useToastStore();

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none"
      aria-live="polite"
      id="toaster"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem t={t} onDismiss={() => remove(t.id)} />
        </div>
      ))}
    </div>
  );
}
