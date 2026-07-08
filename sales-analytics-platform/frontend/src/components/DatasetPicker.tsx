"use client";

import { UploadRecord } from "@/types";
import { Database } from "lucide-react";

export default function DatasetPicker({
  uploads,
  selectedId,
  onChange,
}: {
  uploads: UploadRecord[];
  selectedId: number | null;
  onChange: (id: number) => void;
}) {
  if (uploads.length === 0) return null;

  return (
    <div className="flex items-center gap-2 card px-3 py-2 w-full sm:w-auto">
      <Database size={16} className="text-muted dark:text-muted-dark shrink-0" />
      <select
        value={selectedId ?? ""}
        onChange={(e) => onChange(Number(e.target.value))}
        className="bg-transparent text-sm font-medium outline-none w-full cursor-pointer"
      >
        {uploads.map((u) => (
          <option key={u.id} value={u.id} className="bg-surface dark:bg-surface-dark">
            {u.original_filename} ({u.row_count.toLocaleString()} rows)
          </option>
        ))}
      </select>
    </div>
  );
}
