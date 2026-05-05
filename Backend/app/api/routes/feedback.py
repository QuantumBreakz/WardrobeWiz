from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.feedback import (
    FeedbackCreate,
    FeedbackResponse,
    PreferenceStatResponse,
    UserFeedbackSummary,
)
from app.services import feedback_service
from app.services.profile_service import get_user

router = APIRouter()

VALID_ACTIONS = {"like", "dislike", "skip", "save"}


@router.post("/", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_feedback(payload: FeedbackCreate, db: Session = Depends(get_db)):
    user = get_user(db, payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.action not in VALID_ACTIONS:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid action '{payload.action}'. Must be one of: {VALID_ACTIONS}",
        )

    if not payload.outfit_id and not payload.wardrobe_item_id:
        raise HTTPException(
            status_code=422,
            detail="Either outfit_id or wardrobe_item_id must be provided",
        )

    event = feedback_service.store_feedback(db, payload)
    return event


@router.get("/{user_id}", response_model=UserFeedbackSummary)
def get_feedback(
    user_id: int,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    events, total, stats = feedback_service.get_user_feedback(db, user_id, skip=skip, limit=limit)

    return UserFeedbackSummary(
        user_id=user_id,
        total_feedback=total,
        recent_feedback=[FeedbackResponse.model_validate(e) for e in events],
        preference_stats=[PreferenceStatResponse.model_validate(s) for s in stats],
    )
