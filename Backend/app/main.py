import logging
import logging.config
import os

# Prevent crash due to multiple OpenMP runtimes (FAISS/Torch conflict)
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

from app.api.routes import adapter, admin, auth, feedback, health, outfits, profile, wardrobe
from app.core.config import settings
from app.core.database import create_indexes, get_client
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware

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

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="WardrobeWiz API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://localhost:5173",
        "http://localhost:3000",
        "https://wardrobewiz.vercel.app",  # Example production origin
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Force HTTPS in production (NFR Security — HTTPS)
if not settings.debug:
    app.add_middleware(HTTPSRedirectMiddleware)

# Trusted Host Middleware (Security Hardening)
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=["localhost", "127.0.0.1", "*.mongodb.net", "*.vercel.app"]
)

# Custom Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

app.add_middleware(SecurityHeadersMiddleware)


@app.on_event("startup")
async def startup_event():
    logger.info("Connecting to MongoDB Atlas...")
    get_client()  # Initialize motor client
    await create_indexes()
    logger.info("MongoDB indexes created successfully.")


@app.on_event("shutdown")
async def shutdown_event():
    client = get_client()
    client.close()
    logger.info("MongoDB connection closed.")


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
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(health.router, prefix="/health", tags=["Health"])
app.include_router(profile.router, prefix="/profiles", tags=["Profiles"])
app.include_router(wardrobe.router, prefix="/wardrobe", tags=["Wardrobe"])
app.include_router(outfits.router, prefix="/outfits", tags=["Outfits"])
app.include_router(feedback.router, prefix="/feedback", tags=["Feedback"])


@app.get("/")
def root():
    return {"message": "WardrobeWiz backend running — MongoDB Atlas"}
