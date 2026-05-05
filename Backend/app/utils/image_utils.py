import os
import uuid
from pathlib import Path
from typing import Optional, Tuple

from PIL import Image, UnidentifiedImageError

THUMBNAIL_SIZE = (256, 256)
MAX_IMAGE_SIZE_MB = 10
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}


def validate_image(file_bytes: bytes, filename: str) -> Tuple[bool, str]:
    """Validate that file is a supported image and within size limits."""
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        return False, f"Unsupported format '{ext}'. Allowed: {ALLOWED_EXTENSIONS}"
    if len(file_bytes) > MAX_IMAGE_SIZE_MB * 1024 * 1024:
        return False, f"File exceeds {MAX_IMAGE_SIZE_MB}MB limit"
    try:
        from io import BytesIO
        img = Image.open(BytesIO(file_bytes))
        img.verify()
    except (UnidentifiedImageError, Exception) as e:
        return False, f"Invalid image: {e}"
    return True, "ok"


def save_upload(file_bytes: bytes, filename: str, upload_dir: str) -> str:
    """Save uploaded bytes to disk with a UUID-prefixed filename. Returns relative path."""
    os.makedirs(upload_dir, exist_ok=True)
    ext = Path(filename).suffix.lower()
    unique_name = f"{uuid.uuid4().hex}{ext}"
    dest = os.path.join(upload_dir, unique_name)
    with open(dest, "wb") as f:
        f.write(file_bytes)
    return dest


def create_thumbnail(image_path: str, thumbnail_dir: str) -> Optional[str]:
    """Generate a thumbnail for the given image. Returns the thumbnail path."""
    try:
        os.makedirs(thumbnail_dir, exist_ok=True)
        img = Image.open(image_path).convert("RGBA")
        background = Image.new("RGBA", img.size, (255, 255, 255, 255))
        img = Image.alpha_composite(background, img).convert("RGB")
        img.thumbnail(THUMBNAIL_SIZE, Image.LANCZOS)
        base = os.path.basename(image_path)
        thumb_path = os.path.join(thumbnail_dir, f"thumb_{base}")
        img.save(thumb_path, "JPEG", quality=85)
        return thumb_path
    except Exception:
        return None


def open_image(image_path: str) -> Optional[Image.Image]:
    """Open an image file safely."""
    try:
        return Image.open(image_path).convert("RGBA")
    except Exception:
        return None
