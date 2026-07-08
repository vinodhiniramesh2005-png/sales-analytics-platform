"use client";

import { useState } from "react";
import { Sun, Moon, LogOut, ChevronDown, Menu } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar({ title, onMenuClick }: { title: string; onMenuClick?: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="h-16 border-b border-border dark:border-border-dark bg-surface/80 dark:bg-surface-dark/80 backdrop-blur sticky top-0 z-20 flex items-center justify-between px-4 md:px-8">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="md:hidden p-2 -ml-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
          <Menu size={20} />
        </button>
        <h1 className="font-display font-semibold text-lg">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus-ring"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center font-semibold text-sm font-display">
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <span className="hidden sm:block text-sm font-medium">{user?.name}</span>
            <ChevronDown size={14} className="text-muted dark:text-muted-dark" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 card p-1 animate-fade-in">
              <div className="px-3 py-2 text-xs text-muted dark:text-muted-dark border-b border-border dark:border-border-dark mb-1">
                {user?.email}
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-danger hover:bg-danger/10 transition-colors"
              >
                <LogOut size={16} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
