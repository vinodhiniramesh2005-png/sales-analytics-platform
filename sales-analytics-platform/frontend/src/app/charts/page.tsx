"use client";

import { useEffect, useRef, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { Download } from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import DatasetPicker from "@/components/DatasetPicker";
import EmptyState from "@/components/EmptyState";
import { useUploads } from "@/hooks/useUploads";
import { api, getErrorMessage } from "@/lib/api";

const COLORS = ["#5B5FEF", "#1FBF87", "#F0A83B", "#EF5A63", "#7B7FF5", "#38BDF8", "#A78BFA", "#F472B6"];

interface OverviewData {
  bar_top_products?: Array<{ name: string; value: number }>;
  pie_by_region?: Array<{ name: string; value: number }>;
  line_monthly_sales?: Array<{ name: string; value: number }>;
  area_cumulative_sales?: Array<{ name: string; value: number }>;
}

export default function ChartsPage() {
  const { uploads, loading, selectedId, setSelectedId } = useUploads();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [histColumn, setHistColumn] = useState<string>("");
  const [histData, setHistData] = useState<Array<{ bin: string; value: number }>>([]);
  const [heatmap, setHeatmap] = useState<{ columns: string[]; matrix: number[][] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId) return;
    async function load() {
      setError(null);
      try {
        const [ov, cols] = await Promise.all([
          api.get<OverviewData>(`/api/charts/${selectedId}/overview`),
          api.get(`/api/datasets/${selectedId}/columns`),
        ]);
        setOverview(ov.data);
        const numericCols: string[] = cols.data.detected.numeric_columns ?? [];
        setColumns(numericCols);
        if (numericCols.length > 0) setHistColumn(numericCols[0]);

        const heat = await api.get(`/api/charts/${selectedId}/custom`, { params: { chart_type: "heatmap" } });
        setHeatmap(heat.data);
      } catch (e) {
        setError(getErrorMessage(e));
      }
    }
    load();
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId || !histColumn) return;
    api
      .get(`/api/charts/${selectedId}/custom`, { params: { chart_type: "histogram", x: histColumn } })
      .then((res) => setHistData(res.data.data));
  }, [selectedId, histColumn]);

  function downloadChartPng(ref: React.RefObject<HTMLDivElement>, filename: string) {
    const svg = ref.current?.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const bbox = svg.getBoundingClientRect();
    canvas.width = bbox.width * 2;
    canvas.height = bbox.height * 2;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      if (!ctx) return;
      ctx.scale(2, 2);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, bbox.width, bbox.height);
      ctx.drawImage(img, 0, 0, bbox.width, bbox.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.png`;
        link.click();
      });
    };
    img.src = url;
  }

  const barRef = useRef<HTMLDivElement>(null);
  const pieRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const histRef = useRef<HTMLDivElement>(null);

  return (
    <DashboardShell title="Charts">
      {loading ? (
        <div className="card h-96 animate-pulse bg-black/5 dark:bg-white/5" />
      ) : uploads.length === 0 ? (
        <EmptyState title="No charts yet" description="Upload a dataset to auto-generate charts." />
      ) : (
        <div className="space-y-6">
          <DatasetPicker uploads={uploads} selectedId={selectedId} onChange={setSelectedId} />
          {error && <div className="card p-4 text-sm text-danger">{error}</div>}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {overview?.bar_top_products && (
              <ChartCard title="Top Products (Bar)" onDownload={() => downloadChartPng(barRef, "top_products_bar")}>
                <div ref={barRef}>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={overview.bar_top_products}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="name" fontSize={10} tick={{ fill: "currentColor" }} interval={0} angle={-20} textAnchor="end" height={60} />
                      <YAxis fontSize={11} tick={{ fill: "currentColor" }} />
                      <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13 }} />
                      <Bar dataKey="value" fill="#5B5FEF" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            )}

            {overview?.pie_by_region && (
              <ChartCard title="Revenue by Region (Pie)" onDownload={() => downloadChartPng(pieRef, "region_pie")}>
                <div ref={pieRef}>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={overview.pie_by_region} dataKey="value" nameKey="name" outerRadius={100} label>
                        {overview.pie_by_region.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            )}

            {overview?.line_monthly_sales && (
              <ChartCard title="Monthly Sales (Line)" onDownload={() => downloadChartPng(lineRef, "monthly_line")}>
                <div ref={lineRef}>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={overview.line_monthly_sales}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="name" fontSize={10} tick={{ fill: "currentColor" }} />
                      <YAxis fontSize={11} tick={{ fill: "currentColor" }} />
                      <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13 }} />
                      <Line type="monotone" dataKey="value" stroke="#1FBF87" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            )}

            {overview?.area_cumulative_sales && (
              <ChartCard title="Cumulative Sales (Area)" onDownload={() => downloadChartPng(areaRef, "cumulative_area")}>
                <div ref={areaRef}>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={overview.area_cumulative_sales}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="name" fontSize={10} tick={{ fill: "currentColor" }} />
                      <YAxis fontSize={11} tick={{ fill: "currentColor" }} />
                      <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13 }} />
                      <Area type="monotone" dataKey="value" stroke="#F0A83B" fill="#F0A83B" fillOpacity={0.2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            )}

            {histData.length > 0 && (
              <ChartCard
                title={`Distribution: ${histColumn} (Histogram)`}
                onDownload={() => downloadChartPng(histRef, "histogram")}
                headerExtra={
                  <select
                    value={histColumn}
                    onChange={(e) => setHistColumn(e.target.value)}
                    className="text-xs bg-transparent border border-border dark:border-border-dark rounded-lg px-2 py-1"
                  >
                    {columns.map((c) => (
                      <option key={c} value={c} className="bg-surface dark:bg-surface-dark">
                        {c}
                      </option>
                    ))}
                  </select>
                }
              >
                <div ref={histRef}>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={histData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="bin" fontSize={9} tick={{ fill: "currentColor" }} interval={2} />
                      <YAxis fontSize={11} tick={{ fill: "currentColor" }} />
                      <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13 }} />
                      <Bar dataKey="value" fill="#7B7FF5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            )}

            {heatmap && (
              <ChartCard title="Correlation Heatmap">
                <HeatmapGrid columns={heatmap.columns} matrix={heatmap.matrix} />
              </ChartCard>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function ChartCard({
  title,
  children,
  onDownload,
  headerExtra,
}: {
  title: string;
  children: React.ReactNode;
  onDownload?: () => void;
  headerExtra?: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display font-semibold text-sm">{title}</h3>
        <div className="flex items-center gap-2">
          {headerExtra}
          {onDownload && (
            <button onClick={onDownload} className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5" title="Download PNG">
              <Download size={15} />
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function HeatmapGrid({ columns, matrix }: { columns: string[]; matrix: number[][] }) {
  function colorFor(v: number) {
    const intensity = Math.abs(v);
    const hue = v >= 0 ? "91, 95, 239" : "239, 90, 99";
    return `rgba(${hue}, ${0.15 + intensity * 0.65})`;
  }
  return (
    <div className="overflow-x-auto">
      <table className="text-xs border-collapse">
        <thead>
          <tr>
            <th></th>
            {columns.map((c) => (
              <th key={c} className="p-1.5 font-medium text-muted dark:text-muted-dark whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <td className="p-1.5 font-medium text-muted dark:text-muted-dark whitespace-nowrap">{columns[i]}</td>
              {row.map((v, j) => (
                <td key={j} className="p-1.5 text-center num rounded" style={{ backgroundColor: colorFor(v) }}>
                  {v.toFixed(2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
