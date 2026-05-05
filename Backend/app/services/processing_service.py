import logging
import os
from PIL import Image
try:
    from rembg import remove
except ImportError:
    remove = None

logger = logging.getLogger(__name__)


def process_image(image_path: str) -> dict:
    """
    Removes the background from the image using rembg and overwrites
    the original file with a transparent PNG.
    """
    if remove is None:
        logger.warning("rembg is not installed. Skipping background removal.")
        return {"status": "skipped", "message": "rembg not installed"}

    try:
        logger.info(f"Removing background for {image_path}")
        with open(image_path, "rb") as i:
            input_bytes = i.read()
            
        output_bytes = remove(input_bytes)
        
        with open(image_path, "wb") as o:
            o.write(output_bytes)
            
        return {
            "status": "processed",
            "message": "Background removed successfully",
        }
    except Exception as e:
        logger.error(f"Background removal failed for {image_path}: {e}")
        return {
            "status": "error",
            "message": str(e),
        }
