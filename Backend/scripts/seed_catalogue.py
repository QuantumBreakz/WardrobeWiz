"""
scripts/seed_catalogue.py
=========================
Trims every category in uploads/ to the first 15 images, then seeds
MongoDB wardrobe_items (user_id="catalogue") and rebuilds the shared
FAISS catalogue index so outfit retrieval has data to work with.

Run from the Backend directory:
    python -m scripts.seed_catalogue

Flags:
    --dry-run   Print what would happen without touching the DB or FAISS.
    --limit N   Override the default cap of 15 images per category.
"""
import argparse
import asyncio
import logging
import os
import sys
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# ── Bootstrap: ensure project root is on sys.path ─────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# Prevent OpenMP duplicate-lib crash (FAISS + Torch on macOS)
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-8s %(name)s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("seed_catalogue")

# ── Category mapping: English folder name → English key used in app ─────────
#   English keys must match those in image_service.py CATEGORY_MAP
FOLDER_TO_CATEGORY: Dict[str, str] = {
    "blazers": "jackets",
    "trousers": "bottoms",
    "shorts": "bottoms",
    "dresses": "dresses",
    "hoodies": "tops",
    "jackets": "jackets",
    "denim_jackets": "jackets",
    "sports_jackets": "jackets",
    "jeans": "bottoms",
    "t_shirts": "tops",
    "shirts": "tops",
    "coats": "jackets",
    "polo_shirts": "tops",
    "skirts": "bottoms",
    "sweaters": "tops",
    "formal_pants": "bottoms",
    "formal_shirts": "tops",
    "suits": "jackets",
}

# More granular subcategory per folder
FOLDER_TO_SUBCATEGORY: Dict[str, str] = {
    "blazers": "blazers",
    "trousers": "trousers",
    "shorts": "shorts",
    "dresses": "dresses",
    "hoodies": "sweaters",
    "jackets": "jackets",
    "denim_jackets": "jackets",
    "sports_jackets": "jackets",
    "jeans": "jeans",
    "t_shirts": "t-shirts",
    "shirts": "shirts",
    "coats": "coats",
    "polo_shirts": "shirts",
    "skirts": "skirts",
    "sweaters": "sweaters",
    "formal_pants": "trousers",
    "formal_shirts": "shirts",
    "suits": "suits",
}

# Permanent virtual user_id for catalogue items
CATALOGUE_USER_ID = "catalogue"

# ── Core seed logic ────────────────────────────────────────────────────────────

def _collect_images(upload_dir: str, limit: int) -> Dict[str, List[Path]]:
    """Return {folder_name: [first `limit` image paths]}."""
    result: Dict[str, List[Path]] = {}
    upload_path = Path(upload_dir)

    for folder in sorted(upload_path.iterdir()):
        if not folder.is_dir() or folder.name.startswith("."):
            continue
        if folder.name not in FOLDER_TO_CATEGORY:
            logger.warning("Unknown folder '%s' — skipping", folder.name)
            continue

        images = sorted(
            p for p in folder.iterdir()
            if p.is_file() and p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
        )
        result[folder.name] = images[:limit]
        logger.info("  %s → %d images selected (of %d)", folder.name, len(result[folder.name]), len(images))

    return result


async def _upsert_catalogue_item(
    db,
    folder_name: str,
    image_path: str,
    thumbnail_path: Optional[str],
    dominant_colors: List[str],
    faiss_key: int,
) -> str:
    """Insert or update a catalogue wardrobe item. Returns the MongoDB _id string."""
    import time as _time
    category = FOLDER_TO_CATEGORY[folder_name]
    subcategory = FOLDER_TO_SUBCATEGORY[folder_name]

    doc = {
        "user_id": CATALOGUE_USER_ID,
        "catalogue_item": True,
        "folder_name": folder_name,
        "image_path": image_path,
        "thumbnail_path": thumbnail_path,
        "category": category,
        "subcategory": subcategory,
        "dominant_colors": dominant_colors,
        "pattern_tags": [],
        "occasion_tags": [],
        "season_tags": [],
        "embedding_id": str(faiss_key),
        "notes": None,
        "created_at": _time.time(),
        "updated_at": _time.time(),
    }

    # Upsert on image_path so re-runs are idempotent
    result = await db["wardrobe_items"].update_one(
        {"user_id": CATALOGUE_USER_ID, "image_path": image_path},
        {"$set": doc},
        upsert=True,
    )
    if result.upserted_id:
        return str(result.upserted_id)
    # Fetch existing _id
    existing = await db["wardrobe_items"].find_one(
        {"user_id": CATALOGUE_USER_ID, "image_path": image_path},
        {"_id": 1},
    )
    return str(existing["_id"]) if existing else ""


