from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import Upload, User
from app.routers.upload import get_cleaned_dataframe
from app.services.column_detect import detect_columns

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
def dashboard_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Upload)
    if current_user.role != "admin":
        query = query.filter(Upload.owner_id == current_user.id)
    uploads = query.order_by(Upload.created_at.desc()).all()

    total_uploads = len(uploads)
    total_rows = sum(u.row_count for u in uploads)
    latest_upload = uploads[0] if uploads else None

    kpis = {"total_sales": None, "total_orders": None, "avg_order_value": None, "top_product": None}
    if latest_upload:
        try:
            df = get_cleaned_dataframe(db, latest_upload.id, current_user)
            cols = detect_columns(df)
            rev, product = cols["revenue_column"], cols["product_column"]
            if rev:
                kpis["total_sales"] = float(df[rev].sum())
                kpis["avg_order_value"] = float(df[rev].mean())
            kpis["total_orders"] = len(df)
            if product and rev:
                top = df.groupby(product)[rev].sum().sort_values(ascending=False)
                kpis["top_product"] = str(top.index[0])
        except Exception:
            pass

    return {
        "total_uploads": total_uploads,
        "total_rows_processed": total_rows,
        "latest_upload": {
            "id": latest_upload.id,
            "filename": latest_upload.original_filename,
            "created_at": str(latest_upload.created_at),
        } if latest_upload else None,
        "recent_uploads": [
            {
                "id": u.id,
                "filename": u.original_filename,
                "rows": u.row_count,
                "status": u.status,
                "created_at": str(u.created_at),
            }
            for u in uploads[:5]
        ],
        "kpis": kpis,
    }
