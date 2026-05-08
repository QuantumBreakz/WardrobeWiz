# WardrobeWhiz

An AI-powered personal wardrobe assistant that helps users generate outfit recommendations from their own clothing items using CLIP embeddings, FAISS vector search, and rule-based styling logic — with a full React frontend, Clip Embeddings and models to be made better in future iterations.

---

## Features

- **Wardrobe Upload** — upload clothing images; category and subcategory are auto-detected from image content using CLIP zero-shot classification
- **CLIP Embeddings** — each item is encoded into a 512-dim semantic vector using OpenAI's ViT-B/32 model
- **FAISS Retrieval** — fast k-NN vector search to find relevant items for any query
- **Guided Outfit Generation** — request outfits by occasion, mood, color preference, or free text
- **Surprise Me** — auto-generate random compatible outfit combinations
- **Feedback Loop** — like/dislike/skip/save outfits; preferences re-rank future suggestions automatically
- **Style Profile** — onboarding quiz stores preferred styles, colors, occasions, and Eastern/Western bias
- **React Frontend** — full dashboard UI with wardrobe management, outfit history, analytics, and recommendations

---

## Tech Stack

| Layer | Technology |
|---|---|
| API framework | FastAPI |
| Database | SQLite (via SQLAlchemy) |
| ML embeddings | CLIP (`open_clip_torch`, ViT-B/32) |
| Vector search | FAISS (`faiss-cpu`) |
| Image processing | Pillow |
| Validation | Pydantic v2 |
| Server | Uvicorn |
| Frontend | React 18 + TypeScript + Vite |
| UI components | shadcn/ui + Tailwind CSS |
| State management | TanStack React Query |

---

## Project Structure

```
wardrobewhiz/
├── Backend/
│   └── app/
│       ├── main.py                  # App entry point, CORS, static files, router registration
│       ├── core/
│       │   ├── config.py            # Settings loaded from .env
│       │   └── database.py          # SQLAlchemy engine + session
│       ├── models/                  # SQLAlchemy ORM models
│       │   ├── user.py
│       │   ├── profile.py
│       │   ├── wardrobe_item.py
│       │   ├── outfit.py
│       │   └── feedback.py
│       ├── schemas/                 # Pydantic request/response schemas
│       ├── api/routes/
│       │   ├── adapter.py           # Frontend-facing API bridge (mounted at /api)
│       │   ├── wardrobe.py          # Raw wardrobe endpoints
│       │   ├── outfits.py           # Outfit generation endpoints
│       │   └── feedback.py          # Feedback endpoints
│       ├── services/
│       │   ├── image_service.py     # Upload pipeline: validate → save → thumbnail → CLIP classify
│       │   ├── embedding_service.py # CLIP image/text embeddings
│       │   ├── faiss_service.py     # Per-user FAISS index: add, search, remove, rebuild
│       │   ├── retrieval_service.py # Query → CLIP → FAISS → DB merge → preference re-ranking
│       │   ├── outfit_service.py    # Guided + surprise outfit assembly, history
│       │   ├── wardrobe_service.py  # Wardrobe item CRUD
│       │   └── feedback_service.py  # Feedback storage, preference stat aggregation
│       ├── utils/
│       │   ├── image_utils.py       # Validate, save, thumbnail helpers
│       │   ├── color_utils.py       # Dominant color extraction, compatibility scoring
│       │   └── rules.py             # Category roles, outfit blueprints, explanation builder
│       └── storage/
│           ├── uploads/             # Original uploaded images
│           ├── thumbnails/          # 256×256 JPEG thumbnails
│           └── faiss/               # Per-user FAISS index files
└── Frontend/
    └── src/
        ├── pages/dashboard/         # Wardrobe, Outfits, Recommend, Analytics, Settings
        ├── components/              # Reusable UI components
        ├── hooks/                   # useWardrobe, useOutfitGeneration, useFeedback
        ├── lib/api/                 # Axios API clients (wardrobe, outfit, upload, feedback)
        └── types/                   # TypeScript type definitions
```

---

## How Image Classification Works

When you upload an image, the following pipeline runs automatically:

