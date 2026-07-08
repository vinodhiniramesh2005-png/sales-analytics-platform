"use client";

import { useEffect, useState, useCallback } from "react";
import { api, getErrorMessage } from "@/lib/api";
import { UploadRecord } from "@/types";

export function useUploads() {
  const [uploads, setUploads] = useState<UploadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const fetchUploads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<UploadRecord[]>("/api/uploads");
      setUploads(res.data);
      setSelectedId((prev) => prev ?? (res.data.length > 0 ? res.data[0].id : null));
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUploads();
  }, [fetchUploads]);

  return { uploads, loading, error, selectedId, setSelectedId, refetch: fetchUploads };
}
