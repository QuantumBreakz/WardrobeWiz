import logging
import logging.config

from app.api.routes import adapter, auth, feedback, health, outfits, profile, wardrobe
from app.core.config import settings
from app.core.database import Base, engine
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

# ── Logging ───────────────────────────────────────────────────────────────────
logging.config.dictConfig(
    {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "format": "%(asctime)s %(levelname)-8s %(name)s  %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S",
            }
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "default",
            }
        },
        "root": {"handlers": ["console"], "level": "INFO"},
    }
)

logger = logging.getLogger(__name__)

# ── DB bootstrap ──────────────────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="wardrobewiz API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded images and thumbnails as static files
app.mount("/static/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")
app.mount(
    "/static/thumbnails",
    StaticFiles(directory=settings.thumbnail_dir),
    name="thumbnails",
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


app.include_router(adapter.router, prefix="/api", tags=["Frontend API"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(profile.router, prefix="/profiles", tags=["Profiles"])
app.include_router(wardrobe.router, prefix="/wardrobe", tags=["Wardrobe"])
app.include_router(outfits.router, prefix="/outfits", tags=["Outfits"])
app.include_router(feedback.router, prefix="/feedback", tags=["Feedback"])


@app.get("/")
def root():
    return {"message": "wardrobewiz backend running"}
