"""
MongoDB-based retrieval service — replaces SQLAlchemy retrieval_service.py.
Retrieves candidate wardrobe item dicts from MongoDB, optionally using FAISS.
Falls back to the shared catalogue index when the user's personal wardrobe
is empty or has too few items.
"""
import logging
from typing import Dict, List, Optional

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.services.embedding_service import get_text_embedding
from app.services.faiss_service import search

logger = logging.getLogger(__name__)

# Virtual user_id used for all catalogue (seeded dataset) items
CATALOGUE_USER_ID = "catalogue"


async def retrieve_candidates(
    db: AsyncIOMotorDatabase,
    faiss_dir: str,
    user_id: str,
    occasion: Optional[str] = None,
    mood: Optional[str] = None,
    color_preference: Optional[str] = None,
    query_text: Optional[str] = None,
    anchor_item_id: Optional[str] = None,
    top_k: int = 20,
    style_vector: Optional[List[float]] = None,
    preference_scores: Optional[Dict[str, float]] = None,
) -> List[Dict]:
    """Return up to top_k wardrobe item dicts most relevant to the query."""
    parts = []
    if query_text:
        parts.append(query_text)
    if occasion:
        parts.append(f"{occasion} outfit")
    if mood:
        parts.append(f"{mood} style")
    if color_preference:
        parts.append(f"{color_preference} colors")

    composite_text = " ".join(parts) if parts else "stylish outfit"

    query_emb = get_text_embedding(composite_text)
    
    # 1. Get FAISS candidates
    faiss_k = min(top_k * 4, 100)
    candidate_ids = search(faiss_dir, user_id, query_emb, top_k=faiss_k) if query_emb is not None else []
    
    # 2. Fetch specific items from DB
    items_from_db = []
    if candidate_ids:
        # Convert FAISS int IDs back to string keys (embedding_id)
        str_ids = [str(cid) for cid in candidate_ids]
        cursor = db["wardrobe_items"].find({
            "user_id": user_id,
            "embedding_id": {"$in": str_ids}
        })
        from app.services.wardrobe_service import _doc_to_dict
        items_from_db = [_doc_to_dict(doc) for doc in await cursor.to_list(length=faiss_k)]
        
    # 3. Fallback: if FAISS failed or returned too few, get recent user items
    if len(items_from_db) < top_k:
        from app.services.wardrobe_service import get_user_items
        recent = await get_user_items(db, user_id, limit=top_k * 2)
        existing_ids = {str(i["_id"]) for i in items_from_db}
        for r in recent:
            if str(r["_id"]) not in existing_ids:
                items_from_db.append(r)

    # 4. Catalogue fallback: if user has no items at all, use the seeded catalogue
    if not items_from_db:
        logger.info(
            "User %s has no wardrobe items — falling back to catalogue index", user_id
        )
        from app.services.wardrobe_service import _doc_to_dict
        catalogue_ids = search(faiss_dir, CATALOGUE_USER_ID, query_emb, top_k=faiss_k) if query_emb else []
        if catalogue_ids:
            str_cat_ids = [str(cid) for cid in catalogue_ids]
            cursor = db["wardrobe_items"].find({
                "user_id": CATALOGUE_USER_ID,
                "embedding_id": {"$in": str_cat_ids},
            })
            items_from_db = [_doc_to_dict(doc) for doc in await cursor.to_list(length=faiss_k)]

        # Final fallback: any catalogue items
        if not items_from_db:
            cursor = db["wardrobe_items"].find({"user_id": CATALOGUE_USER_ID}).limit(top_k)
            items_from_db = [_doc_to_dict(doc) for doc in await cursor.to_list(length=top_k)]

    ordered = items_from_db

    if preference_scores and ordered:
        faiss_rank = {item["id"]: rank for rank, item in enumerate(ordered)}
        ordered = sorted(
            ordered,
            key=lambda item: _preference_score_for_item(item, preference_scores) - faiss_rank.get(item["id"], 0) * 0.1,
            reverse=True,
        )

    if anchor_item_id:
        ordered = sorted(ordered, key=lambda x: 0 if x["id"] == anchor_item_id else 1)

    return ordered[:top_k]


def _preference_score_for_item(item: Dict, preference_scores: Dict[str, float]) -> float:
    score = 0.0
    if item.get("category"):
        score += preference_scores.get(item["category"], 0.0)
    for color in item.get("dominant_colors", []):
        score += preference_scores.get(color, 0.0) * 0.5
    for occ in item.get("occasion_tags", []):
        score += preference_scores.get(occ, 0.0) * 0.3
    return score


async def _fallback_scan(db: AsyncIOMotorDatabase, user_id: str, top_k: int) -> List[Dict]:
    """Return most recently added items when FAISS has no data yet."""
    from app.services.wardrobe_service import get_user_items
    return await get_user_items(db, user_id, limit=top_k)
