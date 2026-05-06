"""
MongoDB-based feedback service — replaces SQLAlchemy feedback_service.py.
"""
import time
import logging
from typing import Any, Dict, List, Optional, Tuple

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)


async def store_feedback(
    db: AsyncIOMotorDatabase,
    user_id: str,
    outfit_id: Optional[str],
    action: str,
) -> None:
    doc = {
        "user_id": user_id,
        "outfit_id": outfit_id,
        "action": action,
        "created_at": time.time(),
    }
    await db["feedback_events"].insert_one(doc)


async def get_user_feedback(
    db: AsyncIOMotorDatabase,
    user_id: str,
    skip: int = 0,
    limit: int = 50,
) -> List[Dict]:
    cursor = db["feedback_events"].find({"user_id": user_id}).sort("created_at", -1).skip(skip).limit(limit)
    events = await cursor.to_list(length=limit)
    result = []
    for e in events:
        result.append({
            "id": str(e["_id"]),
            "outfit_id": e.get("outfit_id"),
            "action": e.get("action"),
            "created_at": e.get("created_at"),
        })
    return result


async def get_preference_scores(db: AsyncIOMotorDatabase, user_id: str) -> Dict[str, float]:
    """Return aggregated preference scores (category → score) from feedback history."""
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": "$action", "count": {"$sum": 1}}},
    ]
    cursor = db["feedback_events"].aggregate(pipeline)
    docs = await cursor.to_list(length=100)
    scores: Dict[str, float] = {}
    for doc in docs:
        scores[doc["_id"]] = float(doc["count"])
    return scores
