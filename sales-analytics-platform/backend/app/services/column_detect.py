import pandas as pd

REVENUE_HINTS = ["revenue", "sales", "amount", "total"]
PROFIT_HINTS = ["profit", "margin"]
DATE_HINTS = ["date", "order_date", "created"]
PRODUCT_HINTS = ["product", "item", "sku"]
CUSTOMER_HINTS = ["customer", "client"]
REGION_HINTS = ["region", "state", "country", "territory"]
QUANTITY_HINTS = ["quantity", "qty", "units"]


def _find_column(columns: list[str], hints: list[str]) -> str | None:
    for hint in hints:
        for col in columns:
            if hint == col:
                return col
    for hint in hints:
        for col in columns:
            if hint in col:
                return col
    return None


def detect_columns(df: pd.DataFrame) -> dict:
    columns = list(df.columns)
    numeric_cols = list(df.select_dtypes(include=["number"]).columns)
    date_cols = [c for c in columns if "datetime" in str(df[c].dtype)]
    if not date_cols:
        date_cols = [c for c in columns if _find_column([c], DATE_HINTS)]

    return {
        "revenue_column": _find_column(numeric_cols or columns, REVENUE_HINTS),
        "profit_column": _find_column(numeric_cols or columns, PROFIT_HINTS),
        "date_column": date_cols[0] if date_cols else _find_column(columns, DATE_HINTS),
        "product_column": _find_column(columns, PRODUCT_HINTS),
        "customer_column": _find_column(columns, CUSTOMER_HINTS),
        "region_column": _find_column(columns, REGION_HINTS),
        "quantity_column": _find_column(columns, QUANTITY_HINTS),
        "numeric_columns": numeric_cols,
        "all_columns": columns,
    }
