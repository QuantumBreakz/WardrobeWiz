"""
Profile routes — MongoDB async rewrite.
"""
import time
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.core.database import get_db
from app.core.dependencies import get_current_user

router = APIRouter()


class ProfileUpdate(BaseModel):
    style_text: Optional[str] = None
    preferred_styles: Optional[list] = None
    preferred_colors: Optional[list] = None
    disliked_colors: Optional[list] = None
    preferred_occasions: Optional[list] = None
    eastern_western_preference: Optional[str] = None


@router.get("/me")
async def get_my_profile(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    profile = await db["user_profiles"].find_one({"user_id": current_user["id"]})
    if not profile:
        return {"user_id": current_user["id"], "style_text": None}
    profile["id"] = str(profile.pop("_id"))
    return profile


@router.put("/me")
async def update_my_profile(
    payload: ProfileUpdate,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    update_fields = {k: v for k, v in payload.model_dump().items() if v is not None}
    update_fields["updated_at"] = time.time()

    existing = await db["user_profiles"].find_one({"user_id": current_user["id"]})
    if existing:
        await db["user_profiles"].update_one(
            {"user_id": current_user["id"]},
            {"$set": update_fields}
        )
    else:
        update_fields["user_id"] = current_user["id"]
        update_fields["created_at"] = time.time()
        await db["user_profiles"].insert_one(update_fields)

    profile = await db["user_profiles"].find_one({"user_id": current_user["id"]})
    if profile:
        profile["id"] = str(profile.pop("_id"))
    return profile
