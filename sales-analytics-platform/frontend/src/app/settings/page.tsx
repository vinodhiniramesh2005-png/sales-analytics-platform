"use client";

import { useState, FormEvent } from "react";
import { Sun, Moon, Bell, Globe, Lock, Check } from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { api, getErrorMessage } from "@/lib/api";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "hi", label: "हिन्दी" },
];

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useState(user?.language ?? "en");
  const [notifications, setNotifications] = useState(user?.notifications_enabled ?? true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  async function savePreferences(nextTheme?: "light" | "dark") {
    setSavingPrefs(true);
    setPrefsSaved(false);
    try {
      const res = await api.put("/api/settings/me", {
        theme: nextTheme ?? theme,
        language,
        notifications_enabled: notifications,
      });
      updateUser(res.data);
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 2000);
    } finally {
      setSavingPrefs(false);
    }
  }

  async function handleThemeChange(t: "light" | "dark") {
    setTheme(t);
    await savePreferences(t);
  }

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);
    setSavingPassword(true);
    try {
      await api.put("/api/settings/password", { old_password: oldPassword, new_password: newPassword });
      setPasswordSuccess(true);
      setOldPassword("");
      setNewPassword("");
    } catch (err) {
      setPasswordError(getErrorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <DashboardShell title="Settings">
      <div className="max-w-3xl space-y-6">
        {/* Profile */}
        <div className="card p-6">
          <h3 className="font-display font-semibold mb-4">Profile</h3>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-accent/15 text-accent flex items-center justify-center font-display font-semibold text-2xl">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="font-medium">{user?.name}</div>
              <div className="text-sm text-muted dark:text-muted-dark">{user?.email}</div>
              <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent capitalize">
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Theme */}
        <div className="card p-6">
          <h3 className="font-display font-semibold mb-4">Appearance</h3>
          <div className="flex gap-3">
            <button
              onClick={() => handleThemeChange("light")}
              className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border transition-colors ${
                theme === "light" ? "border-accent bg-accent/5 text-accent" : "border-border dark:border-border-dark"
              }`}
            >
              <Sun size={18} /> Light
            </button>
            <button
              onClick={() => handleThemeChange("dark")}
              className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border transition-colors ${
                theme === "dark" ? "border-accent bg-accent/5 text-accent" : "border-border dark:border-border-dark"
              }`}
            >
              <Moon size={18} /> Dark
            </button>
          </div>
        </div>

        {/* Language & Notifications */}
        <div className="card p-6 space-y-5">
          <h3 className="font-display font-semibold">Preferences</h3>
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <Globe size={16} /> Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="input-field w-full sm:w-64"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-surface dark:bg-surface-dark">
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-2">
              <Bell size={16} /> Email notifications
            </label>
            <button
              onClick={() => setNotifications((v) => !v)}
              className={`w-11 h-6 rounded-full transition-colors relative ${notifications ? "bg-accent" : "bg-black/10 dark:bg-white/10"}`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  notifications ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <button onClick={() => savePreferences()} disabled={savingPrefs} className="btn-primary text-sm flex items-center gap-2">
            {prefsSaved ? <Check size={16} /> : null}
            {savingPrefs ? "Saving…" : prefsSaved ? "Saved" : "Save preferences"}
          </button>
        </div>

        {/* Password */}
        <div className="card p-6">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
            <Lock size={16} /> Change password
          </h3>
          <form onSubmit={handlePasswordChange} className="space-y-3 max-w-sm">
            <input
              type="password"
              placeholder="Current password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              className="input-field"
            />
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="input-field"
            />
            {passwordError && <div className="text-sm text-danger">{passwordError}</div>}
            {passwordSuccess && <div className="text-sm text-success">Password updated successfully.</div>}
            <button type="submit" disabled={savingPassword} className="btn-primary text-sm">
              {savingPassword ? "Updating…" : "Update password"}
            </button>
          </form>
        </div>
      </div>
    </DashboardShell>
  );
}
