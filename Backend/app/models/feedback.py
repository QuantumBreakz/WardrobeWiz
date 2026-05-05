from app.core.database import Base
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.sql import func


class FeedbackEvent(Base):
    __tablename__ = "feedback_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    outfit_id = Column(Integer, ForeignKey("outfit_recommendations.id"), nullable=True)
    wardrobe_item_id = Column(Integer, ForeignKey("wardrobe_items.id"), nullable=True)
    action = Column(String, nullable=False)  # "like", "dislike", "skip", "save"
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class UserPreferenceStat(Base):
    __tablename__ = "user_preference_stats"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    stat_type = Column(String, nullable=False)  # "category", "color", "occasion", "tag"
    stat_key = Column(String, nullable=False)   # e.g. "tops", "red", "casual"
    score = Column(Float, default=0.0)
    like_count = Column(Integer, default=0)
    dislike_count = Column(Integer, default=0)
    skip_count = Column(Integer, default=0)
    save_count = Column(Integer, default=0)
