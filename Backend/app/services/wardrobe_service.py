"""
MongoDB-based wardrobe service — replaces SQLAlchemy wardrobe_service.py.
All functions are async and work with Motor AsyncIOMotorDatabase.
"""
import json
import logging
import time
from typing import Any, Dict, List, Optional

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)


def _doc_to_dict(doc) -> Optional[Dict]:
    if doc is None:
        return None
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    return doc


async def create_wardrobe_item(
    db: AsyncIOMotorDatabase,
    user_id: str,
    image_path: str,
    thumbnail_path: Optional[str],
    category: Optional[str],
    subcategory: Optional[str] = None,
    dominant_colors: Optional[List[str]] = None,
    embedding_id: Optional[str] = None,
) -> Dict:
    doc = {
        "user_id": user_id,
        "image_path": image_path,
        "thumbnail_path": thumbnail_path,
        "category": category,
        "subcategory": subcategory,
        "dominant_colors": dominant_colors or [],
        "pattern_tags": [],
        "occasion_tags": [],
        "season_tags": [],
        "embedding_id": embedding_id,
        "notes": None,
        "created_at": time.time(),
        "updated_at": time.time(),
    }
    result = await db["wardrobe_items"].insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc


async def get_item(db: AsyncIOMotorDatabase, item_id: str) -> Optional[Dict]:
    try:
        doc = await db["wardrobe_items"].find_one({"_id": ObjectId(item_id)})
    except Exception:
        return None
    return _doc_to_dict(doc)


async def get_user_items(
    db: AsyncIOMotorDatabase,
    user_id: str,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 500,
) -> List[Dict]:
    query: Dict[str, Any] = {"user_id": user_id}
    if category:
        query["category"] = category
    cursor = db["wardrobe_items"].find(query).sort("created_at", -1).skip(skip).limit(limit)
    return [_doc_to_dict(d) for d in await cursor.to_list(length=limit)]


async def count_user_items(db: AsyncIOMotorDatabase, user_id: str) -> int:
    return await db["wardrobe_items"].count_documents({"user_id": user_id})


async def update_item(db: AsyncIOMotorDatabase, item_id: str, payload: Dict) -> Optional[Dict]:
    update_fields: Dict = {"updated_at": time.time()}
    if "notes" in payload and payload["notes"] is not None:
        update_fields["notes"] = payload["notes"]
    if "season_tags" in payload and payload["season_tags"] is not None:
        update_fields["season_tags"] = payload["season_tags"]
    if "occasion_tags" in payload and payload["occasion_tags"] is not None:
        update_fields["occasion_tags"] = payload["occasion_tags"]
    if "category" in payload and payload["category"] is not None:
        update_fields["category"] = payload["category"]
    if "embedding_id" in payload and payload["embedding_id"] is not None:
        update_fields["embedding_id"] = payload["embedding_id"]

    try:
        await db["wardrobe_items"].update_one({"_id": ObjectId(item_id)}, {"$set": update_fields})
        return await get_item(db, item_id)
    except Exception:
        return None


async def delete_item(db: AsyncIOMotorDatabase, item_id: str) -> bool:
    try:
        result = await db["wardrobe_items"].delete_one({"_id": ObjectId(item_id)})
        return result.deleted_count > 0
    except Exception:
        return False
