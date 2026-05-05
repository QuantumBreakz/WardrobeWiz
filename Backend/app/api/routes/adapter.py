"""
Frontend adapter routes – mounted under /api.

Bridges the frontend's expected API shape to the existing backend services.
All routes default to user_id=1 (single-user demo; auth is client-side only).
"""
import json
import logging
import os
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.outfit import OutfitItem, OutfitRecommendation
from app.models.wardrobe_item import WardrobeItem
from app.services import wardrobe_service
from app.services.embedding_service import get_image_embedding
from app.services.faiss_service import add_embedding, remove_embedding
from app.services.image_service import classify_category_from_image, process_upload
from app.services.outfit_service import generate_guided_outfit, get_outfit_history
from app.services.feedback_service import store_feedback
from app.schemas.feedback import FeedbackCreate

router = APIRouter()

# ── Constants ─────────────────────────────────────────────────────────────────

DEFAULT_USER_ID = 1
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


def _item_to_frontend(item: WardrobeItem) -> Dict[str, Any]:
    colors = json.loads(item.dominant_colors_json or "[]")
    season_tags = json.loads(item.season_tags_json or "[]")
    pattern_tags = json.loads(item.pattern_tags_json or "[]")
    occasion_tags = json.loads(item.occasion_tags_json or "[]")
    tags = list({*pattern_tags, *occasion_tags})

    season_raw = season_tags[0].capitalize() if season_tags else "All-Season"
    season_map = {"Summer": "Summer", "Winter": "Winter", "Spring": "Spring", "Autumn": "Fall", "Fall": "Fall"}
    season = season_map.get(season_raw, "All-Season")

    return {
        "id": str(item.id),
        "userId": str(item.user_id),
        "imageUrl": _image_url(item.image_path),
        "thumbnailUrl": _thumbnail_url(item.thumbnail_path),
        "name": (item.subcategory or item.category or "Item").replace("-", " ").title(),
        "category": CATEGORY_MAP.get(item.category or "", "Other"),
        "type": TYPE_MAP.get(item.subcategory or "", "Other"),
        "color": colors[0] if colors else "#808080",
        "season": season,
        "notes": item.notes or "",
        "wearCount": 0,
        "tags": tags,
        "createdAt": item.created_at.isoformat(),
        "updatedAt": item.updated_at.isoformat(),
    }


def _build_outfit_frontend(
    outfit: OutfitRecommendation,
    outfit_items: List[OutfitItem],
    db: Session,
) -> Dict[str, Any]:
    pieces = []
    for oi in outfit_items:
        wi = db.query(WardrobeItem).filter(WardrobeItem.id == oi.wardrobe_item_id).first()
        if not wi:
            continue
        colors = json.loads(wi.dominant_colors_json or "[]")
        pieces.append({
            "id": str(oi.id),
            "wardrobeItemId": str(wi.id),
            "imageUrl": _image_url(wi.image_path),
            "name": (wi.subcategory or wi.category or "Item").replace("-", " ").title(),
            "category": CATEGORY_MAP.get(wi.category or "", "Other"),
            "position": ROLE_TO_POSITION.get(oi.role or "", "accessory"),
        })

    return {
        "id": str(outfit.id),
        "userId": str(outfit.user_id),
        "pieces": pieces,
        "explanation": outfit.explanation or "",
        "context": {"occasion": outfit.occasion, "mood": outfit.mood},
        "createdAt": outfit.created_at.isoformat(),
        "isFavorite": False,
        "feedback": None,
        "savedAt": outfit.created_at.isoformat(),
        "tags": [],
    }


def _get_outfit_with_items(outfit_id: int, db: Session) -> Optional[Dict]:
    outfit = db.query(OutfitRecommendation).filter(OutfitRecommendation.id == outfit_id).first()
    if not outfit:
        return None
    items = db.query(OutfitItem).filter(OutfitItem.outfit_id == outfit_id).all()
    return _build_outfit_frontend(outfit, items, db)


