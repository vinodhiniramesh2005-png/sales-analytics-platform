import re
import pandas as pd
import numpy as np


def normalize_header(col: str) -> str:
    col = str(col).strip()
    col = re.sub(r"[^\w\s]", "", col)
    col = re.sub(r"\s+", "_", col.strip())
    return col.lower()


DATE_HINTS = ("date", "dob", "created", "updated", "shipped", "ordered")


def clean_dataframe(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    """
    Cleans a raw dataframe and returns (cleaned_df, summary_dict).
    Steps: normalize headers, trim strings, fix dtypes, convert dates,
    handle missing values, remove duplicates.
    """
    rows_before, cols_before = df.shape

    # 1. Normalize headers
    original_columns = list(df.columns)
    rename_map = {}
    new_columns = []
    seen = {}
    for col in original_columns:
        new_col = normalize_header(col)
        if new_col in seen:
            seen[new_col] += 1
            new_col = f"{new_col}_{seen[new_col]}"
        else:
            seen[new_col] = 0
        new_columns.append(new_col)
        if new_col != col:
            rename_map[str(col)] = new_col
    df.columns = new_columns

    # 2. Trim whitespace on string/object columns
    for col in df.select_dtypes(include=["object"]).columns:
        df[col] = df[col].apply(lambda x: x.strip() if isinstance(x, str) else x)
        df[col] = df[col].replace({"": np.nan, "nan": np.nan, "NaN": np.nan, "None": np.nan})

    # 3. Detect & convert date columns
    date_columns_converted = []
    for col in df.columns:
        if any(hint in col for hint in DATE_HINTS):
            try:
                converted = pd.to_datetime(df[col], errors="coerce")
                if converted.notna().sum() > 0:
                    df[col] = converted
                    date_columns_converted.append(col)
            except Exception:
                pass

    # 4. Fix numeric dtypes stored as strings
    dtype_fixes = {}
    for col in df.columns:
        if df[col].dtype == "object" and col not in date_columns_converted:
            sample = df[col].dropna().astype(str).str.replace(",", "", regex=False)
            numeric_candidate = pd.to_numeric(sample, errors="coerce")
            if len(sample) > 0 and numeric_candidate.notna().mean() > 0.9:
                df[col] = pd.to_numeric(
                    df[col].astype(str).str.replace(",", "", regex=False), errors="coerce"
                )
                dtype_fixes[col] = "numeric"

    # 5. Handle missing values
    missing_before = int(df.isna().sum().sum())
    for col in df.columns:
        if df[col].dtype.kind in "iuf":  # numeric
            median_val = df[col].median()
            df[col] = df[col].fillna(median_val if pd.notna(median_val) else 0)
        elif np.issubdtype(df[col].dtype, np.datetime64):
            continue  # leave missing dates as NaT
        else:
            mode_series = df[col].mode()
            fill_val = mode_series.iloc[0] if not mode_series.empty else "Unknown"
            df[col] = df[col].fillna(fill_val)
    missing_after = int(df.isna().sum().sum())
    missing_values_filled = missing_before - missing_after

    # 6. Remove duplicate rows
    rows_before_dedup = len(df)
    df = df.drop_duplicates().reset_index(drop=True)
    duplicates_removed = rows_before_dedup - len(df)

    rows_after, cols_after = df.shape

    summary = {
        "rows_before": rows_before,
        "rows_after": rows_after,
        "columns_before": cols_before,
        "columns_after": cols_after,
        "duplicates_removed": duplicates_removed,
        "missing_values_filled": missing_values_filled,
        "columns_renamed": rename_map,
        "dtype_fixes": dtype_fixes,
        "date_columns_converted": date_columns_converted,
    }
    return df, summary


def load_any(path: str) -> pd.DataFrame:
    if path.endswith(".csv"):
        return pd.read_csv(path)
    return pd.read_excel(path)
