import json
import logging
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.feedback import FeedbackEvent, UserPreferenceStat
from app.models.outfit import OutfitItem, OutfitRecommendation
from app.models.wardrobe_item import WardrobeItem
from app.schemas.feedback import FeedbackCreate

logger = logging.getLogger(__name__)

# Weight applied to preference score per action
ACTION_WEIGHTS = {
    "like": +1.0,
    "save": +1.5,
    "dislike": -1.0,
    "skip": -0.2,
}


def store_feedback(db: Session, payload: FeedbackCreate) -> FeedbackEvent:
    event = FeedbackEvent(
        user_id=payload.user_id,
        outfit_id=payload.outfit_id,
        wardrobe_item_id=payload.wardrobe_item_id,
        action=payload.action,
    )
    db.add(event)
    db.flush()

    # Update preference stats based on the outfit's items
    _update_preferences(db, payload)

    db.commit()
    db.refresh(event)
    return event


def get_user_feedback(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 50,
) -> tuple:
    events = (
        db.query(FeedbackEvent)
        .filter(FeedbackEvent.user_id == user_id)
        .order_by(FeedbackEvent.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    total = db.query(FeedbackEvent).filter(FeedbackEvent.user_id == user_id).count()
    stats = (
        db.query(UserPreferenceStat)
        .filter(UserPreferenceStat.user_id == user_id)
        .order_by(UserPreferenceStat.score.desc())
        .all()
    )
    return events, total, stats


def get_preference_scores(db: Session, user_id: int) -> dict:
    """Return a dict of {stat_key: score} for boosting retrieval."""
    stats = db.query(UserPreferenceStat).filter(UserPreferenceStat.user_id == user_id).all()
    return {s.stat_key: s.score for s in stats}


# ── Internal ──────────────────────────────────────────────────────────────────

def _update_preferences(db: Session, payload: FeedbackCreate):
    weight = ACTION_WEIGHTS.get(payload.action, 0.0)
    if weight == 0.0:
        return

    items_to_update: List[WardrobeItem] = []

    if payload.outfit_id:
        outfit_items = (
            db.query(OutfitItem)
            .filter(OutfitItem.outfit_id == payload.outfit_id)
            .all()
        )
        for oi in outfit_items:
            wi = db.query(WardrobeItem).filter(WardrobeItem.id == oi.wardrobe_item_id).first()
            if wi:
                items_to_update.append(wi)

    if payload.wardrobe_item_id:
        wi = db.query(WardrobeItem).filter(WardrobeItem.id == payload.wardrobe_item_id).first()
        if wi:
            items_to_update.append(wi)

    for wi in items_to_update:
        # Update category stat
        if wi.category:
            _bump_stat(db, payload.user_id, "category", wi.category, payload.action, weight)

        # Update color stats
        colors = json.loads(wi.dominant_colors_json or "[]")
        for color in colors:
            _bump_stat(db, payload.user_id, "color", color, payload.action, weight)

        # Update occasion stats
        occasions = json.loads(wi.occasion_tags_json or "[]")
        for occ in occasions:
            _bump_stat(db, payload.user_id, "occasion", occ, payload.action, weight)


def _bump_stat(
    db: Session,
    user_id: int,
    stat_type: str,
    stat_key: str,
    action: str,
    weight: float,
):
    stat = (
        db.query(UserPreferenceStat)
        .filter(
            UserPreferenceStat.user_id == user_id,
            UserPreferenceStat.stat_type == stat_type,
            UserPreferenceStat.stat_key == stat_key,
        )
        .first()
    )
    if not stat:
        stat = UserPreferenceStat(
            user_id=user_id,
            stat_type=stat_type,
            stat_key=stat_key,
            score=0.0,
        )
        db.add(stat)
        db.flush()

    # Increment correct counter
    if action == "like":
        stat.like_count = (stat.like_count or 0) + 1
    elif action == "dislike":
        stat.dislike_count = (stat.dislike_count or 0) + 1
    elif action == "skip":
        stat.skip_count = (stat.skip_count or 0) + 1
    elif action == "save":
        stat.save_count = (stat.save_count or 0) + 1

    stat.score = (stat.score or 0.0) + weight
