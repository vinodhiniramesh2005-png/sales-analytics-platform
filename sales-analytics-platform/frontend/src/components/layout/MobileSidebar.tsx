"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Activity } from "lucide-react";
import clsx from "clsx";
import {
  LayoutDashboard,
  UploadCloud,
  Table2,
  MessageSquareText,
  BarChart3,
  TrendingUp,
  FileBarChart,
  Settings,
} from "lucide-react";

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

export default function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 md:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-0 top-0 bottom-0 w-72 bg-surface dark:bg-surface-dark border-r border-border dark:border-border-dark flex flex-col animate-slide-up">
        <div className="h-16 flex items-center justify-between px-5 border-b border-border dark:border-border-dark">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
              <Activity size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-semibold text-lg">Pulse</span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  isActive ? "bg-accent/10 text-accent" : "text-muted dark:text-muted-dark hover:bg-black/5 dark:hover:bg-white/5"
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
