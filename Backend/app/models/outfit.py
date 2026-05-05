from app.core.database import Base
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func


class OutfitRecommendation(Base):
    __tablename__ = "outfit_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mode = Column(String, nullable=False)  # "guided" or "surprise"
    occasion = Column(String, nullable=True)
    mood = Column(String, nullable=True)
    color_preference = Column(String, nullable=True)
    query_text = Column(Text, nullable=True)
    explanation = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class OutfitItem(Base):
    __tablename__ = "outfit_items"

    id = Column(Integer, primary_key=True, index=True)
    outfit_id = Column(Integer, ForeignKey("outfit_recommendations.id"), nullable=False)
    wardrobe_item_id = Column(Integer, ForeignKey("wardrobe_items.id"), nullable=False)
    role = Column(String, nullable=True)  # "top", "bottom", "shoes", "accessory"
