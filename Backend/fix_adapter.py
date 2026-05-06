import re

with open('app/api/routes/adapter.py', 'r') as f:
    content = f.read()

# Add imports
imports = """
from app.core.dependencies import get_current_user
from app.models.user import User
"""
if "from app.core.dependencies import get_current_user" not in content:
    content = content.replace("from app.core.database import get_db", imports.strip() + "\nfrom app.core.database import get_db")

# 1. Fix _process_file_bytes
content = content.replace(
    "def _process_file_bytes(file_bytes: bytes, filename: str, notes: str, db: Session) -> Dict[str, Any]:",
    "def _process_file_bytes(file_bytes: bytes, filename: str, notes: str, db: Session, user_id: int) -> Dict[str, Any]:"
)
content = content.replace("user_id=DEFAULT_USER_ID", "user_id=user_id", 1) # First occurrence inside _process_file_bytes
content = content.replace("added = add_embedding(settings.faiss_dir, DEFAULT_USER_ID, item.id, embedding)",
                          "added = add_embedding(settings.faiss_dir, user_id, item.id, embedding)")

# 2. Fix get_wardrobe_stats
content = re.sub(
    r'def get_wardrobe_stats\(db: Session = Depends\(get_db\)\):',
    r'def get_wardrobe_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):',
    content
)
content = content.replace("DEFAULT_USER_ID", "current_user.id", 1) # in get_wardrobe_stats

# 3. Fix list_wardrobe
content = re.sub(
    r'db: Session = Depends\(get_db\),\n\):',
    r'db: Session = Depends(get_db),\n    current_user: User = Depends(get_current_user),\n):',
    content, count=1 # list_wardrobe
)
content = content.replace("DEFAULT_USER_ID", "current_user.id", 1) # in list_wardrobe

# 4. Fix upload_wardrobe_item_api
content = re.sub(
    r'db: Session = Depends\(get_db\),\n\):',
    r'db: Session = Depends(get_db),\n    current_user: User = Depends(get_current_user),\n):',
    content, count=1 # upload_wardrobe_item_api
)
content = content.replace(
    "return _process_file_bytes(file_bytes, filename, notes, db)",
    "return _process_file_bytes(file_bytes, filename, notes, db, current_user.id)"
)

# 5. Fix create_wardrobe_item_api
content = re.sub(
    r'def create_wardrobe_item_api\(payload: Dict\[str, Any\], db: Session = Depends\(get_db\)\):',
    r'def create_wardrobe_item_api(payload: Dict[str, Any], db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):',
    content
)
content = content.replace("DEFAULT_USER_ID", "current_user.id", 1) # user_id=current_user.id

# 6. Fix get_wardrobe_item_api
content = re.sub(
    r'def get_wardrobe_item_api\(item_id: int, db: Session = Depends\(get_db\)\):',
    r'def get_wardrobe_item_api(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):',
    content
)
content = content.replace("DEFAULT_USER_ID", "current_user.id", 1) # item.user_id != DEFAULT_USER_ID

# 7. Fix update_wardrobe_item_api
content = re.sub(
    r'def update_wardrobe_item_api\(item_id: int, payload: Dict\[str, Any\], db: Session = Depends\(get_db\)\):',
    r'def update_wardrobe_item_api(item_id: int, payload: Dict[str, Any], db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):',
    content
)
content = content.replace("DEFAULT_USER_ID", "current_user.id", 1) # item.user_id != DEFAULT_USER_ID

# 8. Fix delete_wardrobe_item_api
content = re.sub(
    r'def delete_wardrobe_item_api\(item_id: int, db: Session = Depends\(get_db\)\):',
    r'def delete_wardrobe_item_api(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):',
    content
)
content = content.replace("DEFAULT_USER_ID", "current_user.id", 1) # item.user_id != DEFAULT_USER_ID
content = content.replace("remove_embedding(settings.faiss_dir, DEFAULT_USER_ID, item_id)", "remove_embedding(settings.faiss_dir, current_user.id, item_id)")

# 9. Fix mark_item_worn
content = re.sub(
    r'def mark_item_worn\(item_id: int, db: Session = Depends\(get_db\)\):',
    r'def mark_item_worn(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):',
    content
)
content = content.replace("DEFAULT_USER_ID", "current_user.id", 1) # item.user_id != DEFAULT_USER_ID

# 10. Fix generate_outfit_api
content = re.sub(
    r'def generate_outfit_api\(payload: Dict\[str, Any\], db: Session = Depends\(get_db\)\):',
    r'def generate_outfit_api(payload: Dict[str, Any], db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):',
    content
)
content = content.replace("DEFAULT_USER_ID", "current_user.id", 1) # user_id=DEFAULT_USER_ID

