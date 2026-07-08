import io

import pandas as pd
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User
from app.routers.upload import get_cleaned_dataframe
from app.services.column_detect import detect_columns

router = APIRouter(prefix="/api/datasets", tags=["datasets"])


@router.get("/{upload_id}")
def get_dataset(
    upload_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=500),
    sort_by: str | None = None,
    sort_dir: str = Query("asc", pattern="^(asc|desc)$"),
    search: str | None = None,
    columns: str | None = None,  # comma-separated visible columns
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    df = get_cleaned_dataframe(db, upload_id, current_user)

    if search:
        mask = df.astype(str).apply(lambda row: row.str.contains(search, case=False, na=False)).any(axis=1)
        df = df[mask]

    if sort_by and sort_by in df.columns:
        df = df.sort_values(by=sort_by, ascending=(sort_dir == "asc"))

    total_rows = len(df)

    if columns:
        visible = [c.strip() for c in columns.split(",") if c.strip() in df.columns]
        if visible:
            df = df[visible]

    start = (page - 1) * page_size
    end = start + page_size
    page_df = df.iloc[start:end]

    return {
        "columns": list(df.columns),
        "rows": page_df.fillna("").to_dict(orient="records"),
        "total_rows": total_rows,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, (total_rows + page_size - 1) // page_size),
    }


@router.get("/{upload_id}/columns")
def get_columns(
    upload_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    df = get_cleaned_dataframe(db, upload_id, current_user)
    detected = detect_columns(df)
    return {"columns": list(df.columns), "detected": detected}


@router.get("/{upload_id}/export")
def export_dataset(
    upload_id: int,
    format: str = Query("csv", pattern="^(csv|xlsx)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    df = get_cleaned_dataframe(db, upload_id, current_user)

    if format == "csv":
        buf = io.StringIO()
        df.to_csv(buf, index=False)
        buf.seek(0)
        return StreamingResponse(
            iter([buf.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=dataset_{upload_id}.csv"},
        )
    else:
        buf = io.BytesIO()
        with pd.ExcelWriter(buf, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="Cleaned Data")
        buf.seek(0)
        return StreamingResponse(
            buf,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=dataset_{upload_id}.xlsx"},
        )
