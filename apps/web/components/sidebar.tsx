"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Cpu,
  FileText,
  Home,
  Lightbulb,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHandleStore } from "@/lib/handle-store";

export function Sidebar() {
  const pathname = usePathname();
  const { lastHandle } = useHandleStore();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    {
      href: lastHandle ? `/dashboard/${lastHandle}` : "/dashboard",
      label: "Dashboard",
      icon: BarChart3,
      matchPrefix: "/dashboard",
    },
    {
      href: lastHandle
        ? `/dashboard/${lastHandle}/recommendations`
        : "/recommendations",
      label: "Recommendations",
      icon: Lightbulb,
      matchPrefix: "/recommendations",
    },
    { href: "/notes", label: "My Notes", icon: FileText, matchPrefix: "/notes" },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border flex flex-col bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30">
          <Trophy className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight text-foreground">
            CP Analytics
          </p>
          <p className="text-xs text-muted-foreground">Codeforces Insights</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon, matchPrefix }) => {
          const active = matchPrefix
            ? pathname.startsWith(matchPrefix)
            : href === "/"
              ? pathname === "/"
              : pathname === href;

          return (
            <Link
              key={label}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                active
                  ? "bg-primary/15 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "text-primary" : "")} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer — show active handle if set */}
      <div className="px-4 py-4 border-t border-border space-y-2">
        {lastHandle && (
          <div className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-3 py-2">
            <div className="h-2 w-2 rounded-full bg-green-400 flex-shrink-0" />
            <span className="text-xs font-medium text-primary truncate">
              {lastHandle}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Cpu className="h-3.5 w-3.5 flex-shrink-0" />
          <span>Powered by Codeforces API</span>
        </div>
      </div>
    </aside>
  );
}
