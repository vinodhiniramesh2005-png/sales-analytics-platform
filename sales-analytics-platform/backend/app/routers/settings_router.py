from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.security import verify_password, hash_password
from app.models.models import User
from app.schemas.schemas import SettingsUpdate, PasswordChange, UserOut

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("/me", response_model=UserOut)
def get_settings(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserOut)
def update_settings(
    payload: SettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.theme is not None:
        if payload.theme not in ("light", "dark"):
            raise HTTPException(status_code=400, detail="Theme must be 'light' or 'dark'")
        current_user.theme = payload.theme
    if payload.language is not None:
        current_user.language = payload.language
    if payload.notifications_enabled is not None:
        current_user.notifications_enabled = payload.notifications_enabled
    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/password")
def change_password(
    payload: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Old password is incorrect")
    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password updated successfully"}
