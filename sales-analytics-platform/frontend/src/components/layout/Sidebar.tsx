"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UploadCloud,
  Table2,
  MessageSquareText,
  BarChart3,
  TrendingUp,
  FileBarChart,
  Settings,
  Activity,
} from "lucide-react";
import clsx from "clsx";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload", icon: UploadCloud },
  { href: "/datasets", label: "Datasets", icon: Table2 },
  { href: "/chat", label: "AI Chat", icon: MessageSquareText },
  { href: "/charts", label: "Charts", icon: BarChart3 },
  { href: "/forecast", label: "Forecast", icon: TrendingUp },
  { href: "/report", label: "Reports", icon: FileBarChart },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-border dark:border-border-dark bg-surface dark:bg-surface-dark h-screen sticky top-0">
      <div className="h-16 flex items-center gap-2 px-6 border-b border-border dark:border-border-dark">
        <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
          <Activity size={16} className="text-white" strokeWidth={2.5} />
        </div>
        <span className="font-display font-semibold text-lg tracking-tight">Pulse</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-muted dark:text-muted-dark hover:bg-black/5 dark:hover:bg-white/5 hover:text-ink dark:hover:text-ink-dark"
              )}
            >
              <Icon size={18} strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 text-xs text-muted dark:text-muted-dark border-t border-border dark:border-border-dark">
        Pulse Analytics v1.0
      </div>
    </aside>
  );
}
