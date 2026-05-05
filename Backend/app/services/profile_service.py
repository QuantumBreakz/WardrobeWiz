import json
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.profile import UserProfile
from app.models.user import User
from app.schemas.profile import ProfileCreate, ProfileUpdate, UserCreate

# Style → numeric dimension mapping for generating a style vector
STYLE_DIMENSIONS = [
    "casual", "formal", "sporty", "bohemian", "minimalist",
    "maximalist", "vintage", "streetwear", "preppy", "elegant",
]
OCCASION_DIMENSIONS = [
    "everyday", "work", "party", "date", "sport", "beach", "formal",
]
EW_MAP = {"eastern": 1.0, "western": -1.0, "neutral": 0.0}


def create_user(db: Session, payload: UserCreate) -> User:
    user = User(name=payload.name, email=payload.email)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_user(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def create_profile(db: Session, payload: ProfileCreate) -> UserProfile:
    style_vector = _generate_style_vector(
        preferred_styles=payload.preferred_styles or [],
        preferred_colors=payload.preferred_colors or [],
        disliked_colors=payload.disliked_colors or [],
        preferred_occasions=payload.preferred_occasions or [],
        eastern_western=payload.eastern_western_preference or "neutral",
    )
    profile = UserProfile(
        user_id=payload.user_id,
        style_text=payload.style_text,
        preferred_styles_json=json.dumps(payload.preferred_styles or []),
        preferred_colors_json=json.dumps(payload.preferred_colors or []),
        disliked_colors_json=json.dumps(payload.disliked_colors or []),
        preferred_occasions_json=json.dumps(payload.preferred_occasions or []),
        eastern_western_preference=payload.eastern_western_preference,
        style_vector_json=json.dumps(style_vector),
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def get_profile(db: Session, user_id: int) -> Optional[UserProfile]:
    return db.query(UserProfile).filter(UserProfile.user_id == user_id).first()


def update_profile(db: Session, user_id: int, payload: ProfileUpdate) -> Optional[UserProfile]:
    profile = get_profile(db, user_id)
    if not profile:
        return None

    if payload.style_text is not None:
        profile.style_text = payload.style_text
    if payload.preferred_styles is not None:
        profile.preferred_styles_json = json.dumps(payload.preferred_styles)
    if payload.preferred_colors is not None:
        profile.preferred_colors_json = json.dumps(payload.preferred_colors)
    if payload.disliked_colors is not None:
        profile.disliked_colors_json = json.dumps(payload.disliked_colors)
    if payload.preferred_occasions is not None:
        profile.preferred_occasions_json = json.dumps(payload.preferred_occasions)
    if payload.eastern_western_preference is not None:
        profile.eastern_western_preference = payload.eastern_western_preference

    # Regenerate style vector
    profile.style_vector_json = json.dumps(_generate_style_vector(
        preferred_styles=json.loads(profile.preferred_styles_json or "[]"),
        preferred_colors=json.loads(profile.preferred_colors_json or "[]"),
        disliked_colors=json.loads(profile.disliked_colors_json or "[]"),
        preferred_occasions=json.loads(profile.preferred_occasions_json or "[]"),
        eastern_western=profile.eastern_western_preference or "neutral",
    ))

    db.commit()
    db.refresh(profile)
    return profile


def serialize_profile(profile: UserProfile) -> dict:
    """Convert DB model to dict with parsed JSON fields."""
    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "style_text": profile.style_text,
        "preferred_styles": json.loads(profile.preferred_styles_json or "[]"),
        "preferred_colors": json.loads(profile.preferred_colors_json or "[]"),
        "disliked_colors": json.loads(profile.disliked_colors_json or "[]"),
        "preferred_occasions": json.loads(profile.preferred_occasions_json or "[]"),
        "eastern_western_preference": profile.eastern_western_preference,
        "style_vector": json.loads(profile.style_vector_json or "[]"),
        "created_at": profile.created_at,
        "updated_at": profile.updated_at,
    }


# ── Internal helpers ──────────────────────────────────────────────────────────

def _generate_style_vector(
    preferred_styles: List[str],
    preferred_colors: List[str],
    disliked_colors: List[str],
    preferred_occasions: List[str],
    eastern_western: str,
) -> List[float]:
    """
    Build a lightweight numeric style vector from profile fields.
    Dimensions: style flags (10) + occasion flags (7) + ew bias (1) = 18 dims.
    """
    vec: List[float] = []

    # Style dimensions
    styles_lower = [s.lower() for s in preferred_styles]
    for dim in STYLE_DIMENSIONS:
        vec.append(1.0 if dim in styles_lower else 0.0)

    # Occasion dimensions
    occ_lower = [o.lower() for o in preferred_occasions]
    for dim in OCCASION_DIMENSIONS:
        vec.append(1.0 if dim in occ_lower else 0.0)

    # Eastern/Western bias
    vec.append(EW_MAP.get(eastern_western.lower(), 0.0))

    return vec
