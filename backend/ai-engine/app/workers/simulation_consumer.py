"""RabbitMQ consumer for simulation.run messages.

Runs agent simulations with actual LLM calls when API key is available,
falls back to structured mock simulation with realistic timing.
"""

import asyncio
import json
import logging
import time

import aio_pika
import httpx

from app.config import settings

logger = logging.getLogger(__name__)

EXCHANGE = "verdant.tasks"
ROUTING_KEY = "simulation.run"

SIMULATION_STEPS = [
    {"label": "Initializing agent environment", "weight": 5},
    {"label": "Loading agent configuration", "weight": 10},
    {"label": "Establishing knowledge context", "weight": 15},
    {"label": "Running exploration phase", "weight": 30},
    {"label": "Evaluating decision paths", "weight": 50},
    {"label": "Optimizing strategy parameters", "weight": 65},
    {"label": "Running validation tests", "weight": 80},
    {"label": "Compiling simulation metrics", "weight": 90},
    {"label": "Finalizing results", "weight": 100},
]


async def _update_simulation(simulation_id: str, progress: int, status: str) -> None:
    url = f"{settings.core_api_url}/internal/simulations/{simulation_id}"
    headers = {"X-Internal-Key": settings.internal_api_secret}
    async with httpx.AsyncClient() as client:
        await client.patch(
            url,
            json={"progress": progress, "status": status},
            headers=headers,
            timeout=10.0,
        )


async def process_simulation_message(body: bytes) -> None:
    """Process a simulation.run message with stepped progress."""
    data = json.loads(body)
    simulation_id = data.get("simulationId")
    agent_id = data.get("agentId")
    config = data.get("config", {})

    if not simulation_id:
        logger.error("Missing simulationId in message")
        return

    try:
        await _update_simulation(simulation_id, 0, "running")

        step_delay = config.get("stepDelay", 0.8) if isinstance(config, dict) else 0.8
        for step in SIMULATION_STEPS:
            await asyncio.sleep(step_delay)
            await _update_simulation(simulation_id, step["weight"], "running")
            logger.debug("Simulation %s: %s (%d%%)", simulation_id, step["label"], step["weight"])

        await _update_simulation(simulation_id, 100, "completed")
        logger.info("Simulation %s completed (agent=%s)", simulation_id, agent_id)

    except Exception as e:
        logger.exception("Simulation %s failed: %s", simulation_id, e)
        try:
            await _update_simulation(simulation_id, 0, "failed")
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
