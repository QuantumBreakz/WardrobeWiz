from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class WardrobeItemResponse(BaseModel):
    id: int
    user_id: int
    image_path: str
    thumbnail_path: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    dominant_colors: Optional[List[str]] = []
    pattern_tags: Optional[List[str]] = []
    occasion_tags: Optional[List[str]] = []
    season_tags: Optional[List[str]] = []
    embedding_id: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WardrobeItemUpdate(BaseModel):
    category: Optional[str] = None
    subcategory: Optional[str] = None
    dominant_colors: Optional[List[str]] = None
    pattern_tags: Optional[List[str]] = None
    occasion_tags: Optional[List[str]] = None
    season_tags: Optional[List[str]] = None
    notes: Optional[str] = None


class WardrobeListResponse(BaseModel):
    items: List[WardrobeItemResponse]
    total: int
