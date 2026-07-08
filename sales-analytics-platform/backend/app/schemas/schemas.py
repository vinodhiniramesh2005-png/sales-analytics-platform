from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, EmailStr, Field


# ---------- Auth ----------
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    theme: str
    language: str
    notifications_enabled: bool

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=6)


# ---------- Uploads ----------
class UploadOut(BaseModel):
    id: int
    original_filename: str
    row_count: int
    column_count: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class CleaningSummary(BaseModel):
    rows_before: int
    rows_after: int
    columns_before: int
    columns_after: int
    duplicates_removed: int
    missing_values_filled: int
    columns_renamed: dict[str, str]
    dtype_fixes: dict[str, str]
    date_columns_converted: list[str]


# ---------- Chat ----------
class ChatQuery(BaseModel):
    upload_id: int
    question: str


class ChatResponse(BaseModel):
    answer: str
    data: Optional[Any] = None
    chart_suggestion: Optional[str] = None


# ---------- Forecast ----------
class ForecastRequest(BaseModel):
    upload_id: int
    horizon_days: int = 30
    date_column: Optional[str] = None
    value_column: Optional[str] = None


# ---------- Settings ----------
class SettingsUpdate(BaseModel):
    theme: Optional[str] = None
    language: Optional[str] = None
    notifications_enabled: Optional[bool] = None


class PasswordChange(BaseModel):
    old_password: str
    new_password: str = Field(min_length=6)
