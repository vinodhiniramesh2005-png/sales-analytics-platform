"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DollarSign, ShoppingCart, Package, TrendingUp, ArrowUpRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import DashboardShell from "@/components/layout/DashboardShell";
import KpiCard from "@/components/KpiCard";
import EmptyState from "@/components/EmptyState";
import { api, getErrorMessage } from "@/lib/api";
import { DashboardSummary } from "@/types";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [chartData, setChartData] = useState<Array<{ name: string; value: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<DashboardSummary>("/api/dashboard/summary");
        setSummary(res.data);
        if (res.data.latest_upload) {
          const chartRes = await api.get(`/api/charts/${res.data.latest_upload.id}/overview`);
          setChartData(chartRes.data.bar_top_products ?? []);
        }
      } catch (e) {
        setError(getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <DashboardShell title="Dashboard">
      {loading ? (
        <SkeletonDashboard />
      ) : error ? (
        <div className="card p-6 text-danger text-sm">{error}</div>
      ) : !summary?.latest_upload ? (
        <EmptyState
          title="Welcome to Pulse"
          description="Upload your first sales spreadsheet to see KPIs, charts, and AI-generated insights here."
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Total Sales"
              value={summary.kpis.total_sales ?? 0}
              prefix="$"
              decimals={0}
              icon={DollarSign}
              accentColor="accent"
            />
            <KpiCard
              label="Total Orders"
              value={summary.kpis.total_orders ?? 0}
              icon={ShoppingCart}
              accentColor="success"
            />
            <KpiCard
              label="Avg Order Value"
              value={summary.kpis.avg_order_value ?? 0}
              prefix="$"
              decimals={2}
              icon={TrendingUp}
              accentColor="warning"
            />
            <div className="card p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted dark:text-muted-dark font-medium">Top Product</span>
                <div className="w-9 h-9 rounded-xl bg-danger/10 text-danger flex items-center justify-center">
                  <Package size={17} />
                </div>
              </div>
              <div className="font-display font-semibold text-lg truncate">
                {summary.kpis.top_product ?? "—"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold">Top products by revenue</h3>
                <Link href="/charts" className="text-sm text-accent flex items-center gap-1 hover:underline">
                  View all <ArrowUpRight size={14} />
                </Link>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="name" fontSize={11} tick={{ fill: "currentColor" }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis fontSize={11} tick={{ fill: "currentColor" }} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13 }} />
                  <Bar dataKey="value" fill="#5B5FEF" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-5">
              <h3 className="font-display font-semibold mb-4">Recent uploads</h3>
              <div className="space-y-3">
                {summary.recent_uploads.map((u) => (
                  <Link
                    key={u.id}
                    href={`/datasets/${u.id}`}
                    className="flex items-center justify-between p-2.5 -mx-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{u.filename}</div>
                      <div className="text-xs text-muted dark:text-muted-dark">
                        {u.rows.toLocaleString()} rows
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success shrink-0 ml-2">
                      {u.status}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card p-5 h-28 animate-pulse bg-black/5 dark:bg-white/5" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2 h-80 animate-pulse bg-black/5 dark:bg-white/5" />
        <div className="card h-80 animate-pulse bg-black/5 dark:bg-white/5" />
      </div>
    </div>
  );
}
