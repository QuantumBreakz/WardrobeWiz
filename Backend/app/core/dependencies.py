"""
FastAPI dependencies for authentication and admin authorization.
Works with MongoDB Motor async — no SQLAlchemy session.
"""
import base64
import hashlib
import hmac
import json

from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_db
from app.core.config import settings

security = HTTPBearer()


def _decode_token(token: str) -> dict:
    """Decode and verify HMAC-signed token, returning the payload dict."""
    try:
        encoded, sig = token.split(".")
        padding = 4 - (len(encoded) % 4)
        if padding != 4:
            encoded += "=" * padding
        payload_bytes = base64.urlsafe_b64decode(encoded)
        expected_sig = hmac.new(settings.secret_key.encode(), payload_bytes, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected_sig):
            raise ValueError("Invalid signature")
        return json.loads(payload_bytes.decode())
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncIOMotorDatabase = Depends(get_db),
) -> dict:
    """Return the current authenticated user document from MongoDB."""
    payload = _decode_token(credentials.credentials)
    user_id = payload.get("user_id")
    try:
        user = await db["users"].find_one({"_id": ObjectId(user_id)})
    except Exception:
        user = None
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    user["id"] = str(user.pop("_id"))
    return user


async def get_admin_user(current_user: dict = Depends(get_current_user)) -> dict:
    """Same as get_current_user but raises 403 if the user is not an admin."""
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user
