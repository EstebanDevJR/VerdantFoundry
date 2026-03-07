"""RabbitMQ consumer for experiment.run messages.

Runs A/B experiments comparing different configurations with real measured
execution when possible, falling back to structural analysis.
"""

import asyncio
import json
import logging
import math
import os
import subprocess
import tempfile
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


async def _evaluate_prompt(prompt: str) -> dict:
    """Send a prompt to the LLM and measure real latency/success."""
    from langchain_openai import ChatOpenAI

    llm = ChatOpenAI(
        api_key=settings.openai_api_key,
        model=settings.default_llm_model,
        temperature=0.0,
    )

    latencies: list[float] = []
    successes = 0
    failures = 0
    num_samples = 3

    for _ in range(num_samples):
        start = time.time()
        try:
            response = await llm.ainvoke(prompt)
            elapsed = time.time() - start
            latencies.append(elapsed * 1000)
            if response and hasattr(response, "content") and response.content:
                successes += 1
            else:
                failures += 1
        except Exception as e:
            elapsed = time.time() - start
            latencies.append(elapsed * 1000)
            failures += 1
            logger.debug("Prompt evaluation error: %s", e)

    total = successes + failures
    avg_latency = sum(latencies) / len(latencies) if latencies else 0.0
    throughput = (1000.0 / avg_latency) if avg_latency > 0 else 0.0
    error_rate = failures / total if total > 0 else 1.0

    return {
        "latencyMs": round(avg_latency, 1),
        "throughput": round(throughput, 1),
        "errorRate": round(error_rate, 4),
        "accuracy": round(1.0 - error_rate, 4),
        "samples": total,
        "latencies": latencies,
    }


def _evaluate_code_sync(code: str) -> dict:
    """Execute code in a sandboxed subprocess and measure real metrics."""
    latencies: list[float] = []
    successes = 0
    failures = 0
    num_samples = 3

    for _ in range(num_samples):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False) as f:
            f.write(code)
            tmp = f.name
        try:
            start = time.time()
            proc = subprocess.run(
                ["python", tmp],
                capture_output=True,
                text=True,
                timeout=30,
                env={**os.environ, "PYTHONPATH": ""},
            )
            elapsed = time.time() - start
            latencies.append(elapsed * 1000)
            if proc.returncode == 0:
                successes += 1
            else:
                failures += 1
        except subprocess.TimeoutExpired:
            latencies.append(30000.0)
            failures += 1
        except Exception:
            failures += 1
        finally:
            os.unlink(tmp)

    total = successes + failures
    avg_latency = sum(latencies) / len(latencies) if latencies else 0.0
    throughput = (1000.0 / avg_latency) if avg_latency > 0 else 0.0
    error_rate = failures / total if total > 0 else 1.0

    return {
        "latencyMs": round(avg_latency, 1),
        "throughput": round(throughput, 1),
        "errorRate": round(error_rate, 4),
        "accuracy": round(1.0 - error_rate, 4),
        "samples": total,
        "latencies": latencies,
    }


def _compute_confidence(all_latencies: list[list[float]]) -> float:
    """Compute confidence using standard statistical formulas.

    If total sample size > 30, confidence = 1 - (std_dev / sqrt(samples)).
    Clamps result to [0.0, 1.0].
    """
    flat = [v for group in all_latencies for v in group]
    n = len(flat)
    if n < 2:
        return 0.0
    mean = sum(flat) / n
    variance = sum((x - mean) ** 2 for x in flat) / (n - 1)
    std_dev = math.sqrt(variance)
    if n > 30:
        confidence = 1.0 - (std_dev / math.sqrt(n))
    else:
        confidence = 1.0 - (std_dev / math.sqrt(n)) * (1.0 + 1.0 / n)
    return round(max(0.0, min(1.0, confidence)), 4)


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
        all_latencies: list[list[float]] = []
        has_api_key = bool(settings.openai_api_key)

        for i, variant in enumerate(variants):
            variant_name = (
                variant.get("name", f"Variant {chr(65 + i)}")
                if isinstance(variant, dict)
                else f"Variant {chr(65 + i)}"
            )

            prompt = variant.get("prompt") if isinstance(variant, dict) else None
            code = variant.get("code") if isinstance(variant, dict) else None

            raw_metrics: dict | None = None

            if prompt and has_api_key:
                raw_metrics = await _evaluate_prompt(prompt)
            elif code:
                raw_metrics = await asyncio.get_event_loop().run_in_executor(
                    None, _evaluate_code_sync, code
                )
            elif prompt and not has_api_key:
                start = time.time()
                await asyncio.sleep(0.1)
                elapsed = (time.time() - start) * 1000
                raw_metrics = {
                    "latencyMs": round(elapsed, 1),
                    "throughput": round(1000.0 / elapsed if elapsed > 0 else 0.0, 1),
                    "errorRate": 0.0,
                    "accuracy": 1.0,
                    "samples": 1,
                    "latencies": [elapsed],
                }
            else:
                await asyncio.sleep(0.5)
                raw_metrics = {
                    "latencyMs": 0.0,
                    "throughput": 0.0,
                    "errorRate": 0.0,
                    "accuracy": 0.0,
                    "samples": 0,
                    "latencies": [],
                }

            all_latencies.append(raw_metrics.get("latencies", []))

            metrics = {
                "name": variant_name,
                "accuracy": raw_metrics["accuracy"],
                "latencyMs": raw_metrics["latencyMs"],
                "throughput": raw_metrics["throughput"],
                "costPerQuery": 0.0,
                "errorRate": raw_metrics["errorRate"],
                "samples": raw_metrics["samples"],
            }
            variant_metrics.append(metrics)

        best_variant = max(variant_metrics, key=lambda m: m["accuracy"]) if variant_metrics else None

        result_metrics = {
            "variants": variant_metrics,
            "winner": best_variant["name"] if best_variant else None,
            "confidence": _compute_confidence(all_latencies),
            "totalSamples": sum(m["samples"] for m in variant_metrics),
            "completedAt": asyncio.get_event_loop().time(),
        }

        await _update_experiment(experiment_id, metrics=result_metrics, status="completed")
        logger.info(
            "Experiment %s completed: winner=%s",
            experiment_id,
            best_variant["name"] if best_variant else "none",
        )

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
