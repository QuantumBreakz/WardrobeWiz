"""
Frontend adapter routes – mounted under /api.
All routes are async and use MongoDB Motor via get_db dependency.
"""
import json
import logging
import os
import time
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

from bson import ObjectId
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.services import wardrobe_service
from app.services.embedding_service import get_image_embedding
from app.services.faiss_service import add_embedding, remove_embedding
from app.services.image_service import classify_category_from_image, process_upload
from app.services.outfit_service import generate_guided_outfit, get_outfit_history
from app.services.feedback_service import store_feedback

router = APIRouter()

# ── Constants ─────────────────────────────────────────────────────────────────
STATIC_BASE = "http://localhost:8000"

CATEGORY_MAP = {
    "tops": "Tops",
    "bottoms": "Bottoms",
    "dresses": "Dresses",
    "jackets": "Outerwear",
    "shoes": "Footwear",
    "accessories": "Accessories",
}

TYPE_MAP = {
    "t-shirts": "T-Shirt",
    "shirts": "Shirt",
    "blouses": "Shirt",
    "sweaters": "Sweater",
    "jeans": "Jeans",
    "trousers": "Pants",
    "shorts": "Shorts",
    "skirts": "Pants",
    "leggings": "Pants",
    "dresses": "Dress",
    "jumpsuits": "Dress",
    "jackets": "Jacket",
    "coats": "Coat",
    "blazers": "Jacket",
    "sneakers": "Sneakers",
    "boots": "Boots",
    "heels": "Shoes",
    "sandals": "Shoes",
    "shoes": "Shoes",
    "bags": "Bag",
    "hats": "Hat",
    "jewellery": "Jewelry",
}