def _process_file_bytes(file_bytes: bytes, filename: str, notes: str, db: Session) -> Dict[str, Any]:
    """Process already-read file bytes into a wardrobe item."""
    logger.info("Starting upload processing for %s (%d bytes)", filename, len(file_bytes))
    try:
        result = process_upload(
            file_bytes=file_bytes,
            filename=filename,
            upload_dir=settings.upload_dir,
            thumbnail_dir=settings.thumbnail_dir,
        )
        logger.info(
            "process_upload succeeded for %s image=%s thumbnail=%s category=%s subcategory=%s",
            filename,
            result["image_path"],
            result["thumbnail_path"],
            result["category"],
            result["subcategory"],
        )
    except ValueError as e:
        logger.warning("process_upload rejected %s: %s", filename, e)
        raise HTTPException(status_code=422, detail=str(e))

    try:
        item = wardrobe_service.create_wardrobe_item(
            db=db,
            user_id=DEFAULT_USER_ID,
            image_path=result["image_path"],
            thumbnail_path=result["thumbnail_path"],
            category=result["category"],
            subcategory=result["subcategory"],
            dominant_colors=result["dominant_colors"],
        )
        logger.info("DB insert succeeded for %s with item_id=%s", filename, item.id)
    except Exception:
        logger.exception("DB insert failed for %s", filename)
        raise

    embedding = get_image_embedding(result["image_path"])
    if embedding:
        added = add_embedding(settings.faiss_dir, DEFAULT_USER_ID, item.id, embedding)
        if added:
            item.embedding_id = str(item.id)
            db.commit()
            db.refresh(item)

    if notes:
        item.notes = notes
        db.commit()
        db.refresh(item)

    frontend_item = _item_to_frontend(item)
    logger.info("Prepared frontend item for %s with item_id=%s", filename, item.id)
    return frontend_item


# ── Wardrobe routes ────────────────────────────────────────────────────────────

@router.get("/wardrobe/stats")
def get_wardrobe_stats(db: Session = Depends(get_db)):
    items = wardrobe_service.get_user_items(db, DEFAULT_USER_ID, limit=1000)
    by_category: Dict[str, int] = {}
    by_season: Dict[str, int] = {}
    for item in items:
        cat = CATEGORY_MAP.get(item.category or "", "Other")
        by_category[cat] = by_category.get(cat, 0) + 1
        for s in json.loads(item.season_tags_json or "[]"):
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
def list_wardrobe(
    category: Optional[str] = None,
    season: Optional[str] = None,
    db: Session = Depends(get_db),
):
    items = wardrobe_service.get_user_items(db, DEFAULT_USER_ID, limit=500)
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
    db: Session = Depends(get_db),
):
    file_bytes = await file.read()
    filename = file.filename or "upload.jpg"
    logger.info("Single upload request received for %s (%d bytes)", filename, len(file_bytes))
    return _process_file_bytes(file_bytes, filename, notes, db)


@router.post("/wardrobe")
def create_wardrobe_item_api(payload: Dict[str, Any], db: Session = Depends(get_db)):
    # Metadata-only creation (no image)
    item = wardrobe_service.create_wardrobe_item(
        db=db,
        user_id=DEFAULT_USER_ID,
        image_path="",
        thumbnail_path=None,
        category=None,
        subcategory=None,
        dominant_colors=[payload.get("color", "#808080")],
    )
    if payload.get("notes"):
        item.notes = payload["notes"]
        db.commit()
        db.refresh(item)
    return _item_to_frontend(item)


@router.get("/wardrobe/{item_id}")
def get_wardrobe_item_api(item_id: int, db: Session = Depends(get_db)):
    item = wardrobe_service.get_item(db, item_id)
    if not item or item.user_id != DEFAULT_USER_ID:
        raise HTTPException(status_code=404, detail="Item not found")
    return _item_to_frontend(item)


