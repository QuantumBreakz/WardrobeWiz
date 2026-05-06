"""
Outfit routes — MongoDB async rewrite.
The main outfit generation flow is handled by adapter.py.
This file provides the legacy structured endpoint for direct API use.
"""
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel
from typing import Optional

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.services.outfit_service import generate_guided_outfit, generate_surprise_outfit, get_outfit_history

router = APIRouter()


class GuidedOutfitRequest(BaseModel):
    occasion: Optional[str] = None
    mood: Optional[str] = None
    color_preference: Optional[str] = None
    item_id: Optional[str] = None
    query_text: Optional[str] = None


class SurpriseOutfitRequest(BaseModel):
    count: int = 3


@router.post("/guided")
async def guided_outfit(
    payload: GuidedOutfitRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    raw = await generate_guided_outfit(
        db=db,
        faiss_dir=settings.faiss_dir,
        user_id=current_user["id"],
        occasion=payload.occasion,
        mood=payload.mood,
        color_preference=payload.color_preference,
        item_id=payload.item_id,
        query_text=payload.query_text,
        style_vector=None,
    )
    if not raw:
        raise HTTPException(status_code=422, detail="Not enough wardrobe items to generate an outfit.")
    return {"outfits": raw}


@router.post("/surprise")
async def surprise_outfit(
    payload: SurpriseOutfitRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    raw = await generate_surprise_outfit(
        db=db,
        faiss_dir=settings.faiss_dir,
        user_id=current_user["id"],
        count=min(payload.count, 5),
        style_vector=None,
    )
    if not raw:
        raise HTTPException(status_code=422, detail="Not enough wardrobe items to generate an outfit.")
    return {"outfits": raw}


@router.get("/history")
async def outfit_history(
    skip: int = 0,
    limit: int = 20,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    raw_outfits, total = await get_outfit_history(db, current_user["id"], skip=skip, limit=limit)
    return {"outfits": raw_outfits, "total": total}
