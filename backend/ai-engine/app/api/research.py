import asyncio
import json
import logging

import aio_pika
from fastapi import APIRouter
from pydantic import BaseModel

from app.config import settings
from app.workers.research_consumer import process_research_message

router = APIRouter()
logger = logging.getLogger(__name__)

EXCHANGE = "verdant.tasks"
ROUTING_KEY = "research.start"


class StartResearchRequest(BaseModel):
    research_id: str
    query: str
    depth: str = "standard"
    focus: str = "general"
    user_id: str


@router.post("/start")
async def start_research(request: StartResearchRequest):
    payload = {
        "researchId": request.research_id,
        "query": request.query,
        "depth": request.depth,
        "focus": request.focus,
        "userId": request.user_id,
    }

    try:
        connection = await aio_pika.connect_robust(settings.rabbitmq_url)
        async with connection:
            channel = await connection.channel()
            exchange = await channel.declare_exchange(
                EXCHANGE,
                aio_pika.ExchangeType.TOPIC,
                durable=True,
            )
            await exchange.publish(
                aio_pika.Message(
                    body=json.dumps(payload).encode("utf-8"),
                    delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
                    content_type="application/json",
                ),
                routing_key=ROUTING_KEY,
            )
        message = "Research task queued"
        status = "queued"
    except Exception as e:
        # Fallback: keep endpoint functional in local/dev even without RabbitMQ.
        logger.warning("RabbitMQ unavailable for research start, running inline fallback: %s", e)
        asyncio.create_task(process_research_message(json.dumps(payload).encode("utf-8")))
        message = "RabbitMQ unavailable, started fallback processor"
        status = "running"

    return {
        "research_id": request.research_id,
        "status": status,
        "message": message,
    }
