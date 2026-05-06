"""
MongoDB ObjectId helpers shared across routes.
"""
from bson import ObjectId
from typing import Any


def to_str_id(doc: dict | None) -> dict | None:
    """Convert MongoDB _id ObjectId to a string 'id' field."""
    if doc is None:
        return None
    doc = dict(doc)
    if "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc


def to_object_id(id_str: str) -> ObjectId:
    """Convert a string to ObjectId, raising ValueError on bad format."""
    try:
        return ObjectId(id_str)
    except Exception:
        raise ValueError(f"Invalid id: {id_str}")
