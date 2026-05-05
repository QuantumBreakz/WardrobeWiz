"""
Rule-based outfit matching logic.

Defines which clothing categories are required/optional per outfit,
and how to assign roles to retrieved wardrobe items.
"""
from typing import Dict, List, Optional

# ── Category Taxonomy ─────────────────────────────────────────────────────────

CATEGORY_ROLES = {
    "tops": "top",
    "shirts": "top",
    "blouses": "top",
    "t-shirts": "top",
    "sweaters": "top",
    "jackets": "outer",
    "coats": "outer",
    "blazers": "outer",
    "bottoms": "bottom",
    "pants": "bottom",
    "jeans": "bottom",
    "trousers": "bottom",
    "skirts": "bottom",
    "shorts": "bottom",
    "dresses": "dress",
    "jumpsuits": "dress",
    "shoes": "shoes",
    "sneakers": "shoes",
    "boots": "shoes",
    "heels": "shoes",
    "sandals": "shoes",
    "accessories": "accessory",
    "bags": "accessory",
    "scarves": "accessory",
    "hats": "accessory",
    "belts": "accessory",
    "watches": "accessory",
    "jewellery": "accessory",
}

# ── Outfit Blueprint ──────────────────────────────────────────────────────────
# Each blueprint is a list of roles in priority order.
# "required" roles must be present for a valid outfit.

OUTFIT_BLUEPRINTS = {
    "casual": {
        "required": ["top", "bottom"],
        "optional": ["outer", "shoes", "accessory"],
    },
    "formal": {
        "required": ["top", "bottom", "shoes"],
        "optional": ["outer", "accessory"],
    },
    "smart_casual": {
        "required": ["top", "bottom"],
        "optional": ["outer", "shoes", "accessory"],
    },
    "party": {
        "required": ["top", "bottom"],
        "optional": ["outer", "shoes", "accessory"],
    },
    "sport": {
        "required": ["top", "bottom", "shoes"],
        "optional": ["accessory"],
    },
    "default": {
        "required": ["top", "bottom"],
        "optional": ["shoes", "outer", "accessory"],
    },
}

# ── Season → Tag mapping ──────────────────────────────────────────────────────

SEASON_KEYWORDS = {
    "summer": ["summer", "light", "beach", "tropical", "hot"],
    "winter": ["winter", "warm", "cozy", "heavy", "cold", "wool"],
    "spring": ["spring", "floral", "fresh", "pastel"],
    "autumn": ["autumn", "fall", "earthy", "layered"],
}

# ── Occasion keywords ─────────────────────────────────────────────────────────

OCCASION_KEYWORDS = {
    "casual": ["casual", "everyday", "relaxed", "weekend", "day out"],
    "formal": ["formal", "business", "office", "professional", "meeting"],
    "party": ["party", "night out", "club", "evening", "celebration"],
    "sport": ["sport", "gym", "workout", "exercise", "athletic", "running"],
    "date": ["date", "romantic", "dinner", "evening"],
    "beach": ["beach", "pool", "summer", "vacation"],
}


def get_role(category: Optional[str]) -> str:
    """Map a clothing category string to an outfit role."""
    if not category:
        return "accessory"
    return CATEGORY_ROLES.get(category.lower().strip(), "accessory")


def get_blueprint(occasion: Optional[str]) -> Dict:
    """Return the outfit blueprint for a given occasion."""
    if not occasion:
        return OUTFIT_BLUEPRINTS["default"]
    key = occasion.lower().strip().replace(" ", "_")
    return OUTFIT_BLUEPRINTS.get(key, OUTFIT_BLUEPRINTS["default"])


def items_satisfy_blueprint(role_map: Dict[str, List], occasion: Optional[str]) -> bool:
    """Check if the collected roles satisfy the required roles for an occasion."""
    blueprint = get_blueprint(occasion)
    for required_role in blueprint["required"]:
        # dresses can substitute for top+bottom
        if required_role in ("top", "bottom") and role_map.get("dress"):
            continue
        if not role_map.get(required_role):
            return False
    return True


def build_explanation(roles: Dict[str, dict], occasion: Optional[str], mood: Optional[str]) -> str:
    """Generate a human-readable explanation for the outfit combination."""
    parts = []
    if occasion:
        parts.append(f"Perfect for a {occasion} occasion")
    if mood:
        parts.append(f"with a {mood} vibe")

    item_descs = []
    for role, item in roles.items():
        colors = item.get("dominant_colors") or []
        color_str = " & ".join(colors[:2]) if colors else ""
        cat = item.get("category") or role
        if color_str:
            item_descs.append(f"{color_str} {cat}")
        else:
            item_descs.append(cat)

    if item_descs:
        parts.append("featuring " + ", ".join(item_descs))

    return ". ".join(parts).capitalize() + "." if parts else "A stylish outfit combination."
