import json
import os
import uuid

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import Upload, User
from app.schemas.schemas import UploadOut
from app.services.cleaning import clean_dataframe, load_any

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}


@router.post("", response_model=UploadOut, status_code=201)
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

    contents = await file.read()
    size_mb = len(contents) / (1024 * 1024)
    if size_mb > settings.MAX_UPLOAD_SIZE_MB:
        raise HTTPException(status_code=400, detail="File exceeds maximum upload size")

    stored_filename = f"{uuid.uuid4().hex}{ext}"
    stored_path = os.path.join(settings.UPLOAD_DIR, stored_filename)
    with open(stored_path, "wb") as f:
        f.write(contents)

    try:
        df = load_any(stored_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse file: {e}")

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded file has no data")

    try:
        cleaned_df, summary = clean_dataframe(df)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cleaning failed: {e}")

    cleaned_filename = f"cleaned_{uuid.uuid4().hex}.csv"
    cleaned_path = os.path.join(settings.UPLOAD_DIR, cleaned_filename)
    cleaned_df.to_csv(cleaned_path, index=False)

    upload = Upload(
        owner_id=current_user.id,
        original_filename=file.filename,
        stored_filename=stored_filename,
        cleaned_filename=cleaned_filename,
        row_count=len(cleaned_df),
        column_count=len(cleaned_df.columns),
        cleaning_summary=json.dumps(summary, default=str),
        status="cleaned",
    )
    db.add(upload)
    db.commit()
    db.refresh(upload)
    return upload


@router.get("", response_model=list[UploadOut])
def list_uploads(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Upload)
    if current_user.role != "admin":
        query = query.filter(Upload.owner_id == current_user.id)
    return query.order_by(Upload.created_at.desc()).all()


@router.get("/{upload_id}/summary")
def get_cleaning_summary(
    upload_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    upload = _get_owned_upload(db, upload_id, current_user)
    return json.loads(upload.cleaning_summary or "{}")


@router.delete("/{upload_id}")
def delete_upload(
    upload_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    upload = _get_owned_upload(db, upload_id, current_user)
    for filename in [upload.stored_filename, upload.cleaned_filename]:
        if filename:
            path = os.path.join(settings.UPLOAD_DIR, filename)
            if os.path.exists(path):
                os.remove(path)
    db.delete(upload)
    db.commit()
    return {"message": "Upload deleted"}


def _get_owned_upload(db: Session, upload_id: int, current_user: User) -> Upload:
    upload = db.query(Upload).filter(Upload.id == upload_id).first()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    if current_user.role != "admin" and upload.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return upload


def get_cleaned_dataframe(db: Session, upload_id: int, current_user: User) -> pd.DataFrame:
    upload = _get_owned_upload(db, upload_id, current_user)
    path = os.path.join(settings.UPLOAD_DIR, upload.cleaned_filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Cleaned dataset file missing")
    return pd.read_csv(path)
