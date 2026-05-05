"""
Authentication routes — /api/auth/register and /api/auth/login.
Uses PBKDF2-HMAC-SHA256 (Python stdlib) for password hashing against the SQLite users table.
"""
import base64
import hashlib
import hmac
import json
import os
import time

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest

router = APIRouter()

_SECRET = "wardrobewiz-secret-key-2024"
_ITERATIONS = 260_000


def _hash_password(password: str) -> str:
    """Hash a password using PBKDF2-HMAC-SHA256 with a random salt."""
    salt = os.urandom(32)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, _ITERATIONS)
    return base64.b64encode(salt + dk).decode()


def _verify_password(password: str, stored_hash: str) -> bool:
    """Verify a password against a stored PBKDF2 hash."""
    try:
        raw = base64.b64decode(stored_hash.encode())
        salt = raw[:32]
        dk_stored = raw[32:]
        dk_check = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, _ITERATIONS)
        return hmac.compare_digest(dk_stored, dk_check)
    except Exception:
        return False


def _make_token(user_id: int, email: str) -> str:
    """Create a simple HMAC-signed token."""
    payload = json.dumps({"user_id": user_id, "email": email, "iat": int(time.time())})
    sig = hmac.new(_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
    encoded = base64.urlsafe_b64encode(payload.encode()).decode()
    return f"{encoded}.{sig}"


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    # Check if email already registered
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    hashed = _hash_password(req.password)
    user = User(name=req.name, email=req.email, password_hash=hashed)
    db.add(user)
    db.commit()
    db.refresh(user)

    token = _make_token(user.id, user.email)
    return AuthResponse(token=token, user_id=user.id, name=user.name, email=user.email)


@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not _verify_password(req.password, user.password_hash or ""):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    token = _make_token(user.id, user.email)
    return AuthResponse(token=token, user_id=user.id, name=user.name, email=user.email)
