import numpy as np
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User
from app.routers.upload import get_cleaned_dataframe
from app.services.column_detect import detect_columns

router = APIRouter(prefix="/api/charts", tags=["charts"])


@router.get("/{upload_id}/overview")
def charts_overview(
    upload_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Returns data for the default dashboard chart set: bar, pie, line, area."""
    df = get_cleaned_dataframe(db, upload_id, current_user)
    cols = detect_columns(df)
    rev, product, region, date_col = (
        cols["revenue_column"], cols["product_column"], cols["region_column"], cols["date_column"]
    )

    result = {}

    if product and rev:
        top_products = df.groupby(product)[rev].sum().sort_values(ascending=False).head(10)
        result["bar_top_products"] = [{"name": str(k), "value": float(v)} for k, v in top_products.items()]

    if region and rev:
        by_region = df.groupby(region)[rev].sum().sort_values(ascending=False).head(8)
        result["pie_by_region"] = [{"name": str(k), "value": float(v)} for k, v in by_region.items()]

    if date_col and rev:
        temp = df.copy()
        temp[date_col] = pd.to_datetime(temp[date_col], errors="coerce")
        temp = temp.dropna(subset=[date_col])
        monthly = temp.groupby(temp[date_col].dt.to_period("M"))[rev].sum().sort_index()
        result["line_monthly_sales"] = [{"name": str(k), "value": float(v)} for k, v in monthly.items()]
        result["area_cumulative_sales"] = [
            {"name": str(k), "value": float(v)} for k, v in monthly.cumsum().items()
        ]

    return result


@router.get("/{upload_id}/custom")
def custom_chart(
    upload_id: int,
    chart_type: str = Query(..., pattern="^(bar|pie|line|scatter|area|histogram|heatmap|box)$"),
    x: str | None = None,
    y: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    df = get_cleaned_dataframe(db, upload_id, current_user)

    if chart_type == "histogram":
        col = y or x
        if not col or col not in df.columns:
            raise HTTPException(status_code=400, detail="Valid numeric column required")
        counts, edges = np.histogram(df[col].dropna(), bins=20)
        return {
            "type": "histogram",
            "data": [
                {"bin": f"{edges[i]:.1f}-{edges[i+1]:.1f}", "value": int(counts[i])}
                for i in range(len(counts))
            ],
        }

    if chart_type == "heatmap":
        numeric_df = df.select_dtypes(include=["number"])
        corr = numeric_df.corr().round(3)
        return {"type": "heatmap", "columns": list(corr.columns), "matrix": corr.values.tolist()}

    if chart_type == "box":
        col = y or x
        if not col or col not in df.columns:
            raise HTTPException(status_code=400, detail="Valid numeric column required")
        series = df[col].dropna()
        return {
            "type": "box",
            "min": float(series.min()),
            "q1": float(series.quantile(0.25)),
            "median": float(series.median()),
            "q3": float(series.quantile(0.75)),
            "max": float(series.max()),
        }

    if not x or not y or x not in df.columns or y not in df.columns:
        raise HTTPException(status_code=400, detail="Valid x and y columns are required")

    if chart_type in ("bar", "line", "area"):
        grouped = df.groupby(x)[y].sum().sort_values(ascending=False).head(20)
        return {"type": chart_type, "data": [{"name": str(k), "value": float(v)} for k, v in grouped.items()]}

    if chart_type in ("pie",):
        grouped = df.groupby(x)[y].sum().sort_values(ascending=False).head(10)
        return {"type": "pie", "data": [{"name": str(k), "value": float(v)} for k, v in grouped.items()]}

    if chart_type == "scatter":
        sample = df[[x, y]].dropna().head(500)
        return {"type": "scatter", "data": [{"x": float(r[x]), "y": float(r[y])} for _, r in sample.iterrows()]}

    raise HTTPException(status_code=400, detail="Unsupported chart type")
