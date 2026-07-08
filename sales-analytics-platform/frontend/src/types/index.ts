export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
  theme: "light" | "dark";
  language: string;
  notifications_enabled: boolean;
}

export interface UploadRecord {
  id: number;
  original_filename: string;
  row_count: number;
  column_count: number;
  status: string;
  created_at: string;
}

export interface CleaningSummary {
  rows_before: number;
  rows_after: number;
  columns_before: number;
  columns_after: number;
  duplicates_removed: number;
  missing_values_filled: number;
  columns_renamed: Record<string, string>;
  dtype_fixes: Record<string, string>;
  date_columns_converted: string[];
}

export interface ChatResponse {
  answer: string;
  data: Record<string, number> | { total?: number; average?: number; count?: number } | null;
  chart_suggestion: string | null;
}

export interface ForecastPoint {
  date: string;
  value: number;
  lower?: number;
  upper?: number;
}

export interface ForecastResult {
  method: string;
  date_column: string;
  value_column: string;
  history: ForecastPoint[];
  forecast: ForecastPoint[];
  total_forecasted: number;
}

export interface DashboardSummary {
  total_uploads: number;
  total_rows_processed: number;
  latest_upload: { id: number; filename: string; created_at: string } | null;
  recent_uploads: Array<{ id: number; filename: string; rows: number; status: string; created_at: string }>;
  kpis: {
    total_sales: number | null;
    total_orders: number | null;
    avg_order_value: number | null;
    top_product: string | null;
  };
}

export interface ReportData {
  executive_summary: {
    total_sales: number;
    total_profit: number | null;
    total_orders: number;
    avg_order_value: number;
  };
  top_products: Array<{ name: string; value: number }>;
  weak_products: Array<{ name: string; value: number }>;
  regional_analysis: Array<{ name: string; value: number }>;
  monthly_trend: Array<{ name: string; value: number }>;
  forecast_summary: { method: string; total_forecasted_next_30_days: number } | null;
  recommendations: string[];
  ai_insights: string[];
}
