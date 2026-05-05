import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.schemas.outfit import (
    GuidedOutfitRequest,
    OutfitCombination,
    OutfitHistoryResponse,
    OutfitItemDetail,
    OutfitResponse,
    SurpriseOutfitRequest,
)
from app.schemas.wardrobe import WardrobeItemResponse
from app.services import outfit_service
from app.services.profile_service import get_profile, get_user

router = APIRouter()


def _get_style_vector(db, user_id: int):
    profile = get_profile(db, user_id)
    if profile and profile.style_vector_json:
        return json.loads(profile.style_vector_json)
    return None


def _format_combos(raw_combos: list) -> list:
    """Convert raw service dicts to OutfitCombination objects."""
    result = []
    for combo in raw_combos:
        item_details = [
            OutfitItemDetail(
                role=d["role"],
                item=WardrobeItemResponse(**d["item"]),
            )
            for d in combo["items"]
        ]
        result.append(
            OutfitCombination(
                outfit_id=combo["outfit_id"],
                items=item_details,
                explanation=combo["explanation"],
                occasion=combo.get("occasion"),
                mood=combo.get("mood"),
            )
        )
    return result


@router.post("/guided", response_model=OutfitResponse)
def guided_outfit(payload: GuidedOutfitRequest, db: Session = Depends(get_db)):
    user = get_user(db, payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    style_vector = _get_style_vector(db, payload.user_id)

    raw = outfit_service.generate_guided_outfit(
        db=db,
        faiss_dir=settings.faiss_dir,
        user_id=payload.user_id,
        occasion=payload.occasion,
        mood=payload.mood,
        color_preference=payload.color_preference,
        item_id=payload.item_id,
        query_text=payload.query_text,
        style_vector=style_vector,
    )

    if not raw:
        raise HTTPException(
            status_code=422,
            detail="Not enough wardrobe items to generate an outfit. Upload more items first.",
        )

    outfits = _format_combos(raw)
    parts = [p for p in [payload.occasion, payload.mood, payload.query_text] if p]
    query_summary = " · ".join(parts) if parts else "General outfit suggestion"
    return OutfitResponse(outfits=outfits, query_summary=query_summary)


@router.post("/surprise", response_model=OutfitResponse)
def surprise_outfit(payload: SurpriseOutfitRequest, db: Session = Depends(get_db)):
    user = get_user(db, payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    style_vector = _get_style_vector(db, payload.user_id)

    raw = outfit_service.generate_surprise_outfit(
        db=db,
        faiss_dir=settings.faiss_dir,
        user_id=payload.user_id,
        count=min(payload.count, 5),
        style_vector=style_vector,
    )

    if not raw:
        raise HTTPException(
            status_code=422,
            detail="Not enough wardrobe items to generate an outfit. Upload more items first.",
        )

    outfits = _format_combos(raw)
    return OutfitResponse(outfits=outfits, query_summary="Surprise outfit — styled for you!")


@router.get("/history/{user_id}", response_model=OutfitHistoryResponse)
def outfit_history(
    user_id: int,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    from app.schemas.outfit import OutfitHistoryItem
    raw_outfits, total = outfit_service.get_outfit_history(db, user_id, skip=skip, limit=limit)

    history_items = []
    for o in raw_outfits:
        item_details = [
            OutfitItemDetail(
                role=d["role"],
                item=WardrobeItemResponse(**d["item"]),
            )
            for d in o["items"]
        ]
        history_items.append(
            OutfitHistoryItem(
                id=o["id"],
                mode=o["mode"],
                occasion=o["occasion"],
                mood=o["mood"],
                explanation=o["explanation"],
                created_at=o["created_at"],
                items=item_details,
            )
        )

    return OutfitHistoryResponse(outfits=history_items, total=total)
