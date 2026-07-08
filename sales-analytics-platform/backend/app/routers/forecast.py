from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User
from app.routers.upload import get_cleaned_dataframe
from app.services.forecasting import build_forecast

router = APIRouter(prefix="/api/forecast", tags=["forecast"])


@router.get("/{upload_id}")
def get_forecast(
    upload_id: int,
    horizon_days: int = Query(30, ge=1, le=730),
    date_column: str | None = None,
    value_column: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    df = get_cleaned_dataframe(db, upload_id, current_user)
    try:
        return build_forecast(df, horizon_days, date_column, value_column)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecast generation failed: {e}")
