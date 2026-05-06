"""
Admin-only routes — mounted under /api/admin.
All routes require is_admin=True via the get_admin_user dependency.
"""
import time
import logging
from typing import Any, Dict, List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.core.database import get_db
from app.core.dependencies import get_admin_user
from app.services.embedding_service import get_pipeline_status, reload_model

logger = logging.getLogger(__name__)
router = APIRouter()

_START_TIME = time.time()


# ── Metrics ────────────────────────────────────────────────────────────────────

@router.get("/metrics")
async def get_admin_metrics(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _admin: dict = Depends(get_admin_user),
):
    total_users = await db["users"].count_documents({})
    total_items = await db["wardrobe_items"].count_documents({})
    total_outfits = await db["outfit_recommendations"].count_documents({})
    total_feedback = await db["feedback_events"].count_documents({})

    return {
        "total_users": total_users,
        "total_items": total_items,
        "total_outfits": total_outfits,
        "total_feedback": total_feedback,
        "server_uptime_seconds": int(time.time() - _START_TIME),
        "ml_pipeline": get_pipeline_status(),
    }


# ── User Management ────────────────────────────────────────────────────────────

@router.get("/users")
async def list_users(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _admin: dict = Depends(get_admin_user),
):
    cursor = db["users"].find({}).sort("created_at", -1)
    users = await cursor.to_list(length=1000)
    result = []
    for u in users:
        user_id = str(u["_id"])
        item_count = await db["wardrobe_items"].count_documents({"user_id": user_id})
        outfit_count = await db["outfit_recommendations"].count_documents({"user_id": user_id})
        result.append({
            "id": user_id,
            "name": u.get("name"),
            "email": u.get("email"),
            "is_admin": u.get("is_admin", False),
            "oauth_provider": u.get("oauth_provider"),
            "created_at": u.get("created_at"),
            "item_count": item_count,
            "outfit_count": outfit_count,
        })
    return result


@router.get("/users/{user_id}")
async def get_user_detail(
    user_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    _admin: dict = Depends(get_admin_user),
):
    try:
        user = await db["users"].find_one({"_id": ObjectId(user_id)})
    except Exception:
        user = None
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    item_count = await db["wardrobe_items"].count_documents({"user_id": user_id})
    outfit_count = await db["outfit_recommendations"].count_documents({"user_id": user_id})
    profile = await db["user_profiles"].find_one({"user_id": user_id})

    return {
        "id": user_id,
        "name": user.get("name"),
        "email": user.get("email"),
        "is_admin": user.get("is_admin", False),
        "created_at": user.get("created_at"),
        "item_count": item_count,
        "outfit_count": outfit_count,
        "profile": {
            "style_text": profile.get("style_text") if profile else None,
            "preferred_styles": profile.get("preferred_styles") if profile else [],
        } if profile else None,
    }


class PatchUserRequest(BaseModel):
    is_admin: Optional[bool] = None
    name: Optional[str] = None


@router.patch("/users/{user_id}")
async def patch_user(
    user_id: str,
    req: PatchUserRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin: dict = Depends(get_admin_user),
):
    # Prevent admin from removing their own admin status
    if user_id == admin["id"] and req.is_admin is False:
        raise HTTPException(status_code=400, detail="Cannot remove your own admin privileges")

    update: Dict[str, Any] = {}
    if req.is_admin is not None:
        update["is_admin"] = req.is_admin
    if req.name is not None:
        update["name"] = req.name

    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")

    try:
        await db["users"].update_one({"_id": ObjectId(user_id)}, {"$set": update})
    except Exception:
        raise HTTPException(status_code=404, detail="User not found")

    return {"id": user_id, **update}


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    admin: dict = Depends(get_admin_user),
):
    if user_id == admin["id"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    # Cascade delete
    await db["feedback_events"].delete_many({"user_id": user_id})
    await db["outfit_recommendations"].delete_many({"user_id": user_id})
    await db["wardrobe_items"].delete_many({"user_id": user_id})
    await db["user_profiles"].delete_many({"user_id": user_id})
    try:
        await db["users"].delete_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="User not found")


# ── ML Operations ──────────────────────────────────────────────────────────────

@router.post("/ml/reload")
async def reload_ml_model(_admin: dict = Depends(get_admin_user)):
    """Hot-swap the CLIP model in memory without restarting the server."""
    status_info = reload_model()
    return {"status": "Model reloaded", "pipeline": status_info}


@router.get("/ml/status")
async def get_ml_status(_admin: dict = Depends(get_admin_user)):
    return get_pipeline_status()
