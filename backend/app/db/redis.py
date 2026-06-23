from typing import AsyncGenerator
import redis.asyncio as redis
from redis.asyncio import Redis

from app.core.config import get_settings

settings = get_settings()

redis_client: Redis | None = None

async def init_redis() -> None:
    """Initialize Redis connection pool."""
    global redis_client
    if redis_client is None:
        redis_client = redis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
        )

async def close_redis() -> None:
    """Close Redis connection pool."""
    global redis_client
    if redis_client is not None:
        await redis_client.close()
        redis_client = None

async def get_redis() -> AsyncGenerator[Redis, None]:
    """Dependency to get Redis client."""
    if redis_client is None:
        raise RuntimeError("Redis client is not initialized")
    yield redis_client
