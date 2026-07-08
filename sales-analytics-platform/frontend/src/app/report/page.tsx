"use client";

import { useEffect, useState } from "react";
import { FileDown, Lightbulb, Target, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import DashboardShell from "@/components/layout/DashboardShell";
import DatasetPicker from "@/components/DatasetPicker";
import EmptyState from "@/components/EmptyState";
import { useUploads } from "@/hooks/useUploads";
import { api, getErrorMessage } from "@/lib/api";
import { ReportData } from "@/types";

export default function ReportPage() {
  const { uploads, loading, selectedId, setSelectedId } = useUploads();
  const [report, setReport] = useState<ReportData | null>(null);
  const [fetching, setFetching] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId) return;
    setFetching(true);
    setError(null);
    api
      .get<ReportData>(`/api/report/${selectedId}/data`)
      .then((res) => setReport(res.data))
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setFetching(false));
  }, [selectedId]);

  async function handleDownloadPdf() {
    if (!selectedId) return;
    setDownloading(true);
    try {
      const res = await api.get(`/api/report/${selectedId}/pdf`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = "sales_analytics_report.pdf";
      link.click();
      window.URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <DashboardShell title="AI Report">
      {loading ? (
        <div className="card h-96 animate-pulse bg-black/5 dark:bg-white/5" />
      ) : uploads.length === 0 ? (
        <EmptyState title="No report to generate" description="Upload a dataset to generate an AI-written analytics report." />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <DatasetPicker uploads={uploads} selectedId={selectedId} onChange={setSelectedId} />
            <button onClick={handleDownloadPdf} disabled={downloading || !report} className="btn-primary text-sm flex items-center gap-2">
              <FileDown size={16} /> {downloading ? "Generating…" : "Download PDF"}
            </button>
          </div>

          {error && <div className="card p-4 text-sm text-danger">{error}</div>}

          {fetching ? (
            <div className="card h-96 animate-pulse bg-black/5 dark:bg-white/5" />
          ) : report ? (
            <div className="space-y-6">
              <div className="card p-6">
                <h2 className="font-display font-semibold text-lg mb-4">Executive Summary</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <SummaryStat label="Total Sales" value={`$${report.executive_summary.total_sales.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                  <SummaryStat label="Total Orders" value={report.executive_summary.total_orders.toLocaleString()} />
                  <SummaryStat label="Avg Order Value" value={`$${report.executive_summary.avg_order_value.toFixed(2)}`} />
                  {report.executive_summary.total_profit !== null && (
                    <SummaryStat label="Total Profit" value={`$${report.executive_summary.total_profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {report.top_products.length > 0 && (
                  <ReportChartCard title="Top Products">
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={report.top_products}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey="name" fontSize={10} tick={{ fill: "currentColor" }} interval={0} angle={-20} textAnchor="end" height={50} />
                        <YAxis fontSize={11} tick={{ fill: "currentColor" }} />
                        <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13 }} />
                        <Bar dataKey="value" fill="#1FBF87" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ReportChartCard>
                )}

                {report.weak_products.length > 0 && (
                  <ReportChartCard title="Weak Products">
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={report.weak_products}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey="name" fontSize={10} tick={{ fill: "currentColor" }} interval={0} angle={-20} textAnchor="end" height={50} />
                        <YAxis fontSize={11} tick={{ fill: "currentColor" }} />
                        <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13 }} />
                        <Bar dataKey="value" fill="#EF5A63" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ReportChartCard>
                )}

                {report.regional_analysis.length > 0 && (
                  <ReportChartCard title="Regional Analysis">
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={report.regional_analysis}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey="name" fontSize={10} tick={{ fill: "currentColor" }} interval={0} angle={-20} textAnchor="end" height={50} />
                        <YAxis fontSize={11} tick={{ fill: "currentColor" }} />
                        <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13 }} />
                        <Bar dataKey="value" fill="#5B5FEF" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ReportChartCard>
                )}

                {report.monthly_trend.length > 0 && (
                  <ReportChartCard title="Sales Trend">
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={report.monthly_trend}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey="name" fontSize={10} tick={{ fill: "currentColor" }} />
                        <YAxis fontSize={11} tick={{ fill: "currentColor" }} />
                        <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13 }} />
                        <Bar dataKey="value" fill="#F0A83B" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ReportChartCard>
                )}
              </div>

              {report.forecast_summary && (
                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp size={18} className="text-accent" />
                    <h3 className="font-display font-semibold">Forecast Summary</h3>
                  </div>
                  <p className="text-sm text-muted dark:text-muted-dark">
                    Using a {report.forecast_summary.method.replace("_", " ")} model, projected sales for the next 30 days total
                    approximately{" "}
                    <span className="font-medium text-ink dark:text-ink-dark">
                      ${report.forecast_summary.total_forecasted_next_30_days.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                    .
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb size={18} className="text-warning" />
                    <h3 className="font-display font-semibold">AI Insights</h3>
                  </div>
                  <ul className="space-y-2">
                    {report.ai_insights.map((insight, i) => (
                      <li key={i} className="text-sm text-muted dark:text-muted-dark flex gap-2">
                        <span className="text-warning">•</span> {insight}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="card p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Target size={18} className="text-success" />
                    <h3 className="font-display font-semibold">Recommendations</h3>
                  </div>
                  <ul className="space-y-2">
                    {report.recommendations.map((rec, i) => (
                      <li key={i} className="text-sm text-muted dark:text-muted-dark flex gap-2">
                        <span className="text-success">•</span> {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </DashboardShell>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="num text-xl font-semibold">{value}</div>
      <div className="text-xs text-muted dark:text-muted-dark mt-1">{label}</div>
    </div>
  );
}

function ReportChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h3 className="font-display font-semibold text-sm mb-3">{title}</h3>
      {children}
    </div>
  );
}
