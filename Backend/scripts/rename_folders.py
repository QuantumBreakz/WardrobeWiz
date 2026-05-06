import os
from pathlib import Path

# Mapping from Indonesian folder names to English folder names
FOLDER_MAP = {
    "Blazer": "blazers",
    "Celana_Panjang": "trousers",
    "Celana_Pendek": "shorts",
    "Gaun": "dresses",
    "Hoodie": "hoodies",
    "Jaket": "jackets",
    "Jaket_Denim": "denim_jackets",
    "Jaket_Olahraga": "sports_jackets",
    "Jeans": "jeans",
    "Kaos": "t_shirts",
    "Kemeja": "shirts",
    "Mantel": "coats",
    "Polo": "polo_shirts",
    "Rok": "skirts",
    "Sweter": "sweaters",
}

UPLOADS_DIR = "app/storage/uploads"

def rename_all():
    uploads_path = Path(UPLOADS_DIR)
    
    if not uploads_path.exists():
        print(f"Directory {UPLOADS_DIR} does not exist.")
        return

    # First, rename files inside the existing Indonesian folders
    for indo_name, eng_name in FOLDER_MAP.items():
        indo_dir = uploads_path / indo_name
        if not indo_dir.exists():
            print(f"Skipping {indo_name} (not found)")
            continue
            
        print(f"Processing {indo_name} -> {eng_name}")
        
        # Rename files inside the folder first
        for idx, img_path in enumerate(sorted(indo_dir.iterdir())):
            if img_path.is_file() and img_path.name != ".DS_Store":
                ext = img_path.suffix.lower()
                # Create the new filename like denim_jackets_01.jpg
                new_name = f"{eng_name}_{idx+1:02d}{ext}"
                new_path = indo_dir / new_name
                
                if img_path != new_path:
                    try:
                        img_path.rename(new_path)
                    except Exception as e:
                        print(f"  Error renaming {img_path.name}: {e}")
        
        # Rename the folder itself
        eng_dir = uploads_path / eng_name
        if indo_dir != eng_dir:
            try:
                indo_dir.rename(eng_dir)
                print(f"  Renamed folder to {eng_name}")
            except Exception as e:
                print(f"  Error renaming folder {indo_dir}: {e}")

if __name__ == "__main__":
    rename_all()
