"""
MongoDB-based outfit service — replaces SQLAlchemy outfit_service.py.
All functions are async and work with Motor AsyncIOMotorDatabase.
"""
import logging
import random
import time
from typing import Dict, List, Optional, Tuple

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.services.feedback_service import get_preference_scores
from app.services.retrieval_service import retrieve_candidates
from app.utils.color_utils import get_outfit_color_score
from app.utils.rules import build_explanation, get_blueprint, get_role, items_satisfy_blueprint

logger = logging.getLogger(__name__)


async def generate_guided_outfit(
    db: AsyncIOMotorDatabase,
    faiss_dir: str,
    user_id: str,
    occasion: Optional[str],
    mood: Optional[str],
    color_preference: Optional[str],
    item_id: Optional[str],
    query_text: Optional[str],
    style_vector: Optional[List[float]],
) -> List[dict]:
    preference_scores = await get_preference_scores(db, user_id)
    candidates = await retrieve_candidates(
        db=db,
        faiss_dir=faiss_dir,
        user_id=user_id,
        occasion=occasion,
        mood=mood,
        color_preference=color_preference,
        query_text=query_text,
        anchor_item_id=item_id,
        top_k=100,
        style_vector=style_vector,
        preference_scores=preference_scores or None,
    )

    combos = _build_combinations(candidates, occasion, max_combos=3)
    return await _persist_and_format(db, user_id, "guided", occasion, mood, color_preference, query_text, combos)


async def generate_surprise_outfit(
    db: AsyncIOMotorDatabase,
    faiss_dir: str,
    user_id: str,
    count: int,
    style_vector: Optional[List[float]],
) -> List[dict]:
    preference_scores = await get_preference_scores(db, user_id)
    candidates = await retrieve_candidates(
        db=db,
        faiss_dir=faiss_dir,
        user_id=user_id,
        top_k=100,
        style_vector=style_vector,
        preference_scores=preference_scores or None,
    )
    random.shuffle(candidates)
    combos = _build_combinations(candidates, occasion=None, max_combos=count)
    return await _persist_and_format(db, user_id, "surprise", None, None, None, None, combos)


async def get_outfit_history(
    db: AsyncIOMotorDatabase,
    user_id: str,
    skip: int = 0,
    limit: int = 20,
) -> Tuple[List[dict], int]:
    cursor = (
        db["outfit_recommendations"]
        .find({"user_id": user_id})
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )
    outfits = await cursor.to_list(length=limit)
    total = await db["outfit_recommendations"].count_documents({"user_id": user_id})

    result = []
    for o in outfits:
        result.append({
            "id": str(o["_id"]),
            "mode": o.get("mode"),
            "occasion": o.get("occasion"),
            "mood": o.get("mood"),
            "explanation": o.get("explanation"),
            "created_at": o.get("created_at"),
            "items": o.get("items", []),
        })
    return result, total


def _build_combinations(candidates: List[Dict], occasion: Optional[str], max_combos: int) -> List[Dict]:
    """Group candidates by role and assemble the best-scoring outfit combos."""
    role_buckets: Dict[str, List[Dict]] = {}
    for item in candidates:
        role = get_role(item.get("category"))
        role_buckets.setdefault(role, []).append(item)

    blueprint = get_blueprint(occasion)
    all_roles = blueprint["required"] + blueprint["optional"]

    combos = []
    used_ids: set = set()

    for _ in range(max_combos * 5):
        if len(combos) >= max_combos:
            break

        selected: Dict[str, Dict] = {}
        for role in all_roles:
            available = [i for i in role_buckets.get(role, []) if i["id"] not in used_ids]
            if role in ("top", "bottom") and selected.get("dress"):
                continue
            if available:
                # Pick the first available item to prioritize semantic relevance over random shuffling
                selected[role] = available[0]

        role_map = {r: [v] for r, v in selected.items()}
        if not items_satisfy_blueprint(role_map, occasion):
            continue

        colors_list = [item.get("dominant_colors", []) for item in selected.values()]
        score = get_outfit_color_score(colors_list)

        combos.append({"items": selected, "score": score})
        for item in selected.values():
            used_ids.add(item["id"])

    combos.sort(key=lambda x: x["score"], reverse=True)
    return combos[:max_combos]


async def _persist_and_format(
    db: AsyncIOMotorDatabase,
    user_id: str,
    mode: str,
    occasion: Optional[str],
    mood: Optional[str],
    color_preference: Optional[str],
    query_text: Optional[str],
    combos: List[Dict],
) -> List[dict]:
    result = []
    for combo in combos:
        selected = combo["items"]
        explanation = build_explanation(
            {role: item for role, item in selected.items()},
            occasion,
            mood,
        )

        # Embed items array directly in the outfit document
        items_array = [
            {
                "role": role,
                "wardrobe_item_id": item["id"],
                "image_path": item.get("image_path"),
                "thumbnail_path": item.get("thumbnail_path"),
                "category": item.get("category"),
                "subcategory": item.get("subcategory"),
                "dominant_colors": item.get("dominant_colors", []),
            }
            for role, item in selected.items()
        ]

        outfit_doc = {
            "user_id": user_id,
            "mode": mode,
            "occasion": occasion,
            "mood": mood,
            "color_preference": color_preference,
            "query_text": query_text,
            "explanation": explanation,
            "items": items_array,
            "is_saved": False,
            "created_at": time.time(),
        }
        insert_result = await db["outfit_recommendations"].insert_one(outfit_doc)
        outfit_id = str(insert_result.inserted_id)

        result.append({
            "outfit_id": outfit_id,
            "items": [{"role": i["role"], "item": i} for i in items_array],
            "explanation": explanation,
            "occasion": occasion,
            "mood": mood,
        })

    return result
