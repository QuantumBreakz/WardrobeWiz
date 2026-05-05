import json
import logging
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.wardrobe_item import WardrobeItem
from app.schemas.wardrobe import WardrobeItemUpdate

logger = logging.getLogger(__name__)


def create_wardrobe_item(
    db: Session,
    user_id: int,
    image_path: str,
    thumbnail_path: Optional[str],
    category: Optional[str],
    subcategory: Optional[str] = None,
    dominant_colors: Optional[List[str]] = None,
    embedding_id: Optional[str] = None,
) -> WardrobeItem:
    item = WardrobeItem(
        user_id=user_id,
        image_path=image_path,
        thumbnail_path=thumbnail_path,
        category=category,
        subcategory=subcategory,
        dominant_colors_json=json.dumps(dominant_colors or []),
        pattern_tags_json=json.dumps([]),
        occasion_tags_json=json.dumps([]),
        season_tags_json=json.dumps([]),
        embedding_id=embedding_id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def get_item(db: Session, item_id: int) -> Optional[WardrobeItem]:
    return db.query(WardrobeItem).filter(WardrobeItem.id == item_id).first()


def get_user_items(
    db: Session,
    user_id: int,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[WardrobeItem]:
    q = db.query(WardrobeItem).filter(WardrobeItem.user_id == user_id)
    if category:
        q = q.filter(WardrobeItem.category == category)
    return q.order_by(WardrobeItem.created_at.desc()).offset(skip).limit(limit).all()


def count_user_items(db: Session, user_id: int) -> int:
    return db.query(WardrobeItem).filter(WardrobeItem.user_id == user_id).count()


def update_item(db: Session, item_id: int, payload: WardrobeItemUpdate) -> Optional[WardrobeItem]:
    item = get_item(db, item_id)
    if not item:
        return None

    if payload.category is not None:
        item.category = payload.category
    if payload.subcategory is not None:
        item.subcategory = payload.subcategory
    if payload.dominant_colors is not None:
        item.dominant_colors_json = json.dumps(payload.dominant_colors)
    if payload.pattern_tags is not None:
        item.pattern_tags_json = json.dumps(payload.pattern_tags)
    if payload.occasion_tags is not None:
        item.occasion_tags_json = json.dumps(payload.occasion_tags)
    if payload.season_tags is not None:
        item.season_tags_json = json.dumps(payload.season_tags)
    if payload.notes is not None:
        item.notes = payload.notes

    db.commit()
    db.refresh(item)
    return item


def delete_item(db: Session, item_id: int) -> bool:
    item = get_item(db, item_id)
    if not item:
        return False
    db.delete(item)
    db.commit()
    return True


def serialize_item(item: WardrobeItem) -> dict:
    """Convert DB model to dict with parsed JSON fields."""
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
