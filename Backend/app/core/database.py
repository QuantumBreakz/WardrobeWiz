"""
MongoDB Motor async client — replaces SQLAlchemy engine.
Exposes `get_db()` as a FastAPI dependency and `get_client()` for lifecycle management.
"""
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

from app.utils.retry import with_retry

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.mongo_uri)
    return _client


def get_database():
    return get_client()[settings.mongo_db_name]


async def get_db():
    """FastAPI dependency — yields the Motor database instance."""
    yield get_database()


@with_retry(retries=5, delay=2.0)
async def create_indexes():
    """Create all required indexes on startup."""
    db = get_database()
    await db["users"].create_index("email", unique=True)
    await db["wardrobe_items"].create_index("user_id")
    await db["outfit_recommendations"].create_index("user_id")
    await db["feedback_events"].create_index("user_id")
    await db["user_profiles"].create_index("user_id", unique=True)
