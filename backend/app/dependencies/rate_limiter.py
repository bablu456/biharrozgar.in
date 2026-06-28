import logging

from fastapi import Request, Depends, HTTPException, status
from redis.asyncio import Redis
from redis.exceptions import RedisError

from app.dependencies.auth import OptionalCurrentUser
from app.db.redis import get_redis

MAX_REQUESTS_PER_MINUTE = 5
logger = logging.getLogger(__name__)

async def check_ai_rate_limit(
    request: Request,
    current_user: OptionalCurrentUser,
    redis_client: Redis = Depends(get_redis)
) -> None:
    # Use user ID if authenticated, otherwise use IP address
    identifier = str(current_user.id) if current_user else (request.client.host if request.client else "unknown_ip")
    redis_key = f"rate_limit:ai_chat:user:{identifier}"
    
    # Increment the count for this key
    try:
        request_count = await redis_client.incr(redis_key)

        # If it's the first request in the window, set the expiration
        if request_count == 1:
            await redis_client.expire(redis_key, 60)
    except RedisError as exc:
        logger.warning("Skipping AI rate limit because Redis is unavailable: %s", exc)
        return
        
    if request_count > MAX_REQUESTS_PER_MINUTE:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="You are sending messages too fast. Please wait a minute."
        )
