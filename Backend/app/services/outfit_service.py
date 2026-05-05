"""
Outfit generation service.

Given a list of candidate WardrobeItem records, assembles 1-3 outfit
combinations using rule-based matching, then persists them to DB.
"""
import json
import logging
import random
from typing import Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models.outfit import OutfitItem, OutfitRecommendation
from app.models.wardrobe_item import WardrobeItem
from app.services.feedback_service import get_preference_scores
from app.services.retrieval_service import retrieve_candidates
from app.utils.color_utils import get_outfit_color_score
from app.utils.rules import build_explanation, get_blueprint, get_role, items_satisfy_blueprint

logger = logging.getLogger(__name__)


# ── Public API ────────────────────────────────────────────────────────────────

def generate_guided_outfit(
    db: Session,
    faiss_dir: str,
    user_id: int,
    occasion: Optional[str],
    mood: Optional[str],
    color_preference: Optional[str],
    item_id: Optional[int],
    query_text: Optional[str],
    style_vector: Optional[List[float]],
) -> List[dict]:
    preference_scores = get_preference_scores(db, user_id)
    candidates = retrieve_candidates(
        db=db,
        faiss_dir=faiss_dir,
        user_id=user_id,
        occasion=occasion,
        mood=mood,
        color_preference=color_preference,
        query_text=query_text,
        anchor_item_id=item_id,
        top_k=30,
        style_vector=style_vector,
        preference_scores=preference_scores or None,
    )

    combos = _build_combinations(candidates, occasion, max_combos=3)
    return _persist_and_format(db, user_id, "guided", occasion, mood, color_preference, query_text, combos)


def generate_surprise_outfit(
    db: Session,
    faiss_dir: str,
    user_id: int,
    count: int,
    style_vector: Optional[List[float]],
) -> List[dict]:
    preference_scores = get_preference_scores(db, user_id)
    candidates = retrieve_candidates(
        db=db,
        faiss_dir=faiss_dir,
        user_id=user_id,
        top_k=50,
        style_vector=style_vector,
        preference_scores=preference_scores or None,
    )
    random.shuffle(candidates)
    combos = _build_combinations(candidates, occasion=None, max_combos=count)
    return _persist_and_format(db, user_id, "surprise", None, None, None, None, combos)


def get_outfit_history(db: Session, user_id: int, skip: int = 0, limit: int = 20) -> List[dict]:
    outfits = (
        db.query(OutfitRecommendation)
        .filter(OutfitRecommendation.user_id == user_id)
        .order_by(OutfitRecommendation.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    total = db.query(OutfitRecommendation).filter(OutfitRecommendation.user_id == user_id).count()

    result = []
    for outfit in outfits:
        outfit_items = db.query(OutfitItem).filter(OutfitItem.outfit_id == outfit.id).all()
        item_details = []
        for oi in outfit_items:
            wi = db.query(WardrobeItem).filter(WardrobeItem.id == oi.wardrobe_item_id).first()
            if wi:
                item_details.append({"role": oi.role, "item": _serialize_wardrobe(wi)})
        result.append({
            "id": outfit.id,
            "mode": outfit.mode,
            "occasion": outfit.occasion,
            "mood": outfit.mood,
            "explanation": outfit.explanation,
            "created_at": outfit.created_at,
            "items": item_details,
        })
    return result, total


# ── Internal helpers ──────────────────────────────────────────────────────────

def _build_combinations(
    candidates: List[WardrobeItem],
    occasion: Optional[str],
    max_combos: int,
) -> List[Dict]:
    """
    Group candidates by role and assemble the best-scoring outfit combos.
    Returns a list of {role → WardrobeItem} dicts.
    """
    # Bucket items by role
    role_buckets: Dict[str, List[WardrobeItem]] = {}
    for item in candidates:
        role = get_role(item.category)
        role_buckets.setdefault(role, []).append(item)

    blueprint = get_blueprint(occasion)
    all_roles = blueprint["required"] + blueprint["optional"]

    combos = []
    used_ids: set = set()

    for _ in range(max_combos * 5):  # try multiple times to find valid combos
        if len(combos) >= max_combos:
            break

        selected: Dict[str, WardrobeItem] = {}
        for role in all_roles:
            available = [i for i in role_buckets.get(role, []) if i.id not in used_ids]
            # For dress, skip top+bottom if we have one
            if role in ("top", "bottom") and selected.get("dress"):
                continue
            if available:
                selected[role] = random.choice(available)

        role_map = {r: [v] for r, v in selected.items()}
        if not items_satisfy_blueprint(role_map, occasion):
            continue

        # Score by color compatibility
        colors_list = [
            json.loads(item.dominant_colors_json or "[]")
            for item in selected.values()
        ]
        score = get_outfit_color_score(colors_list)

        combos.append({"items": selected, "score": score})
        # Prevent exact same top from appearing in next combo
        for item in selected.values():
            used_ids.add(item.id)

    # Sort by score descending
    combos.sort(key=lambda x: x["score"], reverse=True)
    return combos[:max_combos]


def _persist_and_format(
    db: Session,
    user_id: int,
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
            {role: _serialize_wardrobe(item) for role, item in selected.items()},
            occasion,
            mood,
        )

        # Persist outfit record
        outfit_rec = OutfitRecommendation(
            user_id=user_id,
            mode=mode,
            occasion=occasion,
            mood=mood,
            color_preference=color_preference,
            query_text=query_text,
            explanation=explanation,
        )
        db.add(outfit_rec)
        db.flush()  # get outfit_rec.id

        item_details = []
        for role, wardrobe_item in selected.items():
            oi = OutfitItem(
                outfit_id=outfit_rec.id,
                wardrobe_item_id=wardrobe_item.id,
                role=role,
            )
            db.add(oi)
            item_details.append({"role": role, "item": _serialize_wardrobe(wardrobe_item)})

        db.commit()
        result.append({
            "outfit_id": outfit_rec.id,
            "items": item_details,
            "explanation": explanation,
            "occasion": occasion,
            "mood": mood,
        })

    return result


def _serialize_wardrobe(item: WardrobeItem) -> dict:
    return {
        "id": item.id,
        "user_id": item.user_id,
        "image_path": item.image_path,
        "thumbnail_path": item.thumbnail_path,
        "category": item.category,
        "subcategory": item.subcategory,
        "dominant_colors": json.loads(item.dominant_colors_json or "[]"),
        "pattern_tags": json.loads(item.pattern_tags_json or "[]"),
        "occasion_tags": json.loads(item.occasion_tags_json or "[]"),
        "season_tags": json.loads(item.season_tags_json or "[]"),
        "embedding_id": item.embedding_id,
        "notes": item.notes,
        "created_at": item.created_at,
        "updated_at": item.updated_at,
    }
