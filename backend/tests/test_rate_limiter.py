from __future__ import annotations

import asyncio

import pytest
from fastapi import HTTPException
from redis.exceptions import ConnectionError as RedisConnectionError

from app.dependencies.rate_limiter import MAX_REQUESTS_PER_MINUTE, check_ai_rate_limit


class _DummyRequest:
    class _Client:
        host = "127.0.0.1"

    client = _Client()


class _BrokenRedis:
    async def incr(self, _: str) -> int:
        raise RedisConnectionError("redis is unavailable")


class _CountingRedis:
    def __init__(self, count: int) -> None:
        self.count = count
        self.expire_calls: list[tuple[str, int]] = []

    async def incr(self, _: str) -> int:
        return self.count

    async def expire(self, key: str, seconds: int) -> None:
        self.expire_calls.append((key, seconds))


def test_ai_rate_limit_skips_when_redis_is_unavailable() -> None:
    asyncio.run(
        check_ai_rate_limit(
            request=_DummyRequest(),
            current_user=None,
            redis_client=_BrokenRedis(),
        )
    )


def test_ai_rate_limit_still_blocks_after_threshold() -> None:
    with pytest.raises(HTTPException) as exc_info:
        asyncio.run(
            check_ai_rate_limit(
                request=_DummyRequest(),
                current_user=None,
                redis_client=_CountingRedis(MAX_REQUESTS_PER_MINUTE + 1),
            )
        )

    assert exc_info.value.status_code == 429
