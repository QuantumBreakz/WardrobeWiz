"""
Feedback routes — MongoDB async rewrite (simplified, used by adapter.py).
"""
from fastapi import APIRouter, Depends, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.services.feedback_service import get_user_feedback

router = APIRouter()


@router.get("/history")
async def get_my_feedback(
    skip: int = 0,
    limit: int = 50,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    events = await get_user_feedback(db, current_user["id"], skip=skip, limit=limit)
    return {"events": events, "total": len(events)}
