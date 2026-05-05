from app.core.config import settings
from app.core.database import get_db
from app.schemas.wardrobe import (
    WardrobeItemResponse,
    WardrobeItemUpdate,
    WardrobeListResponse,
)
from app.services import wardrobe_service
from app.services.embedding_service import get_image_embedding
from app.services.faiss_service import add_embedding, remove_embedding
from app.services.image_service import classify_category_from_image, process_upload
from app.services.profile_service import get_user
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

router = APIRouter()


@router.post(
    "/upload", response_model=WardrobeItemResponse, status_code=status.HTTP_201_CREATED
)
async def upload_wardrobe_item(
    user_id: int = Form(...),
    notes: str = Form(default=""),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

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

    # Create DB record first to get item ID
    item = wardrobe_service.create_wardrobe_item(
        db=db,
        user_id=user_id,
        image_path=upload_result["image_path"],
        thumbnail_path=upload_result["thumbnail_path"],
        category=upload_result["category"],
        subcategory=upload_result["subcategory"],
        dominant_colors=upload_result["dominant_colors"],
    )

    # Generate CLIP embedding and add to FAISS
    embedding = get_image_embedding(upload_result["image_path"])
    if embedding:
        added = add_embedding(
            faiss_dir=settings.faiss_dir,
            user_id=user_id,
            item_id=item.id,
            embedding=embedding,
        )
        if added:
            # Store the item_id as embedding_id for traceability
            item.embedding_id = str(item.id)
            db.commit()
            db.refresh(item)

    if notes:
        item.notes = notes
        db.commit()
        db.refresh(item)

    data = wardrobe_service.serialize_item(item)
    return WardrobeItemResponse(**data)


@router.get("/{user_id}", response_model=WardrobeListResponse)
def list_wardrobe(
    user_id: int,
    category: str = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    items = wardrobe_service.get_user_items(
        db, user_id, category=category, skip=skip, limit=limit
    )
    total = wardrobe_service.count_user_items(db, user_id)
    serialized = [
        WardrobeItemResponse(**wardrobe_service.serialize_item(i)) for i in items
    ]
    return WardrobeListResponse(items=serialized, total=total)


@router.get("/item/{item_id}", response_model=WardrobeItemResponse)
def get_wardrobe_item(item_id: int, db: Session = Depends(get_db)):
    item = wardrobe_service.get_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Wardrobe item not found")
    data = wardrobe_service.serialize_item(item)
    return WardrobeItemResponse(**data)


@router.put("/item/{item_id}", response_model=WardrobeItemResponse)
def update_wardrobe_item(
    item_id: int,
    payload: WardrobeItemUpdate,
    db: Session = Depends(get_db),
):
    item = wardrobe_service.update_item(db, item_id, payload)
    if not item:
        raise HTTPException(status_code=404, detail="Wardrobe item not found")
    data = wardrobe_service.serialize_item(item)
    return WardrobeItemResponse(**data)


@router.post("/reclassify/{user_id}")
def reclassify_wardrobe_items(user_id: int, db: Session = Depends(get_db)):
    """Re-run CLIP classification on all wardrobe items that are missing a category."""
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    items = wardrobe_service.get_user_items(db, user_id, limit=1000)
    updated = 0
    for item in items:
        if item.category:
            continue
        category, subcategory = classify_category_from_image(item.image_path)
        if category:
            item.category = category
            item.subcategory = subcategory
            updated += 1

    db.commit()
    return {"reclassified": updated, "total": len(items)}


@router.delete("/item/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_wardrobe_item(item_id: int, db: Session = Depends(get_db)):
    item = wardrobe_service.get_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Wardrobe item not found")

    user_id = item.user_id
    wardrobe_service.delete_item(db, item_id)
    remove_embedding(faiss_dir=settings.faiss_dir, user_id=user_id, item_id=item_id)
