"use client";

import Link from "next/link";
import { Trash2, Eye } from "lucide-react";
import DashboardShell from "@/components/layout/DashboardShell";
import EmptyState from "@/components/EmptyState";
import { useUploads } from "@/hooks/useUploads";
import { api } from "@/lib/api";

export default function DatasetsPage() {
  const { uploads, loading, refetch } = useUploads();

  async function handleDelete(id: number) {
    if (!confirm("Delete this dataset? This cannot be undone.")) return;
    await api.delete(`/api/uploads/${id}`);
    refetch();
  }

  return (
    <DashboardShell title="Datasets">
      {loading ? (
        <div className="card h-64 animate-pulse bg-black/5 dark:bg-white/5" />
      ) : uploads.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border dark:border-border-dark text-left text-muted dark:text-muted-dark">
                <th className="px-5 py-3 font-medium">File</th>
                <th className="px-5 py-3 font-medium">Rows</th>
                <th className="px-5 py-3 font-medium">Columns</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Uploaded</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {uploads.map((u) => (
                <tr key={u.id} className="border-b border-border dark:border-border-dark last:border-0 hover:bg-black/5 dark:hover:bg-white/5">
                  <td className="px-5 py-3.5 font-medium">{u.original_filename}</td>
                  <td className="px-5 py-3.5 num">{u.row_count.toLocaleString()}</td>
                  <td className="px-5 py-3.5 num">{u.column_count}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success">{u.status}</span>
                  </td>
                  <td className="px-5 py-3.5 text-muted dark:text-muted-dark">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/datasets/${u.id}`} className="p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/10">
                        <Eye size={16} />
                      </Link>
                      <button onClick={() => handleDelete(u.id)} className="p-2 rounded-lg hover:bg-danger/10 text-danger">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
