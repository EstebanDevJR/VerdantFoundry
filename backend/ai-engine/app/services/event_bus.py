"""Event bus for publishing research events to Redis."""

import json
from redis.asyncio import Redis

from app.config import settings

_redis: Redis | None = None


async def get_redis() -> Redis | None:
    global _redis
    if _redis is None:
        try:
            _redis = Redis.from_url(settings.redis_url, decode_responses=True)
            await _redis.ping()
        except Exception:
            _redis = None
    return _redis


async def publish_research_event(
    research_id: str,
    event: str,
    payload: dict,
) -> None:
    """Publish research event to Redis for WebSocket forwarding."""
    redis = await get_redis()
    if not redis:
        return
    try:
        msg = json.dumps({
            "researchId": research_id,
            "event": event,
            "payload": payload,
        })
        await redis.publish("research.events", msg)
    except Exception:
        pass