| Step | Method | Used for |
|---|---|---|
| **Category** | CLIP zero-shot classification against category labels | Outfit role assignment (top / bottom / shoes / etc.) |
| **Subcategory** | CLIP zero-shot classification against subcategory labels | Display type (jeans, sneakers, blazer, etc.) |
| **Colors** | Pixel k-means analysis | Color compatibility scoring between outfit pieces |
| **CLIP embedding** | ViT-B/32 neural network on image content | Similarity search via FAISS |

If CLIP is unavailable (model not downloaded), category falls back to filename keyword matching and embeddings fall back to deterministic random vectors. The app remains functional either way.

To manually fix categories on already-uploaded items:

```
POST /wardrobe/reclassify/{user_id}
```

---

## API Overview

### Frontend API (used by the React app)

All mounted under `/api` — these match the frontend's expected shape.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/wardrobe` | List all wardrobe items |
| POST | `/api/wardrobe/upload` | Upload a single clothing image |
| GET | `/api/wardrobe/stats` | Wardrobe statistics |
| PATCH | `/api/wardrobe/{id}` | Update item metadata |
| DELETE | `/api/wardrobe/{id}` | Delete item |
| POST | `/api/outfit/generate` | Generate outfit from context |
| GET | `/api/outfit/saved` | Get outfit history |
| POST | `/api/upload/batch` | Batch upload clothing images |
| POST | `/api/feedback` | Submit outfit feedback |
| GET | `/api/feedback/history` | Feedback history |

### Raw Backend API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health/` | Server health check |
| POST | `/profiles/users` | Create a user |
| POST | `/wardrobe/upload` | Upload clothing image (with user_id form field) |
| GET | `/wardrobe/{user_id}` | List wardrobe items |
| POST | `/wardrobe/reclassify/{user_id}` | Re-run CLIP classification on items with no category |
| POST | `/outfits/guided` | Generate guided outfit |
| POST | `/outfits/surprise` | Generate surprise outfit |
| GET | `/outfits/history/{user_id}` | Paginated outfit history |
| POST | `/feedback/` | Submit like/dislike/skip/save |

Interactive docs: `http://localhost:8002/docs`

---

## Environment Variables

All settings have defaults — the app runs without a `.env` file in local dev.

**Backend** (`Backend/.env` — optional):

```env
DATABASE_URL=sqlite:///./wardrobewhiz.db
UPLOAD_DIR=app/storage/uploads
THUMBNAIL_DIR=app/storage/thumbnails
FAISS_DIR=app/storage/faiss
```

**Frontend** (`Frontend/.env`):

```env
VITE_API_BASE_URL=http://localhost:8002/api
```

---

## Running the Project

### Prerequisites

- Python 3.10+
- Node.js 18+ and npm

---

### Backend

**1. Navigate to the backend directory**

```bash
cd wardrobewhiz/Backend
```

**2. Create and activate a virtual environment**

```bash
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
```

**3. Install dependencies**

```bash
pip install -r requirements.txt
```

> `torch` and `open_clip_torch` are large (~2 GB). The first startup will be slow while CLIP loads. If it fails to load the app falls back to random embeddings and still works.

**4. Create storage directories** (only needed once)

```bash
mkdir -p app/storage/uploads app/storage/thumbnails app/storage/faiss
```

**5. Start the backend server**

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8002
```

The API is now running at `http://localhost:8002`.

---

### Frontend

Open a second terminal:

**1. Navigate to the frontend directory**

```bash
cd wardrobewhiz/Frontend
```

**2. Install dependencies**

```bash
npm install
```

**3. Create the environment file** (if not already present)

```bash
echo "VITE_API_BASE_URL=http://localhost:8002/api" > .env
```

**4. Start the development server**

```bash
npm run dev
```

The app is now running at `http://localhost:8080`.

---

### Login

Open `http://localhost:8080` and log in with:

```
Username: admin
Password: admin123
```

---

### First-time Setup

After logging in for the first time:

1. Go to **Wardrobe → Upload Items** and upload clothing photos
2. Wait for the upload to complete — CLIP will auto-classify each item
3. If items have no category, call the reclassify endpoint once:
   ```
   POST http://localhost:8002/wardrobe/reclassify/1
   ```
4. Go to **Recommend** and generate your first outfit

For outfit generation to work you need at least **one top** and **one bottom** in your wardrobe (or a dress/jumpsuit as a substitute for both).
