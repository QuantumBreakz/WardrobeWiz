import json
import logging
import os
from typing import Dict, List, Optional, Tuple

import numpy as np
from PIL import Image

from app.services.processing_service import process_image
from app.utils.color_utils import extract_dominant_colors
from app.utils.image_utils import create_thumbnail, open_image, save_upload, validate_image

logger = logging.getLogger(__name__)

# Simple category heuristics based on filename keywords (fallback when no ML)
CATEGORY_KEYWORDS = {
    "tops": ["shirt", "top", "tee", "blouse", "sweater", "hoodie", "polo", "tank"],
    "bottoms": ["pants", "jeans", "trouser", "shorts", "skirt", "leggings"],
    "dresses": ["dress", "gown", "jumpsuit", "romper"],
    "jackets": ["jacket", "coat", "blazer", "parka", "cardigan"],
    "shoes": ["shoe", "boot", "sneaker", "heel", "sandal", "loafer", "slipper"],
    "accessories": ["bag", "hat", "scarf", "belt", "watch", "jewel", "necklace", "bracelet", "sunglasses"],
}

# CLIP zero-shot classification labels per category
_CLIP_CATEGORY_LABELS = {
    "tops": "a photo of a shirt, top, blouse, sweater, or t-shirt",
    "bottoms": "a photo of pants, jeans, trousers, skirt, or shorts",
    "dresses": "a photo of a dress, gown, or jumpsuit",
    "jackets": "a photo of a jacket, coat, or blazer",
    "shoes": "a photo of shoes, boots, sneakers, or sandals",
    "accessories": "a photo of a bag, hat, scarf, belt, or jewellery",
}

# CLIP zero-shot subcategory labels per category
_CLIP_SUBCATEGORY_LABELS: Dict[str, Dict[str, str]] = {
    "tops": {
        "t-shirts": "a photo of a t-shirt or tee",
        "shirts": "a photo of a button-up shirt or polo",
        "blouses": "a photo of a blouse",
        "sweaters": "a photo of a sweater, hoodie, or knitwear",
    },
    "bottoms": {
        "jeans": "a photo of jeans or denim trousers",
        "trousers": "a photo of formal trousers or chinos",
        "shorts": "a photo of shorts",
        "skirts": "a photo of a skirt",
        "leggings": "a photo of leggings or tights",
    },
    "dresses": {
        "dresses": "a photo of a dress",
        "jumpsuits": "a photo of a jumpsuit or romper",
    },
    "jackets": {
        "jackets": "a photo of a casual jacket or parka",
        "coats": "a photo of a coat or overcoat",
        "blazers": "a photo of a blazer or suit jacket",
    },
    "shoes": {
        "sneakers": "a photo of sneakers or trainers",
        "boots": "a photo of boots",
        "heels": "a photo of heels or pumps",
        "sandals": "a photo of sandals or flip-flops",
        "shoes": "a photo of dress shoes or loafers",
    },
    "accessories": {
        "bags": "a photo of a bag, purse, or backpack",
        "hats": "a photo of a hat or cap",
        "scarves": "a photo of a scarf",
        "belts": "a photo of a belt",
        "jewellery": "a photo of jewellery, necklace, bracelet, or earrings",
        "watches": "a photo of a watch",
    },
}


def _clip_best_match(img_arr: "np.ndarray", labels: Dict[str, str]) -> Optional[str]:
    """Return the label key with highest cosine similarity to the image embedding."""
    try:
        from app.services.embedding_service import get_text_embedding

        best_key = None
        best_score = -1.0
        for key, label in labels.items():
            txt_vec = get_text_embedding(label)
            if not txt_vec:
                continue
            txt_arr = np.array(txt_vec, dtype=np.float32)
            score = float(np.dot(img_arr, txt_arr))
            if score > best_score:
                best_score = score
                best_key = key
        return best_key
    except Exception:
        return None


def classify_category_from_image(image_path: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Use CLIP zero-shot classification to identify clothing category and subcategory.
    Returns (category, subcategory).
    """
    try:
        from app.services.embedding_service import get_image_embedding

        img_vec = get_image_embedding(image_path)
        if not img_vec:
            return None, None

        img_arr = np.array(img_vec, dtype=np.float32)
        category = _clip_best_match(img_arr, _CLIP_CATEGORY_LABELS)
        subcategory = None
        if category and category in _CLIP_SUBCATEGORY_LABELS:
            subcategory = _clip_best_match(img_arr, _CLIP_SUBCATEGORY_LABELS[category])
        return category, subcategory
    except Exception:
        return None, None


def process_upload(
    file_bytes: bytes,
    filename: str,
    upload_dir: str,
    thumbnail_dir: str,
) -> Dict:
    """
    Full pipeline for a wardrobe image upload:
    1. Validate
    2. Save to disk
    3. Create thumbnail
    4. Extract dominant colors
    5. Classify category and subcategory from image content (falls back to filename heuristic)

    Returns a dict with: image_path, thumbnail_path, dominant_colors, category, subcategory
    """
    image_path = save_validated_upload(
        file_bytes=file_bytes,
        filename=filename,
        upload_dir=upload_dir,
    )
    processing_result = process_image(image_path)
    logger.info(
        "Advanced processing placeholder completed for %s: %s",
        filename,
        processing_result.get("message"),
    )
    upload_details = analyze_saved_upload(
        image_path=image_path,
        filename=filename,
        thumbnail_dir=thumbnail_dir,
    )
    return {"image_path": image_path, **upload_details}


def save_validated_upload(
    file_bytes: bytes,
    filename: str,
    upload_dir: str,
) -> str:
    """Validate an upload and save it to disk, returning the saved image path."""
    valid, msg = validate_image(file_bytes, filename)
    if not valid:
        raise ValueError(msg)

    return save_upload(file_bytes, filename, upload_dir)


def analyze_saved_upload(
    image_path: str,
    filename: str,
    thumbnail_dir: str,
) -> Dict:
    """Generate derived upload data for an already-saved image."""
    thumbnail_path = create_thumbnail(image_path, thumbnail_dir)

    img = open_image(image_path)
    dominant_colors: List[str] = []
    if img:
        dominant_colors = extract_dominant_colors(img, n_colors=3)

    category, subcategory = classify_category_from_image(image_path)
    if not category:
        category = _guess_category(filename)

    return {
        "thumbnail_path": thumbnail_path,
        "dominant_colors": dominant_colors,
        "category": category,
        "subcategory": subcategory,
    }


def _guess_category(filename: str) -> Optional[str]:
    """Heuristic: guess clothing category from filename keywords."""
    name_lower = filename.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if kw in name_lower:
                return category
    return None
