import os
import re
import time
import httpx
from pathlib import Path

CATEGORIES = {
    "formal_pants": "formal-pants",
    "formal_shirts": "formal-shirt",
    "suits": "business-suit",
}

UPLOADS_DIR = Path("app/storage/uploads")
LIMIT = 15

def scrape_unsplash():
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    }
    
    with httpx.Client(headers=headers, follow_redirects=True, timeout=15.0) as client:
        for folder_name, query in CATEGORIES.items():
            folder_path = UPLOADS_DIR / folder_name
            folder_path.mkdir(parents=True, exist_ok=True)
            
            print(f"\nScraping '{folder_name}' from Unsplash...")
            
            # Fetch search page
            url = f"https://unsplash.com/s/photos/{query}"
            resp = client.get(url)
            
            if resp.status_code != 200:
                print(f"  Failed to fetch {url} (Status: {resp.status_code})")
                continue
                
            # Extract image URLs using regex
            # Unsplash image URLs look like: https://images.unsplash.com/photo-1234567890-abcdef?crop=...
            # We just want the base url up to the ? or we can keep the query params for small size
            pattern = r'(https://images\.unsplash\.com/photo-[a-zA-Z0-9\-]+)\?([^"]*)'
            matches = re.findall(pattern, resp.text)
            
            # Deduplicate by photo ID
            unique_photos = {}
            for base_url, params in matches:
                if "w=" in params or "ixlib=" in params:
                    # To get a decent size, we'll strip the params and add our own
                    # or just use the raw URL + ?w=800&q=80
                    clean_url = f"{base_url}?w=800&q=80"
                    unique_photos[base_url] = clean_url
                    
            photo_urls = list(unique_photos.values())
            print(f"  Found {len(photo_urls)} unique photos.")
            
            downloaded = 0
            for idx, img_url in enumerate(photo_urls):
                if downloaded >= LIMIT:
                    break
                    
                filename = f"{folder_name}_{downloaded+1:02d}.jpg"
                filepath = folder_path / filename
                
                try:
                    img_resp = client.get(img_url)
                    img_resp.raise_for_status()
                    
                    with open(filepath, "wb") as f:
                        f.write(img_resp.content)
                        
                    downloaded += 1
                    print(f"  Downloaded {filename}")
                    time.sleep(0.5)
                except Exception as e:
                    print(f"  Failed to download {img_url}: {e}")

            print(f"✓ Downloaded {downloaded} images for {folder_name}")

if __name__ == "__main__":
    scrape_unsplash()
