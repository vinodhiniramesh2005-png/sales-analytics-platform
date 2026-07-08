from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User
from app.routers.upload import get_cleaned_dataframe
from app.schemas.schemas import ChatQuery, ChatResponse
from app.services.chat_engine import answer_question

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
def chat(
    payload: ChatQuery,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    df = get_cleaned_dataframe(db, payload.upload_id, current_user)
    result = answer_question(df, payload.question)
    return ChatResponse(**result)


@router.get("/suggestions")
def suggestions():
    return {
        "questions": [
            "What is total sales?",
            "Best selling product",
            "Monthly sales",
            "Highest profit",
            "Worst performing state",
            "Top customers",
            "Average revenue",
            "Compare last year",
        ]
    }
