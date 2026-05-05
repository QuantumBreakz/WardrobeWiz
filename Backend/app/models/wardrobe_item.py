from app.core.database import Base
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func


class WardrobeItem(Base):
    __tablename__ = "wardrobe_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    image_path = Column(String, nullable=False)
    thumbnail_path = Column(String, nullable=True)
    category = Column(String, nullable=True)
    subcategory = Column(String, nullable=True)
    dominant_colors_json = Column(Text, nullable=True)
    pattern_tags_json = Column(Text, nullable=True)
    occasion_tags_json = Column(Text, nullable=True)
    season_tags_json = Column(Text, nullable=True)
    embedding_id = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
