import json
from typing import List, Tuple

from PIL import Image


# Basic named-color palette for matching
COLOR_PALETTE = {
    "black": (0, 0, 0),
    "white": (255, 255, 255),
    "gray": (128, 128, 128),
    "red": (220, 20, 20),
    "pink": (255, 105, 180),
    "orange": (255, 140, 0),
    "yellow": (255, 215, 0),
    "green": (34, 139, 34),
    "teal": (0, 128, 128),
    "blue": (30, 144, 255),
    "navy": (0, 0, 128),
    "purple": (128, 0, 128),
    "lavender": (230, 190, 255),
    "brown": (139, 69, 19),
    "beige": (245, 245, 220),
    "cream": (255, 253, 208),
    "maroon": (128, 0, 0),
    "olive": (128, 128, 0),
    "coral": (255, 127, 80),
    "gold": (255, 215, 0),
}

# Compatibility map: which colors go well together
COLOR_COMPATIBILITY = {
    "black": ["white", "gray", "red", "blue", "green", "yellow", "pink", "purple", "beige", "cream", "gold"],
    "white": ["black", "gray", "navy", "blue", "red", "green", "brown", "beige"],
    "gray": ["black", "white", "navy", "blue", "pink", "purple", "red"],
    "navy": ["white", "gray", "beige", "cream", "red", "pink", "orange", "gold"],
    "blue": ["white", "gray", "beige", "brown", "navy", "orange", "yellow"],
    "beige": ["black", "white", "navy", "brown", "olive", "teal", "burgundy"],
    "brown": ["beige", "cream", "white", "orange", "olive", "teal"],
    "red": ["black", "white", "gray", "navy", "beige", "cream"],
    "green": ["white", "beige", "brown", "navy", "cream", "olive"],
    "olive": ["beige", "brown", "cream", "white", "black"],
    "pink": ["gray", "black", "white", "navy", "lavender"],
    "purple": ["gray", "black", "white", "lavender", "pink"],
    "orange": ["navy", "brown", "white", "black", "blue"],
    "yellow": ["black", "navy", "white", "gray", "blue"],
    "teal": ["white", "beige", "brown", "black", "gray"],
    "cream": ["navy", "brown", "black", "olive", "teal", "burgundy"],
}


def _color_distance(c1: Tuple[int, int, int], c2: Tuple[int, int, int]) -> float:
    return ((c1[0] - c2[0]) ** 2 + (c1[1] - c2[1]) ** 2 + (c1[2] - c2[2]) ** 2) ** 0.5


def rgb_to_name(rgb: Tuple[int, int, int]) -> str:
    """Map an RGB tuple to the nearest named color."""
    best_name = "black"
    best_dist = float("inf")
    for name, palette_rgb in COLOR_PALETTE.items():
        dist = _color_distance(rgb, palette_rgb)
        if dist < best_dist:
            best_dist = dist
            best_name = name
    return best_name


def extract_dominant_colors(image: Image.Image, n_colors: int = 3) -> List[str]:
    """Extract the top N dominant colors from an image as named colors."""
    img = image.convert("RGBA").resize((100, 100))
    pixels = list(img.getdata())

    # Simple binning: quantize each channel to 8 buckets of 32
    buckets: dict = {}
    for r, g, b, a in pixels:
        if a < 10:  # Skip fully or mostly transparent pixels
            continue
        key = (r // 32 * 32, g // 32 * 32, b // 32 * 32)
        buckets[key] = buckets.get(key, 0) + 1

    top = sorted(buckets.items(), key=lambda x: x[1], reverse=True)[:n_colors * 3]

    # Deduplicate by named color
    seen: dict = {}
    for rgb, count in top:
        name = rgb_to_name(rgb)
        seen[name] = seen.get(name, 0) + count

    ordered = sorted(seen.items(), key=lambda x: x[1], reverse=True)
    return [name for name, _ in ordered[:n_colors]]


def are_colors_compatible(color1: str, color2: str) -> bool:
    """Check if two named colors are considered compatible."""
    c1 = color1.lower()
    c2 = color2.lower()
    if c1 == c2:
        return True
    compatible = COLOR_COMPATIBILITY.get(c1, [])
    return c2 in compatible


def get_outfit_color_score(colors_list: List[List[str]]) -> float:
    """
    Given a list of dominant color lists (one per item), return a 0-1
    compatibility score for the whole outfit.
    """
    if len(colors_list) < 2:
        return 1.0

    pairs = 0
    compatible_pairs = 0
    for i in range(len(colors_list)):
        for j in range(i + 1, len(colors_list)):
            for c1 in (colors_list[i] or []):
                for c2 in (colors_list[j] or []):
                    pairs += 1
                    if are_colors_compatible(c1, c2):
                        compatible_pairs += 1

    if pairs == 0:
        return 0.5
    return compatible_pairs / pairs