@router.patch("/wardrobe/{item_id}")
def update_wardrobe_item_api(item_id: int, payload: Dict[str, Any], db: Session = Depends(get_db)):
    from app.schemas.wardrobe import WardrobeItemUpdate

    item = wardrobe_service.get_item(db, item_id)
    if not item or item.user_id != DEFAULT_USER_ID:
        raise HTTPException(status_code=404, detail="Item not found")

    # Map frontend field names to backend schema
    update = WardrobeItemUpdate(
        notes=payload.get("notes"),
        season_tags=[payload["season"]] if payload.get("season") else None,
        occasion_tags=payload.get("tags"),
    )
    updated = wardrobe_service.update_item(db, item_id, update)
    return _item_to_frontend(updated)


@router.delete("/wardrobe/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_wardrobe_item_api(item_id: int, db: Session = Depends(get_db)):
    item = wardrobe_service.get_item(db, item_id)
    if not item or item.user_id != DEFAULT_USER_ID:
        raise HTTPException(status_code=404, detail="Item not found")
    wardrobe_service.delete_item(db, item_id)
    remove_embedding(settings.faiss_dir, DEFAULT_USER_ID, item_id)


@router.post("/wardrobe/{item_id}/worn")
def mark_item_worn(item_id: int, db: Session = Depends(get_db)):
    item = wardrobe_service.get_item(db, item_id)
    if not item or item.user_id != DEFAULT_USER_ID:
        raise HTTPException(status_code=404, detail="Item not found")
    return _item_to_frontend(item)


# ── Outfit routes ──────────────────────────────────────────────────────────────

@router.post("/outfit/generate")
def generate_outfit_api(payload: Dict[str, Any], db: Session = Depends(get_db)):
    context = payload.get("context", {})
    occasion = context.get("occasion")
    mood = context.get("mood")
    query_text = context.get("event") or context.get("dressCode")

    raw = generate_guided_outfit(
        db=db,
        faiss_dir=settings.faiss_dir,
        user_id=DEFAULT_USER_ID,
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
        outfit = db.query(OutfitRecommendation).filter(
            OutfitRecommendation.id == combo["outfit_id"]
        ).first()
        items = db.query(OutfitItem).filter(
            OutfitItem.outfit_id == combo["outfit_id"]
        ).all()
        return _build_outfit_frontend(outfit, items, db)

    outfits = [_raw_to_frontend(c) for c in raw]
    return {"outfit": outfits[0], "alternatives": outfits[1:]}


@router.get("/outfit/saved")
def get_saved_outfits(db: Session = Depends(get_db)):
    outfits_raw, total = get_outfit_history(db, DEFAULT_USER_ID, skip=0, limit=50)
    result = []
    for o in outfits_raw:
        outfit_id = o["id"]
        frontend_outfit = _get_outfit_with_items(outfit_id, db)
        if frontend_outfit:
            result.append(frontend_outfit)
    return {"outfits": result, "total": total}


@router.get("/outfit/{outfit_id}")
def get_outfit_api(outfit_id: int, db: Session = Depends(get_db)):
    frontend_outfit = _get_outfit_with_items(outfit_id, db)
    if not frontend_outfit:
        raise HTTPException(status_code=404, detail="Outfit not found")
    return frontend_outfit


@router.get("/outfit/{outfit_id}/alternatives")
def get_outfit_alternatives_api(outfit_id: int, db: Session = Depends(get_db)):
    outfit = db.query(OutfitRecommendation).filter(OutfitRecommendation.id == outfit_id).first()
    if not outfit:
        raise HTTPException(status_code=404, detail="Outfit not found")
        
    raw = generate_guided_outfit(
        db=db,
        faiss_dir=settings.faiss_dir,
        user_id=DEFAULT_USER_ID,
        occasion=outfit.occasion,
        mood=outfit.mood,
        color_preference=None,
        item_id=None,
        query_text=None,
        style_vector=None,
    )
    
    if not raw:
        return []
        
    def _raw_to_frontend(combo: Dict) -> Dict:
        out = db.query(OutfitRecommendation).filter(
            OutfitRecommendation.id == combo["outfit_id"]
        ).first()
        items = db.query(OutfitItem).filter(
            OutfitItem.outfit_id == combo["outfit_id"]
        ).all()
        return _build_outfit_frontend(out, items, db)

    outfits = [_raw_to_frontend(c) for c in raw if c["outfit_id"] != outfit_id]
    return outfits


@router.post("/outfit/{outfit_id}/save")
def save_outfit_api(outfit_id: int, db: Session = Depends(get_db)):
    frontend_outfit = _get_outfit_with_items(outfit_id, db)
    if not frontend_outfit:
        raise HTTPException(status_code=404, detail="Outfit not found")
    return {**frontend_outfit, "isFavorite": True}


@router.delete("/outfit/{outfit_id}/save", status_code=status.HTTP_204_NO_CONTENT)
def unsave_outfit_api(outfit_id: int, db: Session = Depends(get_db)):
    pass


# ── Feedback routes ────────────────────────────────────────────────────────────

def _store_outfit_feedback(payload: Dict[str, Any], db: Session):
    outfit_id = payload.get("outfitId")
    feedback_type = payload.get("feedbackType", "like")
    action_map = {"like": "like", "dislike": "dislike", "swap": "skip"}
    action = action_map.get(feedback_type, "like")
    if outfit_id:
        fb = FeedbackCreate(
            user_id=DEFAULT_USER_ID,
            outfit_id=int(outfit_id),
            action=action,
        )
        store_feedback(db, fb)


@router.post("/feedback", status_code=status.HTTP_204_NO_CONTENT)
def submit_feedback_api(payload: Dict[str, Any], db: Session = Depends(get_db)):
    _store_outfit_feedback(payload, db)


@router.get("/feedback/history")
def get_feedback_history(limit: int = 50, db: Session = Depends(get_db)):
    from app.services.feedback_service import get_user_feedback
    events, _total, _stats = get_user_feedback(db, DEFAULT_USER_ID, skip=0, limit=limit)
    return [
        {"outfitId": str(e.outfit_id) if e.outfit_id else None, "feedbackType": e.action}
        for e in events
    ]


@router.patch("/feedback/{outfit_id}", status_code=status.HTTP_204_NO_CONTENT)
def update_feedback_api(outfit_id: int, payload: Dict[str, Any], db: Session = Depends(get_db)):
    _store_outfit_feedback({**payload, "outfitId": outfit_id}, db)


@router.post("/outfit/feedback", status_code=status.HTTP_204_NO_CONTENT)
def outfit_feedback_api(payload: Dict[str, Any], db: Session = Depends(get_db)):
    _store_outfit_feedback(payload, db)


# ── Upload routes ──────────────────────────────────────────────────────────────

@router.post("/upload/image")
async def upload_image_api(
    file: UploadFile = File(...),
    metadata: str = Form(default="{}"),
    db: Session = Depends(get_db),
):
    meta = json.loads(metadata)
    file_bytes = await file.read()
    return _process_file_bytes(file_bytes, file.filename or "upload.jpg", meta.get("notes", ""), db)


@router.post("/upload/batch")
async def upload_batch_api(
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    items = []
    errors = []
    for f in files:
        filename = f.filename or "upload.jpg"
        try:
            file_bytes = await f.read()
            logger.info("Batch uploading file: %s (%d bytes)", filename, len(file_bytes))
            item = _process_file_bytes(file_bytes, filename, "", db)
            items.append(item)
            logger.info("Appended uploaded item for %s to batch response", filename)
        except HTTPException as e:
            logger.warning("Upload skipped %s: %s", filename, e.detail)
            errors.append(f"{filename}: {e.detail}")
        except Exception as e:
            logger.exception("Unexpected error uploading %s", filename)
            errors.append(f"{filename}: {e}")
    logger.info("Batch upload completed with %d items and %d errors", len(items), len(errors))
    return {"items": items, "errors": errors}