ROLE_TO_POSITION = {
    "top": "top",
    "bottom": "bottom",
    "outer": "outerwear",
    "shoes": "footwear",
    "accessory": "accessory",
    "dress": "top",
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def _image_url(path: Optional[str]) -> Optional[str]:
    if not path:
        return None
    return f"{STATIC_BASE}/static/uploads/{os.path.basename(path)}"


def _thumbnail_url(path: Optional[str]) -> Optional[str]:
    if not path:
        return None
    return f"{STATIC_BASE}/static/thumbnails/{os.path.basename(path)}"


def _item_to_frontend(item: Dict) -> Dict[str, Any]:
    colors = item.get("dominant_colors", [])
    season_tags = item.get("season_tags", [])
    pattern_tags = item.get("pattern_tags", [])
    occasion_tags = item.get("occasion_tags", [])
    tags = list({*pattern_tags, *occasion_tags})

    season_raw = season_tags[0].capitalize() if season_tags else "All-Season"
    season_map = {"Summer": "Summer", "Winter": "Winter", "Spring": "Spring", "Autumn": "Fall", "Fall": "Fall"}
    season = season_map.get(season_raw, "All-Season")

    created = item.get("created_at", 0)
    updated = item.get("updated_at", created)

    return {
        "id": item.get("id", ""),
        "userId": item.get("user_id", ""),
        "imageUrl": _image_url(item.get("image_path")),
        "thumbnailUrl": _thumbnail_url(item.get("thumbnail_path")),
        "name": (item.get("subcategory") or item.get("category") or "Item").replace("-", " ").title(),
        "category": CATEGORY_MAP.get(item.get("category") or "", "Other"),
        "type": TYPE_MAP.get(item.get("subcategory") or "", "Other"),
        "color": colors[0] if colors else "#808080",
        "season": season,
        "notes": item.get("notes") or "",
        "wearCount": 0,
        "tags": tags,
        "createdAt": str(created),
        "updatedAt": str(updated),
    }


def _build_outfit_frontend(outfit_id: str, user_id: str, items_array: List[Dict], explanation: str, occasion: Optional[str], mood: Optional[str], created_at: float) -> Dict[str, Any]:
    pieces = []
    for entry in items_array:
        pieces.append({
            "id": entry.get("wardrobe_item_id", ""),
            "wardrobeItemId": entry.get("wardrobe_item_id", ""),
            "imageUrl": _image_url(entry.get("image_path")),
            "name": (entry.get("subcategory") or entry.get("category") or "Item").replace("-", " ").title(),
            "category": CATEGORY_MAP.get(entry.get("category") or "", "Other"),
            "position": ROLE_TO_POSITION.get(entry.get("role") or "", "accessory"),
        })
    return {
        "id": outfit_id,
        "userId": user_id,
        "pieces": pieces,
        "explanation": explanation or "",
        "context": {"occasion": occasion, "mood": mood},
        "createdAt": str(created_at),
        "isFavorite": False,
        "feedback": None,
        "savedAt": str(created_at),
        "tags": [],
    }


async def _process_file_bytes(file_bytes: bytes, filename: str, notes: str, db: AsyncIOMotorDatabase, user_id: str) -> Dict[str, Any]:
    logger.info("Starting upload processing for %s (%d bytes)", filename, len(file_bytes))
    try:
        result = process_upload(
            file_bytes=file_bytes,
            filename=filename,
            upload_dir=settings.upload_dir,
            thumbnail_dir=settings.thumbnail_dir,
        )
    except ValueError as e:
        logger.warning("process_upload rejected %s: %s", filename, e)
        raise HTTPException(status_code=422, detail=str(e))

    item = await wardrobe_service.create_wardrobe_item(
        db=db,
        user_id=user_id,
        image_path=result["image_path"],
        thumbnail_path=result["thumbnail_path"],
        category=result["category"],
        subcategory=result["subcategory"],
        dominant_colors=result["dominant_colors"],
    )

    embedding = get_image_embedding(result["image_path"])
    if embedding:
        # Use the MongoDB string id as identifier; FAISS uses an integer key so we hash
        faiss_key = abs(hash(item["id"])) % (2**31)
        added = add_embedding(settings.faiss_dir, user_id, faiss_key, embedding)
        if added:
            await wardrobe_service.update_item(db, item["id"], {"embedding_id": str(faiss_key)})
            item["embedding_id"] = str(faiss_key)

    if notes:
        await wardrobe_service.update_item(db, item["id"], {"notes": notes})
        item["notes"] = notes

    return _item_to_frontend(item)


# ── Wardrobe routes ────────────────────────────────────────────────────────────

@router.get("/wardrobe/stats")
async def get_wardrobe_stats(db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    items = await wardrobe_service.get_user_items(db, current_user["id"], limit=1000)
    by_category: Dict[str, int] = {}
    by_season: Dict[str, int] = {}
    for item in items:
        cat = CATEGORY_MAP.get(item.get("category") or "", "Other")
        by_category[cat] = by_category.get(cat, 0) + 1
        for s in item.get("season_tags", []):
            by_season[s] = by_season.get(s, 0) + 1

    return {
        "totalItems": len(items),
        "itemsByCategory": by_category,
        "itemsBySeason": by_season,
        "mostWorn": [],
        "leastWorn": [],
        "rewearRate": 0,
    }


@router.get("/wardrobe")
async def list_wardrobe(
    category: Optional[str] = None,
    season: Optional[str] = None,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    items = await wardrobe_service.get_user_items(db, current_user["id"], limit=500)
    result = [_item_to_frontend(i) for i in items]

    if category and category != "All":
        result = [i for i in result if i["category"] == category]
    if season and season != "All":
        result = [i for i in result if i["season"] == season]

    return result


@router.post("/wardrobe/upload")
async def upload_wardrobe_item_api(
    file: UploadFile = File(...),
    notes: str = Form(default=""),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    file_bytes = await file.read()
    filename = file.filename or "upload.jpg"
    logger.info("Single upload request received for %s (%d bytes)", filename, len(file_bytes))
    return await _process_file_bytes(file_bytes, filename, notes, db, current_user["id"])


@router.post("/wardrobe")
async def create_wardrobe_item_api(payload: Dict[str, Any], db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    item = await wardrobe_service.create_wardrobe_item(
        db=db,
        user_id=current_user["id"],
        image_path="",
        thumbnail_path=None,
        category=None,
        subcategory=None,
        dominant_colors=[payload.get("color", "#808080")],
    )
    if payload.get("notes"):
        await wardrobe_service.update_item(db, item["id"], {"notes": payload["notes"]})
        item["notes"] = payload["notes"]
    return _item_to_frontend(item)


@router.get("/wardrobe/{item_id}")
async def get_wardrobe_item_api(item_id: str, db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    item = await wardrobe_service.get_item(db, item_id)
    if not item or item.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Item not found")
    return _item_to_frontend(item)


@router.patch("/wardrobe/{item_id}")
async def update_wardrobe_item_api(item_id: str, payload: Dict[str, Any], db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    item = await wardrobe_service.get_item(db, item_id)
    if not item or item.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Item not found")

    update = {}
    if payload.get("notes") is not None:
        update["notes"] = payload["notes"]
    if payload.get("season"):
        update["season_tags"] = [payload["season"]]
    if payload.get("tags"):
        update["occasion_tags"] = payload["tags"]

    updated = await wardrobe_service.update_item(db, item_id, update)
    return _item_to_frontend(updated)


@router.delete("/wardrobe/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_wardrobe_item_api(item_id: str, db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    item = await wardrobe_service.get_item(db, item_id)
    if not item or item.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Item not found")
    await wardrobe_service.delete_item(db, item_id)
    faiss_key = int(item.get("embedding_id", 0) or 0)
    if faiss_key:
        remove_embedding(settings.faiss_dir, current_user["id"], faiss_key)


@router.post("/wardrobe/{item_id}/worn")
async def mark_item_worn(item_id: str, db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    item = await wardrobe_service.get_item(db, item_id)
    if not item or item.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Item not found")
    return _item_to_frontend(item)


# ── Outfit routes ──────────────────────────────────────────────────────────────

@router.post("/outfit/generate")
async def generate_outfit_api(payload: Dict[str, Any], db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    context = payload.get("context", {})
    occasion = context.get("occasion")
    mood = context.get("mood")
    query_text = context.get("event") or context.get("dressCode")

    raw = await generate_guided_outfit(
        db=db,
        faiss_dir=settings.faiss_dir,
        user_id=current_user["id"],
        occasion=occasion,
        mood=mood,
        color_preference=None,
        item_id=None,
        query_text=query_text,
        style_vector=None,
    )

    if not raw:
        raise HTTPException(
            status_code=422,
            detail="Not enough wardrobe items to generate an outfit. Upload more items first.",
        )

    def _raw_to_frontend(combo: Dict) -> Dict:
        return _build_outfit_frontend(
            outfit_id=combo["outfit_id"],
            user_id=current_user["id"],
            items_array=[i["item"] for i in combo["items"]],
            explanation=combo["explanation"],
            occasion=combo.get("occasion"),
            mood=combo.get("mood"),
            created_at=time.time(),
        )

    outfits = [_raw_to_frontend(c) for c in raw]
    return {"outfit": outfits[0], "alternatives": outfits[1:]}


@router.get("/outfit/saved")
async def get_saved_outfits(db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    outfits_raw, total = await get_outfit_history(db, current_user["id"], skip=0, limit=50)
    result = []
    for o in outfits_raw:
        result.append(_build_outfit_frontend(
            outfit_id=o["id"],
            user_id=current_user["id"],
            items_array=o.get("items", []),
            explanation=o.get("explanation", ""),
            occasion=o.get("occasion"),
            mood=o.get("mood"),
            created_at=o.get("created_at", 0),
        ))
    return {"outfits": result, "total": total}


@router.get("/outfit/{outfit_id}")
async def get_outfit_api(outfit_id: str, db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    try:
        outfit = await db["outfit_recommendations"].find_one({"_id": ObjectId(outfit_id)})
    except Exception:
        outfit = None
    if not outfit:
        raise HTTPException(status_code=404, detail="Outfit not found")
    return _build_outfit_frontend(
        outfit_id=str(outfit["_id"]),
        user_id=current_user["id"],
        items_array=outfit.get("items", []),
        explanation=outfit.get("explanation", ""),
        occasion=outfit.get("occasion"),
        mood=outfit.get("mood"),
        created_at=outfit.get("created_at", 0),
    )


@router.post("/outfit/{outfit_id}/save")
async def save_outfit_api(outfit_id: str, db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    try:
        await db["outfit_recommendations"].update_one({"_id": ObjectId(outfit_id)}, {"$set": {"is_saved": True}})
    except Exception:
        pass
    return {"id": outfit_id, "isFavorite": True}


@router.delete("/outfit/{outfit_id}/save", status_code=status.HTTP_204_NO_CONTENT)
async def unsave_outfit_api(outfit_id: str, db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    try:
        await db["outfit_recommendations"].update_one({"_id": ObjectId(outfit_id)}, {"$set": {"is_saved": False}})
    except Exception:
        pass


# ── Feedback routes ────────────────────────────────────────────────────────────

@router.post("/feedback", status_code=status.HTTP_204_NO_CONTENT)
async def submit_feedback_api(payload: Dict[str, Any], db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    outfit_id = payload.get("outfitId")
    feedback_type = payload.get("feedbackType", "like")
    action_map = {"like": "like", "dislike": "dislike", "swap": "skip"}
    action = action_map.get(feedback_type, "like")
    await store_feedback(db, current_user["id"], outfit_id, action)


@router.get("/feedback/history")
async def get_feedback_history(limit: int = 50, db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    from app.services.feedback_service import get_user_feedback
    events = await get_user_feedback(db, current_user["id"], skip=0, limit=limit)
    return [{"outfitId": e.get("outfit_id"), "feedbackType": e.get("action")} for e in events]


@router.patch("/feedback/{outfit_id}", status_code=status.HTTP_204_NO_CONTENT)
async def update_feedback_api(outfit_id: str, payload: Dict[str, Any], db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    feedback_type = payload.get("feedbackType", "like")
    action_map = {"like": "like", "dislike": "dislike", "swap": "skip"}
    await store_feedback(db, current_user["id"], outfit_id, action_map.get(feedback_type, "like"))


@router.post("/outfit/feedback", status_code=status.HTTP_204_NO_CONTENT)
async def outfit_feedback_api(payload: Dict[str, Any], db: AsyncIOMotorDatabase = Depends(get_db), current_user: dict = Depends(get_current_user)):
    outfit_id = payload.get("outfitId")
    feedback_type = payload.get("feedbackType", "like")
    action_map = {"like": "like", "dislike": "dislike", "swap": "skip"}
    await store_feedback(db, current_user["id"], outfit_id, action_map.get(feedback_type, "like"))


# ── Upload routes ──────────────────────────────────────────────────────────────

@router.post("/upload/image")
async def upload_image_api(
    file: UploadFile = File(...),
    metadata: str = Form(default="{}"),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    meta = json.loads(metadata)
    file_bytes = await file.read()
    return await _process_file_bytes(file_bytes, file.filename or "upload.jpg", meta.get("notes", ""), db, current_user["id"])


@router.post("/upload/batch")
async def upload_batch_api(
    files: List[UploadFile] = File(...),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    items = []
    errors = []
    for f in files:
        filename = f.filename or "upload.jpg"
        try:
            file_bytes = await f.read()
            item = await _process_file_bytes(file_bytes, filename, "", db, current_user["id"])
            items.append(item)
        except HTTPException as e:
            errors.append(f"{filename}: {e.detail}")
        except Exception as e:
            logger.exception("Unexpected error uploading %s", filename)
            errors.append(f"{filename}: {e}")
    return {"items": items, "errors": errors}
