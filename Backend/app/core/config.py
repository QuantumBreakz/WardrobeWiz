from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "WardrobeWiz API"
    debug: bool = True
    
    # Secrets loaded from .env
    mongo_uri: str
    mongo_db_name: str = "WardrobeWiz"
    google_client_id: str
    secret_key: str = "wardrobewiz-secret-key-2024"
    
    # Paths
    upload_dir: str = "app/storage/uploads"
    thumbnail_dir: str = "app/storage/thumbnails"
    faiss_dir: str = "app/storage/faiss"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
