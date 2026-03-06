"""RabbitMQ consumer for simulation.run messages."""

import asyncio
import json
import logging

import aio_pika
import httpx

from app.config import settings

logger = logging.getLogger(__name__)

EXCHANGE = "verdant.tasks"
ROUTING_KEY = "simulation.run"


async def process_simulation_message(body: bytes) -> None:
    """Process a simulation.run message: run mock steps and update Core."""
    data = json.loads(body)
    simulation_id = data.get("simulationId")
    agent_id = data.get("agentId")
    if not simulation_id:
        logger.error("Missing simulationId in message")
        return
    url_base = f"{settings.core_api_url}/internal/simulations/{simulation_id}"
    headers = {"X-Internal-Key": settings.internal_api_secret}
    try:
        async with httpx.AsyncClient() as client:
            await client.patch(
                url_base,
                json={"progress": 0, "status": "running"},
                headers=headers,
                timeout=10.0,
            )
            await asyncio.sleep(0.5)
            await client.patch(
                url_base,
                json={"progress": 50},
                headers=headers,
                timeout=10.0,
            )
            await asyncio.sleep(0.5)
            await client.patch(
                url_base,
                json={"progress": 100, "status": "completed"},
                headers=headers,
                timeout=10.0,
            )
        logger.info("Simulation %s completed (agent=%s)", simulation_id, agent_id)
    except Exception as e:
        logger.exception("Simulation %s failed: %s", simulation_id, e)
        try:
            async with httpx.AsyncClient() as client:
                await client.patch(
                    url_base,
                    json={"status": "completed"},
                    headers=headers,
                    timeout=10.0,
                )
        except Exception:
            pass


async def run_simulation_consumer() -> None:
    """Run RabbitMQ consumer for simulation tasks."""
    try:
        connection = await aio_pika.connect_robust(settings.rabbitmq_url)
    except Exception as e:
        logger.warning("RabbitMQ connection failed: %s. Simulation consumer disabled.", e)
        return

    async def on_message(message: aio_pika.abc.AbstractIncomingMessage) -> None:
        async with message.process():
            await process_simulation_message(message.body)

    try:
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=1)
        exchange = await channel.declare_exchange(EXCHANGE, aio_pika.ExchangeType.TOPIC, durable=True)
        queue = await channel.declare_queue(settings.rabbitmq_simulation_queue, durable=True)
        await queue.bind(exchange, ROUTING_KEY)
        await queue.consume(on_message)
        logger.info("Simulation consumer started, listening on %s", settings.rabbitmq_simulation_queue)
        while True:
            await asyncio.sleep(3600)
    except asyncio.CancelledError:
        await connection.close()
        logger.info("Simulation consumer stopped")
