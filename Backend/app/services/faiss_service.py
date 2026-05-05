"""
FAISS vector index service.

Manages a single flat-L2 index stored on disk.  Each wardrobe item's
embedding is added under its DB item_id so we can map search results
back to database rows.
"""
import json
import logging
import os
from typing import Dict, List, Optional, Tuple

import numpy as np

logger = logging.getLogger(__name__)

EMBEDDING_DIM = 512

# Module-level state: one index per user (keyed by user_id)
_indices: Dict[int, object] = {}        # user_id → faiss.IndexFlatL2
_id_maps: Dict[int, List[int]] = {}     # user_id → [wardrobe_item_id, ...]


def _get_index_paths(faiss_dir: str, user_id: int) -> Tuple[str, str]:
    index_path = os.path.join(faiss_dir, f"user_{user_id}.index")
    map_path = os.path.join(faiss_dir, f"user_{user_id}_ids.json")
    return index_path, map_path


def load_index(faiss_dir: str, user_id: int) -> bool:
    """Load a user's FAISS index from disk into memory."""
    try:
        import faiss

        index_path, map_path = _get_index_paths(faiss_dir, user_id)
        if not os.path.exists(index_path) or not os.path.exists(map_path):
            return False

        _indices[user_id] = faiss.read_index(index_path)
        with open(map_path, "r") as f:
            _id_maps[user_id] = json.load(f)
        logger.info(f"Loaded FAISS index for user {user_id} ({_indices[user_id].ntotal} vectors)")
        return True
    except Exception as e:
        logger.error(f"Failed to load FAISS index for user {user_id}: {e}")
        return False


def save_index(faiss_dir: str, user_id: int) -> bool:
    """Persist a user's in-memory index to disk."""
    try:
        import faiss

        os.makedirs(faiss_dir, exist_ok=True)
        index_path, map_path = _get_index_paths(faiss_dir, user_id)

        if user_id not in _indices:
            return False

        faiss.write_index(_indices[user_id], index_path)
        with open(map_path, "w") as f:
            json.dump(_id_maps[user_id], f)
        return True
    except Exception as e:
        logger.error(f"Failed to save FAISS index for user {user_id}: {e}")
        return False


def _ensure_index(user_id: int):
    """Create a new in-memory index for a user if one doesn't exist."""
    if user_id not in _indices:
        try:
            import faiss
            _indices[user_id] = faiss.IndexFlatL2(EMBEDDING_DIM)
            _id_maps[user_id] = []
        except ImportError:
            logger.error("faiss-cpu not installed")
            raise


def add_embedding(
    faiss_dir: str,
    user_id: int,
    item_id: int,
    embedding: List[float],
) -> bool:
    """Add a single embedding to the user's index and persist."""
    try:
        _ensure_index(user_id)
        vec = np.array([embedding], dtype=np.float32)
        _indices[user_id].add(vec)
        _id_maps[user_id].append(item_id)
        save_index(faiss_dir, user_id)
        return True
    except Exception as e:
        logger.error(f"Failed to add embedding for user {user_id}, item {item_id}: {e}")
        return False


def search(
    faiss_dir: str,
    user_id: int,
    query_embedding: List[float],
    top_k: int = 10,
) -> List[int]:
    """
    Search for the top-k nearest wardrobe item IDs for a given query embedding.
    Returns a list of wardrobe_item_ids sorted by similarity (closest first).
    """
    try:
        # Try loading from disk if not in memory
        if user_id not in _indices:
            loaded = load_index(faiss_dir, user_id)
            if not loaded:
                return []

        index = _indices[user_id]
        if index.ntotal == 0:
            return []

        k = min(top_k, index.ntotal)
        vec = np.array([query_embedding], dtype=np.float32)
        distances, indices = index.search(vec, k)

        results = []
        id_map = _id_maps.get(user_id, [])
        for idx in indices[0]:
            if 0 <= idx < len(id_map):
                results.append(id_map[idx])
        return results
    except Exception as e:
        logger.error(f"FAISS search failed for user {user_id}: {e}")
        return []


def remove_embedding(faiss_dir: str, user_id: int, item_id: int) -> bool:
    """
    Remove a single item from a user's FAISS index.

    IndexFlatL2 does not support in-place deletion, so we rebuild the index
    from all remaining vectors and persist it.  The embeddings are preserved
    in the in-memory index until the process restarts; on restart the index
    is reloaded from disk (which already excludes the deleted item).
    """
    try:
        if user_id not in _indices:
            load_index(faiss_dir, user_id)

        if user_id not in _indices:
            return True  # nothing to remove

        id_map = _id_maps.get(user_id, [])
        if item_id not in id_map:
            return True  # already absent

        import faiss

        old_index = _indices[user_id]
        keep_positions = [i for i, iid in enumerate(id_map) if iid != item_id]

        new_index = faiss.IndexFlatL2(EMBEDDING_DIM)
        if keep_positions:
            # Reconstruct kept vectors from the existing index
            all_vecs = np.zeros((old_index.ntotal, EMBEDDING_DIM), dtype=np.float32)
            for pos in range(old_index.ntotal):
                old_index.reconstruct(pos, all_vecs[pos])
            kept_vecs = all_vecs[keep_positions]
            new_index.add(kept_vecs)

        _indices[user_id] = new_index
        _id_maps[user_id] = [id_map[i] for i in keep_positions]
        save_index(faiss_dir, user_id)
        logger.info(f"Removed item {item_id} from FAISS index for user {user_id}")
        return True
    except Exception as e:
        logger.error(f"Failed to remove item {item_id} from FAISS index for user {user_id}: {e}")
        return False


def rebuild_index(faiss_dir: str, user_id: int, items: List[Tuple[int, List[float]]]) -> bool:
    """
    Rebuild a user's index from scratch with a list of (item_id, embedding) pairs.
    Used by the /reindex/faiss endpoint.
    """
    try:
        import faiss

        os.makedirs(faiss_dir, exist_ok=True)
        index = faiss.IndexFlatL2(EMBEDDING_DIM)
        id_map = []

        if items:
            vecs = np.array([emb for _, emb in items], dtype=np.float32)
            index.add(vecs)
            id_map = [item_id for item_id, _ in items]

        _indices[user_id] = index
        _id_maps[user_id] = id_map
        save_index(faiss_dir, user_id)
        logger.info(f"Rebuilt FAISS index for user {user_id} with {len(items)} vectors")
        return True
    except Exception as e:
        logger.error(f"Rebuild failed for user {user_id}: {e}")
        return False
