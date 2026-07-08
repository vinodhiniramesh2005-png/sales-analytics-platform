from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user")  # "admin" or "user"
    language = Column(String, default="en")
    theme = Column(String, default="dark")
    notifications_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utcnow)

    uploads = relationship("Upload", back_populates="owner")


class Upload(Base):
    __tablename__ = "uploads"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    original_filename = Column(String, nullable=False)
    stored_filename = Column(String, nullable=False)
    cleaned_filename = Column(String, nullable=True)
    row_count = Column(Integer, default=0)
    column_count = Column(Integer, default=0)
    cleaning_summary = Column(Text, nullable=True)  # JSON string
    status = Column(String, default="uploaded")  # uploaded, cleaned, error
    created_at = Column(DateTime, default=utcnow)

    owner = relationship("User", back_populates="uploads")
