import asyncio
import logging
import functools
from typing import Callable, Any

logger = logging.getLogger(__name__)

def with_retry(retries: int = 3, delay: float = 1.0, exceptions: tuple = (Exception,)):
    """Decorator to retry an async function."""
    def decorator(func: Callable):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            last_err = None
            for i in range(retries):
                try:
                    return await func(*args, **kwargs)
                except exceptions as e:
                    last_err = e
                    logger.warning(
                        "Attempt %d/%d failed for %s: %s. Retrying in %.1fs...",
                        i + 1, retries, func.__name__, e, delay
                    )
                    await asyncio.sleep(delay)
            logger.error("All %d attempts failed for %s.", retries, func.__name__)
            raise last_err
        return wrapper
    return decorator
