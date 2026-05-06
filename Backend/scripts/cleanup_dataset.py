import os
import shutil
from pathlib import Path

# Paths
UPLOADS_DIR = "app/storage/uploads"
THUMBNAILS_DIR = "app/storage/thumbnails"
LIMIT = 15

def cleanup_dataset():
    uploads_path = Path(UPLOADS_DIR)
    
    if not uploads_path.exists():
        print(f"Directory {UPLOADS_DIR} does not exist.")
        return

    total_deleted = 0
    total_renamed = 0

    print(f"Cleaning up {UPLOADS_DIR} to keep only {LIMIT} images per folder...")

    for folder in sorted(uploads_path.iterdir()):
        if not folder.is_dir() or folder.name.startswith("."):
            continue

        images = sorted(
            p for p in folder.iterdir()
            if p.is_file() and p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
        )

        print(f"\nProcessing folder: {folder.name} (Found {len(images)} images)")

        # 1. Keep the first LIMIT images
        to_keep = images[:LIMIT]
        to_delete = images[LIMIT:]

        # 2. Delete the rest
        for img_path in to_delete:
            try:
                img_path.unlink()
                total_deleted += 1
            except Exception as e:
                print(f"Failed to delete {img_path}: {e}")

        # 3. Rename the kept images to <folder_name_lower>_XX.ext
        folder_prefix = folder.name.lower()
        for idx, img_path in enumerate(to_keep, start=1):
            ext = img_path.suffix.lower()
            new_name = f"{folder_prefix}_{idx:02d}{ext}"
            new_path = folder / new_name

            # Avoid renaming to the exact same name or overwriting existing (if running multiple times)
            if img_path != new_path:
                # If new_path already exists (e.g. from a previous run), we need to be careful.
                # Since we are renaming the kept set, we can just use an intermediate temp name if needed, 
                # but let's assume it's a clean run.
                if not new_path.exists():
                    img_path.rename(new_path)
                    total_renamed += 1
                else:
                    # If it already matches the pattern, skip
                    if img_path.name == new_name:
                        continue
                    # Just skip if target exists to avoid data loss
                    print(f"  Warning: {new_path.name} already exists. Skipping rename for {img_path.name}.")

    print("\n" + "="*50)
    print(f"Cleanup Complete!")
    print(f"Total deleted : {total_deleted}")
    print(f"Total renamed : {total_renamed}")
    print("="*50)

    # Optional: Clear all thumbnails so they are regenerated with new names
    print("\nClearing old thumbnails...")
    thumbs_path = Path(THUMBNAILS_DIR)
    if thumbs_path.exists():
        for thumb in thumbs_path.iterdir():
            if thumb.is_file():
                thumb.unlink()
        print(f"Cleared thumbnails in {THUMBNAILS_DIR}.")

    print("\nNOTE: Because file paths have changed, you must run the seed_catalogue script again!")
    print("Run: python -m scripts.seed_catalogue")

if __name__ == "__main__":
    cleanup_dataset()
