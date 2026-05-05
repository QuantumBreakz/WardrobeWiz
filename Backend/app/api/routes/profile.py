from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.profile import ProfileCreate, ProfileResponse, ProfileUpdate, UserCreate, UserResponse
from app.services import profile_service

router = APIRouter()


# ── Users ─────────────────────────────────────────────────────────────────────

@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    if payload.email:
        existing = profile_service.get_user_by_email(db, payload.email)
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
    user = profile_service.create_user(db, payload)
    return user


@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = profile_service.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ── Profiles ──────────────────────────────────────────────────────────────────

@router.post("/", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
def create_profile(payload: ProfileCreate, db: Session = Depends(get_db)):
    user = profile_service.get_user(db, payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing = profile_service.get_profile(db, payload.user_id)
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists for this user. Use PUT to update.")

    profile = profile_service.create_profile(db, payload)
    data = profile_service.serialize_profile(profile)
    return ProfileResponse(**data)


@router.get("/{user_id}", response_model=ProfileResponse)
def get_profile(user_id: int, db: Session = Depends(get_db)):
    profile = profile_service.get_profile(db, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    data = profile_service.serialize_profile(profile)
    return ProfileResponse(**data)


@router.put("/{user_id}", response_model=ProfileResponse)
def update_profile(user_id: int, payload: ProfileUpdate, db: Session = Depends(get_db)):
    profile = profile_service.update_profile(db, user_id, payload)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    data = profile_service.serialize_profile(profile)
    return ProfileResponse(**data)
