"""
Wardrobe routes — MongoDB async rewrite.
Primary wardrobe CRUD is handled by adapter.py; this exposes structured endpoints.
"""
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.services import wardrobe_service
from app.services.image_service import process_upload
from app.services.embedding_service import get_image_embedding
from app.services.faiss_service import add_embedding

router = APIRouter()


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_wardrobe_item(
    notes: str = Form(default=""),
    file: UploadFile = File(...),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    file_bytes = await file.read()
    filename = file.filename or "upload.jpg"

    try:
        upload_result = process_upload(
            file_bytes=file_bytes,
            filename=filename,
            upload_dir=settings.upload_dir,
            thumbnail_dir=settings.thumbnail_dir,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    item = await wardrobe_service.create_wardrobe_item(
        db=db,
        user_id=current_user["id"],
        image_path=upload_result["image_path"],
        thumbnail_path=upload_result["thumbnail_path"],
        category=upload_result["category"],
        subcategory=upload_result["subcategory"],
        dominant_colors=upload_result["dominant_colors"],
    )

    embedding = get_image_embedding(upload_result["image_path"])
    if embedding:
        faiss_key = abs(hash(item["id"])) % (2**31)
        added = add_embedding(settings.faiss_dir, current_user["id"], faiss_key, embedding)
        if added:
            await wardrobe_service.update_item(db, item["id"], {"embedding_id": str(faiss_key)})

    if notes:
        await wardrobe_service.update_item(db, item["id"], {"notes": notes})

    return item


@router.get("/")
async def list_wardrobe_items(
    category: str = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    items = await wardrobe_service.get_user_items(db, current_user["id"], category=category, skip=skip, limit=limit)
    total = await wardrobe_service.count_user_items(db, current_user["id"])
    return {"items": items, "total": total}


@router.get("/{item_id}")
async def get_wardrobe_item(
    item_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    item = await wardrobe_service.get_item(db, item_id)
    if not item or item.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_wardrobe_item(
    item_id: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    item = await wardrobe_service.get_item(db, item_id)
    if not item or item.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Item not found")
    await wardrobe_service.delete_item(db, item_id)
