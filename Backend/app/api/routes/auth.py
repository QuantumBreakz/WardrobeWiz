"""
Authentication routes — /api/auth/register, /api/auth/login, /api/auth/oauth/google
Uses PBKDF2-HMAC-SHA256 for password hashing and HMAC-SHA256 signed tokens.
Bootstrap admin: alybinmurtaza6030@gmail.com is always granted is_admin=True.
"""
import base64
import hashlib
import hmac
import json
import os
import time

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.core.mongo import to_str_id
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest
from app.core.config import settings

router = APIRouter()

# Constants
_ITERATIONS = 260_000
BOOTSTRAP_ADMIN_EMAIL = "alybinmurtaza6030@gmail.com"


class OAuthGoogleRequest(BaseModel):
    token: str


def _hash_password(password: str) -> str:
    salt = os.urandom(32)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, _ITERATIONS)
    return base64.b64encode(salt + dk).decode()


def _verify_password(password: str, stored_hash: str) -> bool:
    try:
        raw = base64.b64decode(stored_hash.encode())
        salt = raw[:32]
        dk_stored = raw[32:]
        dk_check = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, _ITERATIONS)
        return hmac.compare_digest(dk_stored, dk_check)
    except Exception:
        return False


def _make_token(user_id: str, email: str, is_admin: bool) -> str:
    payload = json.dumps({
        "user_id": user_id,
        "email": email,
        "is_admin": is_admin,
        "iat": int(time.time()),
    })
    sig = hmac.new(settings.secret_key.encode(), payload.encode(), hashlib.sha256).hexdigest()
    encoded = base64.urlsafe_b64encode(payload.encode()).decode()
    return f"{encoded}.{sig}"


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    existing = await db["users"].find_one({"email": req.email})
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists.")

    is_admin = req.email.lower() == BOOTSTRAP_ADMIN_EMAIL.lower()
    hashed = _hash_password(req.password)
    doc = {
        "name": req.name,
        "email": req.email,
        "password_hash": hashed,
        "is_admin": is_admin,
        "oauth_provider": None,
        "created_at": time.time(),
    }
    result = await db["users"].insert_one(doc)
    user_id = str(result.inserted_id)
    token = _make_token(user_id, req.email, is_admin)
    return AuthResponse(token=token, user_id=user_id, name=req.name, email=req.email, is_admin=is_admin)


@router.post("/login", response_model=AuthResponse)
async def login(req: LoginRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    user = await db["users"].find_one({"email": req.email})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")
    if not _verify_password(req.password, user.get("password_hash", "")):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    user_id = str(user["_id"])
    is_admin = user.get("is_admin", False)
    token = _make_token(user_id, user["email"], is_admin)
    return AuthResponse(token=token, user_id=user_id, name=user["name"], email=user["email"], is_admin=is_admin)


@router.post("/oauth/google", response_model=AuthResponse)
async def oauth_google(req: OAuthGoogleRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    """Real Google OAuth — verifies ID token with Google and upserts user in MongoDB."""
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests
        idinfo = id_token.verify_oauth2_token(req.token, google_requests.Request(), settings.google_client_id)
        email = idinfo.get("email")
        name = idinfo.get("name", email.split("@")[0] if email else "User")
        if not email:
            raise ValueError("Email not provided by Google.")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid Google token: {str(e)}")

    user = await db["users"].find_one({"email": email})
    if not user:
        is_admin = email.lower() == BOOTSTRAP_ADMIN_EMAIL.lower()
        doc = {
            "name": name,
            "email": email,
            "password_hash": "oauth-google",
            "is_admin": is_admin,
            "oauth_provider": "google",
            "created_at": time.time(),
        }
        result = await db["users"].insert_one(doc)
        user_id = str(result.inserted_id)
    else:
        user_id = str(user["_id"])
        is_admin = user.get("is_admin", False)
        name = user["name"]

    token = _make_token(user_id, email, is_admin)
    return AuthResponse(token=token, user_id=user_id, name=name, email=email, is_admin=is_admin)
