"""
CLIP-based embedding service.

Uses open_clip to generate 512-dim embeddings for images and text queries.
The model is loaded once as a module-level singleton to avoid repeated
expensive initialisation across requests.
"""
import logging
from typing import List, Optional

import numpy as np
try:
    import torch
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

logger = logging.getLogger(__name__)

_model = None
_preprocess = None
_tokenizer = None
_device = "cpu"

if HAS_TORCH:
    _device = "cuda" if torch.cuda.is_available() else "cpu"


def _load_model():
    global _model, _preprocess, _tokenizer, _device
    if _model is not None:
        return

    try:
        if not HAS_TORCH:
            raise ImportError("PyTorch not installed")

        import open_clip

        _model, _, _preprocess = open_clip.create_model_and_transforms(
            "ViT-B-32", pretrained="openai", device=_device
        )
        _tokenizer = open_clip.get_tokenizer("ViT-B-32")
        _model.eval()
        logger.info(f"CLIP model loaded on {_device}")
    except Exception as e:
        logger.warning(f"Could not load CLIP model: {e}. Falling back to random embeddings.")
        _model = None


def get_image_embedding(image_path: str) -> Optional[List[float]]:
    """Generate a CLIP embedding for an image file. Returns a 512-dim float list."""
    _load_model()

    if _model is None:
        # Fallback: return deterministic random vector based on path hash
        rng = np.random.default_rng(abs(hash(image_path)) % (2**31))
        vec = rng.random(512).astype(np.float32)
        vec = vec / (np.linalg.norm(vec) + 1e-8)
        return vec.tolist()

    try:
        from PIL import Image
        img = Image.open(image_path).convert("RGBA")
        background = Image.new("RGBA", img.size, (255, 255, 255, 255))
        img = Image.alpha_composite(background, img).convert("RGB")
        img_tensor = _preprocess(img).unsqueeze(0).to(_device)

        with torch.no_grad():
            features = _model.encode_image(img_tensor)
            features = features / features.norm(dim=-1, keepdim=True)

        return features.squeeze(0).cpu().tolist()
    except Exception as e:
        logger.error(f"Image embedding failed for {image_path}: {e}")
        return None


def get_text_embedding(text: str) -> Optional[List[float]]:
    """Generate a CLIP embedding for a text query. Returns a 512-dim float list."""
    _load_model()

    if _model is None:
        rng = np.random.default_rng(abs(hash(text)) % (2**31))
        vec = rng.random(512).astype(np.float32)
        vec = vec / (np.linalg.norm(vec) + 1e-8)
        return vec.tolist()

    try:
        tokens = _tokenizer([text]).to(_device)

        with torch.no_grad():
            features = _model.encode_text(tokens)
            features = features / features.norm(dim=-1, keepdim=True)

        return features.squeeze(0).cpu().tolist()
    except Exception as e:
        logger.error(f"Text embedding failed for '{text}': {e}")
        return None
