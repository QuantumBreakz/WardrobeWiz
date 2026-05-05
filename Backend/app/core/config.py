from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "WardrobeWhiz API"
    debug: bool = True
    database_url: str = "sqlite:///./wardrobewhiz.db"
    upload_dir: str = "app/storage/uploads"
    thumbnail_dir: str = "app/storage/thumbnails"
    faiss_dir: str = "app/storage/faiss"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
