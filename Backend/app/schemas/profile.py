from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


# ── User ──────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str
    email: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Profile ───────────────────────────────────────────────────────────────────

class ProfileCreate(BaseModel):
    user_id: int
    style_text: Optional[str] = None
    preferred_styles: Optional[List[str]] = []
    preferred_colors: Optional[List[str]] = []
    disliked_colors: Optional[List[str]] = []
    preferred_occasions: Optional[List[str]] = []
    eastern_western_preference: Optional[str] = "neutral"


class ProfileUpdate(BaseModel):
    style_text: Optional[str] = None
    preferred_styles: Optional[List[str]] = None
    preferred_colors: Optional[List[str]] = None
    disliked_colors: Optional[List[str]] = None
    preferred_occasions: Optional[List[str]] = None
    eastern_western_preference: Optional[str] = None


class ProfileResponse(BaseModel):
    id: int
    user_id: int
    style_text: Optional[str] = None
    preferred_styles: Optional[List[str]] = []
    preferred_colors: Optional[List[str]] = []
    disliked_colors: Optional[List[str]] = []
    preferred_occasions: Optional[List[str]] = []
    eastern_western_preference: Optional[str] = None
    style_vector: Optional[List[float]] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
