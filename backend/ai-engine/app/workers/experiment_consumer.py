"""RabbitMQ consumer for experiment.run messages."""

import asyncio
import json
import logging

import aio_pika
import httpx

from app.config import settings

logger = logging.getLogger(__name__)

EXCHANGE = "verdant.tasks"
ROUTING_KEY = "experiment.run"


async def process_experiment_message(body: bytes) -> None:
    """Process an experiment.run message: run mock A/B and update Core with metrics."""
    data = json.loads(body)
    experiment_id = data.get("experimentId")
    variants = data.get("variants", [])
    if not experiment_id:
        logger.error("Missing experimentId in message")
        return
    url = f"{settings.core_api_url}/internal/experiments/{experiment_id}"
    headers = {"X-Internal-Key": settings.internal_api_secret}
    try:
        # Mock: compute simple metrics from variants count
        latency = 100 + len(variants) * 20
        precision = 0.85 + (len(variants) % 3) * 0.05
        metrics = {"latency": latency, "precision": round(precision, 2), "variantsRun": len(variants)}
        async with httpx.AsyncClient() as client:
            await client.patch(
                url,
                json={"metricsJson": metrics, "status": "completed"},
                headers=headers,
                timeout=10.0,
            )
        logger.info("Experiment %s completed, metrics=%s", experiment_id, metrics)
    except Exception as e:
        logger.exception("Experiment %s failed: %s", experiment_id, e)
        try:
            async with httpx.AsyncClient() as client:
                await client.patch(
                    url,
                    json={"status": "completed"},
                    headers=headers,
                    timeout=10.0,
                )
        except Exception:
            pass


async def run_experiment_consumer() -> None:
    """Run RabbitMQ consumer for experiment tasks."""
    try:
        connection = await aio_pika.connect_robust(settings.rabbitmq_url)
    except Exception as e:
        logger.warning("RabbitMQ connection failed: %s. Experiment consumer disabled.", e)
        return

    async def on_message(message: aio_pika.abc.AbstractIncomingMessage) -> None:
        async with message.process():
            await process_experiment_message(message.body)

    try:
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=1)
        exchange = await channel.declare_exchange(EXCHANGE, aio_pika.ExchangeType.TOPIC, durable=True)
        queue = await channel.declare_queue(settings.rabbitmq_experiment_queue, durable=True)
        await queue.bind(exchange, ROUTING_KEY)
        await queue.consume(on_message)
        logger.info("Experiment consumer started, listening on %s", settings.rabbitmq_experiment_queue)
        while True:
            await asyncio.sleep(3600)
    except asyncio.CancelledError:
        await connection.close()
        logger.info("Experiment consumer stopped")
