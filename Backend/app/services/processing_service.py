import logging

logger = logging.getLogger(__name__)


def process_image(image_path: str) -> dict:
    """
    Placeholder for future AI pipeline.
    Currently just logs and returns mock metadata.
    """
    message = "Image ready for advanced processing"
    logger.info(message)
    return {
        "status": "ready",
        "message": message,
    }
