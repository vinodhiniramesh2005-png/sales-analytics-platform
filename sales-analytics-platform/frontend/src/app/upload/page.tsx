"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileSpreadsheet, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import { api, getErrorMessage } from "@/lib/api";
import { CleaningSummary, UploadRecord } from "@/types";
import Link from "next/link";

type UploadStatus = "idle" | "uploading" | "success" | "error";

export default function UploadPage() {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadRecord | null>(null);
  const [summary, setSummary] = useState<CleaningSummary | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setStatus("uploading");
    setProgress(0);
    setError(null);
    setResult(null);
    setSummary(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post<UploadRecord>("/api/uploads", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (evt) => {
          if (evt.total) setProgress(Math.round((evt.loaded / evt.total) * 100));
        },
      });
      setResult(res.data);
      const summaryRes = await api.get(`/api/uploads/${res.data.id}/summary`);
      setSummary(summaryRes.data);
      setStatus("success");
    } catch (e) {
      setError(getErrorMessage(e));
      setStatus("error");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    maxFiles: 1,
    disabled: status === "uploading",
  });

  return (
    <DashboardShell title="Upload">
      <div className="max-w-3xl mx-auto space-y-6">
        <div
          {...getRootProps()}
          className={`card border-2 border-dashed p-12 text-center cursor-pointer transition-colors ${
            isDragActive ? "border-accent bg-accent/5" : "border-border dark:border-border-dark"
          }`}
        >
          <input {...getInputProps()} />
          <div className="w-16 h-16 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mx-auto mb-4">
            <UploadCloud size={30} />
          </div>
          <h3 className="font-display font-semibold text-lg mb-1">
            {isDragActive ? "Drop your file here" : "Drag & drop your spreadsheet"}
          </h3>
          <p className="text-sm text-muted dark:text-muted-dark mb-4">or click to browse — .csv, .xlsx, .xls</p>
          <button type="button" className="btn-primary text-sm">
            Choose file
          </button>
        </div>

        <AnimatePresence>
          {status === "uploading" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="card p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <FileSpreadsheet size={20} className="text-accent" />
                <span className="text-sm font-medium">Uploading & cleaning your data…</span>
              </div>
              <div className="h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full bg-accent rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut" }}
                />
              </div>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-5 flex items-start gap-3">
              <XCircle className="text-danger shrink-0" size={20} />
              <div>
                <div className="font-medium text-sm mb-1">Upload failed</div>
                <div className="text-sm text-muted dark:text-muted-dark">{error}</div>
              </div>
            </motion.div>
          )}

          {status === "success" && result && summary && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-6 space-y-5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-success" size={22} />
                <div>
                  <div className="font-display font-semibold">{result.original_filename} cleaned successfully</div>
                  <div className="text-sm text-muted dark:text-muted-dark">
                    {result.row_count.toLocaleString()} rows × {result.column_count} columns
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatBox label="Rows before" value={summary.rows_before} />
                <StatBox label="Rows after" value={summary.rows_after} />
                <StatBox label="Duplicates removed" value={summary.duplicates_removed} highlight="danger" />
                <StatBox label="Missing values filled" value={summary.missing_values_filled} highlight="success" />
              </div>

              {summary.date_columns_converted.length > 0 && (
                <div className="text-sm text-muted dark:text-muted-dark">
                  Converted to dates: <span className="font-medium text-ink dark:text-ink-dark">{summary.date_columns_converted.join(", ")}</span>
                </div>
              )}

              <Link href={`/datasets/${result.id}`} className="btn-primary inline-flex items-center gap-2 text-sm">
                View cleaned dataset <ArrowRight size={16} />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardShell>
  );
}

function StatBox({ label, value, highlight }: { label: string; value: number; highlight?: "success" | "danger" }) {
  return (
    <div className="rounded-xl bg-black/5 dark:bg-white/5 p-3">
      <div
        className={`num text-lg font-semibold ${
          highlight === "success" ? "text-success" : highlight === "danger" ? "text-danger" : ""
        }`}
      >
        {value.toLocaleString()}
      </div>
      <div className="text-xs text-muted dark:text-muted-dark mt-0.5">{label}</div>
    </div>
  );
}
