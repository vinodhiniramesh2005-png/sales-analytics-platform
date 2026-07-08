"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Mail, Lock, User as UserIcon, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

export default function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password, rememberMe);
      } else {
        await register(name, email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgotPassword(e: FormEvent) {
    e.preventDefault();
    setForgotSent(true);
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-bg-dark flex items-center justify-center px-4">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-accent/15 blur-[140px]" />
        <svg className="absolute bottom-0 left-0 w-full h-64 opacity-40" viewBox="0 0 1200 200" preserveAspectRatio="none">
          <motion.path
            d="M0,150 Q150,20 300,120 T600,90 T900,140 T1200,60"
            fill="none"
            stroke="url(#pulseGradient)"
            strokeWidth="2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
          <defs>
            <linearGradient id="pulseGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#5B5FEF" stopOpacity="0" />
              <stop offset="50%" stopColor="#5B5FEF" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#1FBF87" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shadow-glow">
            <Activity size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display font-semibold text-2xl text-ink-dark">Pulse</span>
        </div>

        <div className="card bg-surface-dark/90 backdrop-blur-xl border-border-dark p-8">
          {forgotMode ? (
            <ForgotPasswordForm
              sent={forgotSent}
              onSubmit={handleForgotPassword}
              onBack={() => {
                setForgotMode(false);
                setForgotSent(false);
              }}
            />
          ) : (
            <>
              <h1 className="font-display font-semibold text-xl text-ink-dark mb-1">
                {mode === "login" ? "Welcome back" : "Create your account"}
              </h1>
              <p className="text-sm text-muted-dark mb-6">
                {mode === "login"
                  ? "Sign in to see what your sales data is telling you."
                  : "The first account created becomes the workspace admin."}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence mode="wait">
                  {mode === "register" && (
                    <motion.div
                      key="name"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <label className="text-xs font-medium text-muted-dark mb-1.5 block">Full name</label>
                      <div className="relative">
                        <UserIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-dark" />
                        <input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          className="input-field pl-9 bg-surface-dark text-ink-dark border-border-dark"
                          placeholder="Ada Lovelace"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label className="text-xs font-medium text-muted-dark mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-dark" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="input-field pl-9 bg-surface-dark text-ink-dark border-border-dark"
                      placeholder="you@company.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-dark mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-dark" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="input-field pl-9 pr-9 bg-surface-dark text-ink-dark border-border-dark"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-dark"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {mode === "login" && (
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 text-muted-dark cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-border-dark accent-accent"
                      />
                      Remember me
                    </label>
                    <button
                      type="button"
                      onClick={() => setForgotMode(true)}
                      className="text-accent hover:text-accent-light font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {error && (
                  <div className="text-sm text-danger bg-danger/10 rounded-xl px-3 py-2.5">{error}</div>
                )}

                <button type="submit" disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2">
                  {submitting ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
                  {!submitting && <ArrowRight size={16} />}
                </button>
              </form>

              <p className="text-sm text-muted-dark text-center mt-6">
                {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => {
                    setMode(mode === "login" ? "register" : "login");
                    setError(null);
                  }}
                  className="text-accent hover:text-accent-light font-medium"
                >
                  {mode === "login" ? "Create one" : "Sign in"}
                </button>
              </p>
            </>
          )}
        </div>
        <p className="text-center text-xs text-muted-dark mt-6">
          <Link href="/login" className="hover:text-ink-dark">
            Pulse — AI Sales Analytics
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

function ForgotPasswordForm({
  sent,
  onSubmit,
  onBack,
}: {
  sent: boolean;
  onSubmit: (e: FormEvent) => void;
  onBack: () => void;
}) {
  const [email, setEmail] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post("/api/auth/forgot-password", { email });
    } catch {
      // Intentionally silent: never reveal whether an email exists
    }
    onSubmit(e);
  }

  if (sent) {
    return (
      <div className="text-center py-4">
        <h2 className="font-display font-semibold text-lg text-ink-dark mb-2">Check your email</h2>
        <p className="text-sm text-muted-dark mb-6">
          If an account exists for that address, we&apos;ve sent a reset link.
        </p>
        <button onClick={onBack} className="btn-secondary text-ink-dark border-border-dark">
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <h2 className="font-display font-semibold text-lg text-ink-dark mb-1">Reset your password</h2>
      <p className="text-sm text-muted-dark mb-5">Enter your email and we&apos;ll send you a reset link.</p>
      <label className="text-xs font-medium text-muted-dark mb-1.5 block">Email</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="input-field bg-surface-dark text-ink-dark border-border-dark mb-4"
        placeholder="you@company.com"
      />
      <button type="submit" className="btn-primary w-full mb-3">
        Send reset link
      </button>
      <button type="button" onClick={onBack} className="btn-secondary w-full text-ink-dark border-border-dark">
        Back to sign in
      </button>
    </form>
  );
}
