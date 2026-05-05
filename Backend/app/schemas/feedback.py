from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class FeedbackCreate(BaseModel):
    user_id: int
    outfit_id: Optional[int] = None
    wardrobe_item_id: Optional[int] = None
    action: str  # "like", "dislike", "skip", "save"


class FeedbackResponse(BaseModel):
    id: int
    user_id: int
    outfit_id: Optional[int] = None
    wardrobe_item_id: Optional[int] = None
    action: str
    created_at: datetime

    model_config = {"from_attributes": True}


class PreferenceStatResponse(BaseModel):
    stat_type: str
    stat_key: str
    score: float
    like_count: int
    dislike_count: int
    skip_count: int
    save_count: int

    model_config = {"from_attributes": True}


class UserFeedbackSummary(BaseModel):
    user_id: int
    total_feedback: int
    recent_feedback: List[FeedbackResponse]
    preference_stats: List[PreferenceStatResponse]
