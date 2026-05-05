from app.core.database import Base
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    style_text = Column(Text, nullable=True)
    preferred_styles_json = Column(Text, nullable=True)
    preferred_colors_json = Column(Text, nullable=True)
    disliked_colors_json = Column(Text, nullable=True)
    preferred_occasions_json = Column(Text, nullable=True)
    eastern_western_preference = Column(String, nullable=True)
    style_vector_json = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
