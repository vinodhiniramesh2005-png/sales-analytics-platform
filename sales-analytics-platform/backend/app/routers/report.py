from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User
from app.routers.upload import get_cleaned_dataframe
from app.services.report import build_report_data, generate_pdf_report

router = APIRouter(prefix="/api/report", tags=["report"])


@router.get("/{upload_id}/data")
def get_report_data(
    upload_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    df = get_cleaned_dataframe(db, upload_id, current_user)
    return build_report_data(df)


@router.get("/{upload_id}/pdf")
def get_report_pdf(
    upload_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    df = get_cleaned_dataframe(db, upload_id, current_user)
    try:
        pdf_path = generate_pdf_report(df)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {e}")
    return FileResponse(pdf_path, media_type="application/pdf", filename="sales_analytics_report.pdf")