# 11. Fix get_saved_outfits
content = re.sub(
    r'def get_saved_outfits\(db: Session = Depends\(get_db\)\):',
    r'def get_saved_outfits(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):',
    content
)
content = content.replace("DEFAULT_USER_ID", "current_user.id", 1) # get_outfit_history(..., DEFAULT_USER_ID, ...)

# 12. Fix get_outfit_api
content = re.sub(
    r'def get_outfit_api\(outfit_id: int, db: Session = Depends\(get_db\)\):',
    r'def get_outfit_api(outfit_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):',
    content
)

# 13. Fix get_outfit_alternatives_api
content = re.sub(
    r'def get_outfit_alternatives_api\(outfit_id: int, db: Session = Depends\(get_db\)\):',
    r'def get_outfit_alternatives_api(outfit_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):',
    content
)
content = content.replace("DEFAULT_USER_ID", "current_user.id", 1) # user_id=DEFAULT_USER_ID

# 14. Fix save_outfit_api
content = re.sub(
    r'def save_outfit_api\(outfit_id: int, db: Session = Depends\(get_db\)\):',
    r'def save_outfit_api(outfit_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):',
    content
)

# 15. Fix unsave_outfit_api
content = re.sub(
    r'def unsave_outfit_api\(outfit_id: int, db: Session = Depends\(get_db\)\):',
    r'def unsave_outfit_api(outfit_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):',
    content
)

# 16. Fix _store_outfit_feedback
content = content.replace(
    "def _store_outfit_feedback(payload: Dict[str, Any], db: Session):",
    "def _store_outfit_feedback(payload: Dict[str, Any], db: Session, user_id: int):"
)
content = content.replace("user_id=DEFAULT_USER_ID", "user_id=user_id", 1) # FeedbackCreate(user_id=DEFAULT_USER_ID...)

# 17. Fix submit_feedback_api
content = re.sub(
    r'def submit_feedback_api\(payload: Dict\[str, Any\], db: Session = Depends\(get_db\)\):',
    r'def submit_feedback_api(payload: Dict[str, Any], db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):',
    content
)
content = content.replace("_store_outfit_feedback(payload, db)", "_store_outfit_feedback(payload, db, current_user.id)", 1)

# 18. Fix get_feedback_history
content = re.sub(
    r'def get_feedback_history\(limit: int = 50, db: Session = Depends\(get_db\)\):',
    r'def get_feedback_history(limit: int = 50, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):',
    content
)
content = content.replace("DEFAULT_USER_ID", "current_user.id", 1)

# 19. Fix update_feedback_api
content = re.sub(
    r'def update_feedback_api\(outfit_id: int, payload: Dict\[str, Any\], db: Session = Depends\(get_db\)\):',
    r'def update_feedback_api(outfit_id: int, payload: Dict[str, Any], db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):',
    content
)
content = content.replace("_store_outfit_feedback({**payload, \"outfitId\": outfit_id}, db)", "_store_outfit_feedback({**payload, \"outfitId\": outfit_id}, db, current_user.id)", 1)

# 20. Fix outfit_feedback_api
content = re.sub(
    r'def outfit_feedback_api\(payload: Dict\[str, Any\], db: Session = Depends\(get_db\)\):',
    r'def outfit_feedback_api(payload: Dict[str, Any], db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):',
    content
)
content = content.replace("_store_outfit_feedback(payload, db)", "_store_outfit_feedback(payload, db, current_user.id)", 1)

# 21. Fix upload_image_api
content = re.sub(
    r'db: Session = Depends\(get_db\),\n\):',
    r'db: Session = Depends(get_db),\n    current_user: User = Depends(get_current_user),\n):',
    content, count=1 # upload_image_api
)
content = content.replace(
    "return _process_file_bytes(file_bytes, file.filename or \"upload.jpg\", meta.get(\"notes\", \"\"), db)",
    "return _process_file_bytes(file_bytes, file.filename or \"upload.jpg\", meta.get(\"notes\", \"\"), db, current_user.id)"
)

# 22. Fix upload_batch_api
content = re.sub(
    r'db: Session = Depends\(get_db\),\n\):',
    r'db: Session = Depends(get_db),\n    current_user: User = Depends(get_current_user),\n):',
    content, count=1 # upload_batch_api
)
content = content.replace(
    "item = _process_file_bytes(file_bytes, filename, \"\", db)",
    "item = _process_file_bytes(file_bytes, filename, \"\", db, current_user.id)"
)

with open('app/api/routes/adapter.py', 'w') as f:
    f.write(content)
print("Updated adapter.py")
