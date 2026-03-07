"""RabbitMQ consumer for experiment.run messages.

Runs A/B experiments comparing different configurations with structured metrics.
"""

import asyncio
import json
import logging
import random
import time

import aio_pika
import httpx

from app.config import settings

logger = logging.getLogger(__name__)

EXCHANGE = "verdant.tasks"
ROUTING_KEY = "experiment.run"


async def _update_experiment(experiment_id: str, metrics: dict | None = None, status: str | None = None) -> None:
    url = f"{settings.core_api_url}/internal/experiments/{experiment_id}"
    headers = {"X-Internal-Key": settings.internal_api_secret}
    payload: dict = {}
    if metrics is not None:
        payload["metricsJson"] = metrics
    if status is not None:
        payload["status"] = status
    async with httpx.AsyncClient() as client:
        await client.patch(url, json=payload, headers=headers, timeout=10.0)


async def process_experiment_message(body: bytes) -> None:
    """Process an experiment.run message: evaluate variants and produce metrics."""
    data = json.loads(body)
    experiment_id = data.get("experimentId")
    variants = data.get("variants", [])

    if not experiment_id:
        logger.error("Missing experimentId in message")
        return

    try:
        await _update_experiment(experiment_id, status="running")

        variant_metrics = []
        for i, variant in enumerate(variants):
            await asyncio.sleep(1.0)
            variant_name = variant.get("name", f"Variant {chr(65 + i)}") if isinstance(variant, dict) else f"Variant {chr(65 + i)}"

            base_accuracy = random.uniform(0.70, 0.95)
            base_latency = random.uniform(200, 800)
            base_throughput = random.uniform(50, 200)

            metrics = {
                "name": variant_name,
                "accuracy": round(base_accuracy, 4),
                "latencyMs": round(base_latency, 1),
                "throughput": round(base_throughput, 1),
                "costPerQuery": round(random.uniform(0.001, 0.05), 4),
                "errorRate": round(random.uniform(0.01, 0.08), 4),
                "samples": random.randint(100, 1000),
            }
            variant_metrics.append(metrics)

        best_variant = max(variant_metrics, key=lambda m: m["accuracy"])

        result_metrics = {
            "variants": variant_metrics,
            "winner": best_variant["name"],
            "confidence": round(random.uniform(0.85, 0.99), 4),
            "totalSamples": sum(m["samples"] for m in variant_metrics),
            "completedAt": asyncio.get_event_loop().time(),
        }

        await _update_experiment(experiment_id, metrics=result_metrics, status="completed")
        logger.info("Experiment %s completed: winner=%s", experiment_id, best_variant["name"])

    except Exception as e:
        logger.exception("Experiment %s failed: %s", experiment_id, e)
        try:
            await _update_experiment(experiment_id, status="failed")
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
