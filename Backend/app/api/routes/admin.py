"""
Admin-only routes — mounted under /api/admin.
All routes require is_admin=True via the get_admin_user dependency.
"""
import asyncio
import os
import time
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_admin_user
from app.services.embedding_service import get_pipeline_status, reload_model
from app.services.faiss_service import rebuild_index

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


# ── Catalogue Management ───────────────────────────────────────────────────────

# English folder name → English category/subcategory (mirrors seed_catalogue.py)
_FOLDER_TO_CATEGORY = {
    "blazers": "jackets",
    "trousers": "bottoms",
    "shorts": "bottoms",
    "dresses": "dresses",
    "hoodies": "tops",
    "jackets": "jackets",
    "denim_jackets": "jackets",
    "sports_jackets": "jackets",
    "jeans": "bottoms",
    "t_shirts": "tops",
    "shirts": "tops",
    "coats": "jackets",
    "polo_shirts": "tops",
    "skirts": "bottoms",
    "sweaters": "tops",
    "formal_pants": "bottoms",
    "formal_shirts": "tops",
    "suits": "jackets",
}
_FOLDER_TO_SUBCATEGORY = {
    "blazers": "blazers",
    "trousers": "trousers",
    "shorts": "shorts",
    "dresses": "dresses",
    "hoodies": "sweaters",
    "jackets": "jackets",
    "denim_jackets": "jackets",
    "sports_jackets": "jackets",
    "jeans": "jeans",
    "t_shirts": "t-shirts",
    "shirts": "shirts",
    "coats": "coats",
    "polo_shirts": "shirts",
    "skirts": "skirts",
    "sweaters": "sweaters",
    "formal_pants": "trousers",
    "formal_shirts": "shirts",
    "suits": "suits",
}
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
CATALOGUE_USER_ID = "catalogue"
CATALOGUE_LIMIT = 15


async def _run_catalogue_seed(db: AsyncIOMotorDatabase) -> Dict[str, Any]:
    """Core seeding logic shared by the script and this endpoint."""
    import time as _time
    from app.services.embedding_service import get_image_embedding
    from app.utils.color_utils import extract_dominant_colors
    from app.utils.image_utils import create_thumbnail, open_image

    upload_dir   = Path(settings.upload_dir)
    thumbnail_dir = settings.thumbnail_dir
    faiss_dir    = settings.faiss_dir

    # Clear existing catalogue items
    deleted = await db["wardrobe_items"].delete_many({"user_id": CATALOGUE_USER_ID})
    logger.info("Catalogue reseed: cleared %d existing items", deleted.deleted_count)

    faiss_items: List[Tuple[int, List[float]]] = []
    summary: Dict[str, int] = {}
    errors = 0

    for folder in sorted(upload_dir.iterdir()):
        if not folder.is_dir() or folder.name.startswith("."):
            continue
        if folder.name not in _FOLDER_TO_CATEGORY:
            continue

        images = sorted(
            p for p in folder.iterdir()
            if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS
        )[:CATALOGUE_LIMIT]

        count = 0
        for img_path in images:
            img_path_str = str(img_path)

            thumb = create_thumbnail(img_path_str, thumbnail_dir)
            img_pil = open_image(img_path_str)
            colors = extract_dominant_colors(img_pil, n_colors=3) if img_pil else []

            embedding = get_image_embedding(img_path_str)
            if embedding is None:
                errors += 1
                continue

            faiss_key = abs(hash(img_path_str)) % (2 ** 31)

            doc = {
                "user_id": CATALOGUE_USER_ID,
                "catalogue_item": True,
                "folder_name": folder.name,
                "image_path": img_path_str,
                "thumbnail_path": thumb,
                "category": _FOLDER_TO_CATEGORY[folder.name],
                "subcategory": _FOLDER_TO_SUBCATEGORY[folder.name],
                "dominant_colors": colors,
                "pattern_tags": [],
                "occasion_tags": [],
                "season_tags": [],
                "embedding_id": str(faiss_key),
                "notes": None,
                "created_at": _time.time(),
                "updated_at": _time.time(),
            }
            await db["wardrobe_items"].update_one(
                {"user_id": CATALOGUE_USER_ID, "image_path": img_path_str},
                {"$set": doc},
                upsert=True,
            )
            faiss_items.append((faiss_key, embedding))
            count += 1

        summary[folder.name] = count

    ok = rebuild_index(faiss_dir, CATALOGUE_USER_ID, faiss_items)
    return {
        "seeded": len(faiss_items),
        "errors": errors,
        "faiss_ok": ok,
        "categories": summary,
    }


@router.post("/catalogue/reseed")
async def reseed_catalogue(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _admin: dict = Depends(get_admin_user),
):
    """
    Re-seed the WardrobeWiz catalogue from the uploads directory.
    Takes the first 15 images per category folder, embeds them via CLIP,
    upserts wardrobe_items (user_id='catalogue'), and rebuilds the FAISS index.
    """
    logger.info("Admin triggered catalogue reseed")
    result = await _run_catalogue_seed(db)
    logger.info("Catalogue reseed complete: %s", result)
    return result


@router.get("/catalogue/status")
async def catalogue_status(
    db: AsyncIOMotorDatabase = Depends(get_db),
    _admin: dict = Depends(get_admin_user),
):
    """Return current catalogue size (items + FAISS vector count)."""
    import faiss as _faiss
    import json

    item_count = await db["wardrobe_items"].count_documents({"user_id": CATALOGUE_USER_ID})
    faiss_path = os.path.join(settings.faiss_dir, "catalogue.index")
    faiss_vectors = 0
    if os.path.exists(faiss_path):
        try:
            idx = _faiss.read_index(faiss_path)
            faiss_vectors = idx.ntotal
        except Exception:
            pass

    return {
        "catalogue_items_in_db": item_count,
        "faiss_vectors": faiss_vectors,
        "faiss_index_exists": os.path.exists(faiss_path),
    }
