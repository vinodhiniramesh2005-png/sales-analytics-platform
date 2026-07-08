"use client";

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Line, ComposedChart } from "recharts";
import { TrendingUp } from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import DatasetPicker from "@/components/DatasetPicker";
import EmptyState from "@/components/EmptyState";
import { useUploads } from "@/hooks/useUploads";
import { api, getErrorMessage } from "@/lib/api";
import { ForecastResult } from "@/types";

const HORIZONS = [
  { label: "30 Days", value: 30 },
  { label: "60 Days", value: 60 },
  { label: "90 Days", value: 90 },
  { label: "1 Year", value: 365 },
];

export default function ForecastPage() {
  const { uploads, loading, selectedId, setSelectedId } = useUploads();
  const [horizon, setHorizon] = useState(30);
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId) return;
    setFetching(true);
    setError(null);
    api
      .get<ForecastResult>(`/api/forecast/${selectedId}`, { params: { horizon_days: horizon } })
      .then((res) => setForecast(res.data))
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setFetching(false));
  }, [selectedId, horizon]);

  const chartData = forecast
    ? [
        ...forecast.history.slice(-60).map((h) => ({ date: h.date, actual: h.value, forecast: null, lower: null, upper: null })),
        ...forecast.forecast.map((f) => ({ date: f.date, actual: null, forecast: f.value, lower: f.lower, upper: f.upper })),
      ]
    : [];

  return (
    <DashboardShell title="Forecast">
      {loading ? (
        <div className="card h-96 animate-pulse bg-black/5 dark:bg-white/5" />
      ) : uploads.length === 0 ? (
        <EmptyState title="No data to forecast" description="Upload a dataset with dates and revenue to generate forecasts." />
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <DatasetPicker uploads={uploads} selectedId={selectedId} onChange={setSelectedId} />
            <div className="flex gap-1.5 card p-1">
              {HORIZONS.map((h) => (
                <button
                  key={h.value}
                  onClick={() => setHorizon(h.value)}
                  className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                    horizon === h.value ? "bg-accent text-white" : "hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="card p-4 text-sm text-danger">{error}</div>}

          {fetching ? (
            <div className="card h-96 animate-pulse bg-black/5 dark:bg-white/5" />
          ) : forecast ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="card p-5">
                  <div className="flex items-center gap-2 text-sm text-muted dark:text-muted-dark mb-2">
                    <TrendingUp size={16} /> Total forecasted ({horizon} days)
                  </div>
                  <div className="num text-2xl font-semibold">
                    $
                    {forecast.total_forecasted.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div className="card p-5">
                  <div className="text-sm text-muted dark:text-muted-dark mb-2">Model used</div>
                  <div className="font-display font-semibold capitalize">{forecast.method.replace("_", " ")}</div>
                </div>
              </div>

              <div className="card p-5">
                <h3 className="font-display font-semibold mb-4">Historical actuals vs. forecast (95% CI)</h3>
                <ResponsiveContainer width="100%" height={380}>
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="date" fontSize={10} tick={{ fill: "currentColor" }} minTickGap={40} />
                    <YAxis fontSize={11} tick={{ fill: "currentColor" }} />
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area type="monotone" dataKey="upper" stroke="none" fill="#5B5FEF" fillOpacity={0.08} name="Upper bound" />
                    <Area type="monotone" dataKey="lower" stroke="none" fill="#ffffff" fillOpacity={1} name="Lower bound" />
                    <Line type="monotone" dataKey="actual" stroke="#1FBF87" strokeWidth={2} dot={false} name="Actual" connectNulls={false} />
                    <Line type="monotone" dataKey="forecast" stroke="#5B5FEF" strokeWidth={2} strokeDasharray="5 4" dot={false} name="Forecast" connectNulls={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : null}
        </div>
      )}
    </DashboardShell>
  );
}
