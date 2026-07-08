"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Search, Download, ChevronLeft, ChevronRight, ArrowUpDown, Columns3 } from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import { api, getErrorMessage } from "@/lib/api";

interface DatasetResponse {
  columns: string[];
  rows: Record<string, string | number>[];
  total_rows: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export default function DatasetViewerPage() {
  const params = useParams();
  const uploadId = params.id as string;

  const [data, setData] = useState<DatasetResponse | null>(null);
  const [allColumns, setAllColumns] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<DatasetResponse>(`/api/datasets/${uploadId}`, {
        params: {
          page,
          page_size: 25,
          search: search || undefined,
          sort_by: sortBy || undefined,
          sort_dir: sortDir,
          columns: visibleColumns.size > 0 ? Array.from(visibleColumns).join(",") : undefined,
        },
      });
      setData(res.data);
      if (allColumns.length === 0) {
        setAllColumns(res.data.columns);
        setVisibleColumns(new Set(res.data.columns));
      }
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadId, page, search, sortBy, sortDir]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function toggleSort(col: string) {
    if (sortBy === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortDir("asc");
    }
  }

  function toggleColumn(col: string) {
    const next = new Set(visibleColumns);
    if (next.has(col)) next.delete(col);
    else next.add(col);
    setVisibleColumns(next);
  }

  async function handleExport(format: "csv" | "xlsx") {
    const res = await api.get(`/api/datasets/${uploadId}/export`, {
      params: { format },
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = `dataset_${uploadId}.${format}`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <DashboardShell title="Dataset Viewer">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted dark:text-muted-dark" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search all columns…"
              className="input-field pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setColumnMenuOpen((v) => !v)} className="btn-secondary text-sm flex items-center gap-2">
                <Columns3 size={16} /> Columns
              </button>
              {columnMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 card p-2 max-h-72 overflow-y-auto z-10">
                  {allColumns.map((col) => (
                    <label key={col} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visibleColumns.has(col)}
                        onChange={() => toggleColumn(col)}
                        className="accent-accent"
                      />
                      {col}
                    </label>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => handleExport("csv")} className="btn-secondary text-sm flex items-center gap-2">
              <Download size={16} /> CSV
            </button>
            <button onClick={() => handleExport("xlsx")} className="btn-secondary text-sm flex items-center gap-2">
              <Download size={16} /> Excel
            </button>
          </div>
        </div>

        {error && <div className="card p-4 text-sm text-danger">{error}</div>}

        <div className="card overflow-x-auto">
          {loading && !data ? (
            <div className="h-64 animate-pulse bg-black/5 dark:bg-white/5" />
          ) : data ? (
            <table className="w-full text-sm min-w-max">
              <thead>
                <tr className="border-b border-border dark:border-border-dark text-left">
                  {data.columns.map((col) => (
                    <th key={col} className="px-4 py-3 font-medium text-muted dark:text-muted-dark whitespace-nowrap">
                      <button onClick={() => toggleSort(col)} className="flex items-center gap-1 hover:text-ink dark:hover:text-ink-dark">
                        {col}
                        <ArrowUpDown size={12} className={sortBy === col ? "text-accent" : ""} />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, i) => (
                  <tr key={i} className="border-b border-border dark:border-border-dark last:border-0 hover:bg-black/5 dark:hover:bg-white/5">
                    {data.columns.map((col) => (
                      <td key={col} className="px-4 py-2.5 num whitespace-nowrap">
                        {String(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>

        {data && (
          <div className="flex items-center justify-between text-sm text-muted dark:text-muted-dark">
            <span>
              {data.total_rows.toLocaleString()} rows · Page {data.page} of {data.total_pages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-border dark:border-border-dark disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                disabled={page >= data.total_pages}
                className="p-2 rounded-lg border border-border dark:border-border-dark disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
