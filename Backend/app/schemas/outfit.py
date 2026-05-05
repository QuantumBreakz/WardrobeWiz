from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from app.schemas.wardrobe import WardrobeItemResponse


class GuidedOutfitRequest(BaseModel):
    user_id: int
    occasion: Optional[str] = None        # e.g. "casual", "formal", "party"
    mood: Optional[str] = None            # e.g. "bold", "minimal", "cozy"
    color_preference: Optional[str] = None
    item_id: Optional[int] = None         # anchor item to build outfit around
    query_text: Optional[str] = None      # free-text description


class SurpriseOutfitRequest(BaseModel):
    user_id: int
    count: int = 3


class OutfitItemDetail(BaseModel):
    role: str
    item: WardrobeItemResponse


class OutfitCombination(BaseModel):
    outfit_id: int
    items: List[OutfitItemDetail]
    explanation: str
    occasion: Optional[str] = None
    mood: Optional[str] = None


class OutfitResponse(BaseModel):
    outfits: List[OutfitCombination]
    query_summary: Optional[str] = None


class OutfitHistoryItem(BaseModel):
    id: int
    mode: str
    occasion: Optional[str] = None
    mood: Optional[str] = None
    explanation: Optional[str] = None
    created_at: datetime
    items: List[OutfitItemDetail] = []

    model_config = {"from_attributes": True}


class OutfitHistoryResponse(BaseModel):
    outfits: List[OutfitHistoryItem]
    total: int
