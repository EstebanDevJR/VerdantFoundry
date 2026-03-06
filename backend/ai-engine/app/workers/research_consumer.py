"""RabbitMQ consumer for research.start messages."""

import asyncio
import json
import logging

import aio_pika

from app.config import settings
from app.services.research_pipeline import (
    run_research_pipeline,
    notify_core_complete,
    notify_core_fail,
)
from app.services.event_bus import publish_research_event

logger = logging.getLogger(__name__)

EXCHANGE = "verdant.tasks"
ROUTING_KEY = "research.start"


async def process_research_message(body: bytes) -> None:
    """Process a research.start message."""
    data = json.loads(body)
    research_id = data.get("researchId")
    query = data.get("query", "")
    depth = data.get("depth", "standard")
    focus = data.get("focus", "general")
    if not research_id:
        logger.error("Missing researchId in message")
        return
    try:
        await publish_research_event(
            research_id,
            "log",
            {"agent": "System", "message": "Research pipeline started", "type": "info"},
        )
        report_content, status = await run_research_pipeline(
            research_id=research_id,
            query=query,
            depth=depth,
            focus=focus,
        )
        await notify_core_complete(research_id, report_content, status)
        await publish_research_event(
            research_id,
            "complete",
            {"reportContent": report_content, "status": status},
        )
        logger.info("Research %s completed", research_id)
    except Exception as e:
        logger.exception("Research %s failed: %s", research_id, e)
        try:
            await publish_research_event(
                research_id,
                "log",
                {"agent": "System", "message": str(e), "type": "error"},
            )
            await publish_research_event(research_id, "complete", {"status": "failed"})
            await notify_core_fail(research_id, str(e))
        except Exception:
            pass


async def run_research_consumer() -> None:
    """Run RabbitMQ consumer for research tasks."""
    try:
        connection = await aio_pika.connect_robust(settings.rabbitmq_url)
    except Exception as e:
        logger.warning("RabbitMQ connection failed: %s. Research consumer disabled.", e)
        return

    async def on_message(message: aio_pika.abc.AbstractIncomingMessage) -> None:
        async with message.process():
            await process_research_message(message.body)

    try:
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=1)
        exchange = await channel.declare_exchange(EXCHANGE, aio_pika.ExchangeType.TOPIC, durable=True)
        queue = await channel.declare_queue(settings.rabbitmq_research_queue, durable=True)
        await queue.bind(exchange, ROUTING_KEY)
        await queue.consume(on_message)
        logger.info("Research consumer started, listening on %s", settings.rabbitmq_research_queue)
        while True:
            await asyncio.sleep(3600)
    except asyncio.CancelledError:
        await connection.close()
        logger.info("Research consumer stopped")