async def seed(upload_dir: str, thumbnail_dir: str, faiss_dir: str, limit: int, dry_run: bool):
    from app.core.config import settings  # noqa: F401  (validate env)
    from app.core.database import get_database
    from app.services.embedding_service import get_image_embedding
    from app.services.faiss_service import rebuild_index
    from app.utils.color_utils import extract_dominant_colors
    from app.utils.image_utils import create_thumbnail, open_image

    db = get_database()

    logger.info("=" * 60)
    logger.info("WardrobeWiz Catalogue Seeder")
    logger.info("  upload_dir   : %s", upload_dir)
    logger.info("  thumbnail_dir: %s", thumbnail_dir)
    logger.info("  faiss_dir    : %s", faiss_dir)
    logger.info("  limit/folder : %d", limit)
    logger.info("  dry_run      : %s", dry_run)
    logger.info("=" * 60)

    # 1. Collect images
    folder_map = _collect_images(upload_dir, limit)
    total_images = sum(len(v) for v in folder_map.values())
    logger.info("Total images to process: %d across %d categories", total_images, len(folder_map))

    if dry_run:
        logger.info("[DRY RUN] Stopping before DB/FAISS writes.")
        return

    # 2. Clear existing catalogue items from DB (full re-seed)
    deleted = await db["wardrobe_items"].delete_many({"user_id": CATALOGUE_USER_ID})
    logger.info("Cleared %d existing catalogue items from MongoDB", deleted.deleted_count)

    # 3. Process each image
    faiss_items: List[Tuple[int, List[float]]] = []   # (faiss_key, embedding)
    summary: Dict[str, int] = {}
    errors = 0

    for folder_name, image_paths in folder_map.items():
        count = 0
        for img_path in image_paths:
            img_path_str = str(img_path)

            # Thumbnail
            thumb_path = create_thumbnail(img_path_str, thumbnail_dir)

            # Dominant colors
            img_pil = open_image(img_path_str)
            dominant_colors: List[str] = []
            if img_pil:
                dominant_colors = extract_dominant_colors(img_pil, n_colors=3)

            # CLIP embedding
            embedding = get_image_embedding(img_path_str)
            if embedding is None:
                logger.warning("  Embedding failed for %s — skipping", img_path.name)
                errors += 1
                continue

            # FAISS key: stable hash of relative path
            faiss_key = abs(hash(img_path_str)) % (2 ** 31)

            # Upsert MongoDB
            await _upsert_catalogue_item(
                db=db,
                folder_name=folder_name,
                image_path=img_path_str,
                thumbnail_path=thumb_path,
                dominant_colors=dominant_colors,
                faiss_key=faiss_key,
            )

            faiss_items.append((faiss_key, embedding))
            count += 1
            logger.info("  [%s] %d/%d — %s", folder_name, count, len(image_paths), img_path.name)

        summary[folder_name] = count

    # 4. Rebuild FAISS catalogue index
    logger.info("Rebuilding FAISS catalogue index with %d vectors…", len(faiss_items))
    ok = rebuild_index(faiss_dir, CATALOGUE_USER_ID, faiss_items)
    if ok:
        logger.info("✓ FAISS catalogue index saved → %s/catalogue.index", faiss_dir)
    else:
        logger.error("✗ FAISS rebuild failed!")

    # 5. Summary
    logger.info("")
    logger.info("=" * 60)
    logger.info("Seed complete — %d vectors, %d errors", len(faiss_items), errors)
    for folder, cnt in summary.items():
        logger.info("  %-20s  %d items", folder, cnt)
    logger.info("=" * 60)


# ── Entry point ────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Seed WardrobeWiz catalogue")
    parser.add_argument("--dry-run", action="store_true", help="Preview only, no writes")
    parser.add_argument("--limit", type=int, default=15, help="Max images per category (default 15)")
    parser.add_argument("--upload-dir",    default="app/storage/uploads",    help="Path to uploads root")
    parser.add_argument("--thumbnail-dir", default="app/storage/thumbnails", help="Path to thumbnails dir")
    parser.add_argument("--faiss-dir",     default="app/storage/faiss",      help="Path to FAISS dir")
    args = parser.parse_args()

    asyncio.run(seed(
        upload_dir=args.upload_dir,
        thumbnail_dir=args.thumbnail_dir,
        faiss_dir=args.faiss_dir,
        limit=args.limit,
        dry_run=args.dry_run,
    ))


if __name__ == "__main__":
    main()
