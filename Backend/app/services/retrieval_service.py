"""
Retrieval service: translates a user query into candidate wardrobe items.

Flow:
  1. Build query text from occasion / mood / color_preference / free text
  2. Encode with CLIP
  3. FAISS k-NN search
  4. Fetch DB records, re-rank using user preference scores
  5. Return sorted candidates
"""
import json
import logging
from typing import Dict, List, Optional

from sqlalchemy.orm import Session

from app.models.wardrobe_item import WardrobeItem
from app.services.embedding_service import get_text_embedding
from app.services.faiss_service import search

logger = logging.getLogger(__name__)


def retrieve_candidates(
    db: Session,
    faiss_dir: str,
    user_id: int,
    occasion: Optional[str] = None,
    mood: Optional[str] = None,
    color_preference: Optional[str] = None,
    query_text: Optional[str] = None,
    anchor_item_id: Optional[int] = None,
    top_k: int = 20,
    style_vector: Optional[List[float]] = None,
    preference_scores: Optional[Dict[str, float]] = None,
) -> List[WardrobeItem]:
    """
    Return up to top_k WardrobeItem records most relevant to the query.
    Results are re-ranked by user preference scores when available.
    """
    # Build composite query text
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

    # Get text embedding for the query
    query_emb = get_text_embedding(composite_text)
    if query_emb is None:
        logger.warning("Could not generate query embedding; falling back to DB scan")
        return _fallback_scan(db, user_id, top_k)

    # Fetch more candidates than needed so re-ranking has room to work
    faiss_k = min(top_k * 3, 60)
    candidate_ids = search(faiss_dir, user_id, query_emb, top_k=faiss_k)

    # Always include all DB items so items without FAISS embeddings (e.g. after
    # reclassification) are still considered. FAISS results come first for relevance.
    all_db_items = _fallback_scan(db, user_id, top_k * 2)

    if candidate_ids:
        faiss_items = {
            item.id: item
            for item in db.query(WardrobeItem).filter(
                WardrobeItem.id.in_(candidate_ids),
                WardrobeItem.user_id == user_id,
            ).all()
        }
        ordered_faiss = [faiss_items[cid] for cid in candidate_ids if cid in faiss_items]
        faiss_ids = {item.id for item in ordered_faiss}
        # Append DB items not already in FAISS results
        ordered = ordered_faiss + [i for i in all_db_items if i.id not in faiss_ids]
    else:
        logger.info(f"FAISS returned 0 results for user {user_id}; using DB scan only")
        ordered = all_db_items

    # Re-rank by user preference scores (positive = liked, negative = disliked)
    if preference_scores:
        faiss_rank = {item.id: rank for rank, item in enumerate(ordered)}
        ordered = sorted(
            ordered,
            key=lambda item: _preference_score_for_item(item, preference_scores) - faiss_rank[item.id] * 0.1,
            reverse=True,
        )

    # Honour the anchor item
    if anchor_item_id:
        ordered = sorted(ordered, key=lambda x: 0 if x.id == anchor_item_id else 1)

    return ordered[:top_k]


def _preference_score_for_item(item: WardrobeItem, preference_scores: Dict[str, float]) -> float:
    """Compute a scalar preference signal for a wardrobe item."""
    score = 0.0
    if item.category:
        score += preference_scores.get(item.category, 0.0)
    for color in json.loads(item.dominant_colors_json or "[]"):
        score += preference_scores.get(color, 0.0) * 0.5
    for occ in json.loads(item.occasion_tags_json or "[]"):
        score += preference_scores.get(occ, 0.0) * 0.3
    return score


def _fallback_scan(db: Session, user_id: int, top_k: int) -> List[WardrobeItem]:
    """Return most recently added items when FAISS has no data yet."""
    return (
        db.query(WardrobeItem)
        .filter(WardrobeItem.user_id == user_id)
        .order_by(WardrobeItem.created_at.desc())
        .limit(top_k)
        .all()
    )

