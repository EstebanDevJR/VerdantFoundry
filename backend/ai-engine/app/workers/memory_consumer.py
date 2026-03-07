"""RabbitMQ consumer for memory.index messages.

Chunks, embeds, and upserts documents into the Qdrant vector store,
reusing the same indexing logic as POST /memory/index.
"""

import asyncio
import json
import logging

import aio_pika

from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.config import settings
from app.services.embedding_service import embedding_service
from app.services.qdrant_service import qdrant_service

logger = logging.getLogger(__name__)

EXCHANGE = "verdant.tasks"
ROUTING_KEY = "memory.index"

TEXT_SPLITTER = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
    length_function=len,
)

MAX_DOCUMENT_BYTES = 200_000
MAX_CHUNKS = 200


async def process_memory_message(body: bytes) -> None:
    """Process a memory.index message: chunk, embed, and upsert to Qdrant."""
    data = json.loads(body)
    document_id = data.get("documentId")
    content = data.get("content", "")
    metadata = data.get("metadata")

    if not document_id:
        logger.error("Missing documentId in memory message")
        return

    if not content:
        logger.warning("Empty content for document %s, skipping", document_id)
        return

    try:
        encoded = content.encode("utf-8")
        if len(encoded) > MAX_DOCUMENT_BYTES:
            logger.warning("Document %s too large (%d bytes), skipping", document_id, len(encoded))
            return

        chunks = TEXT_SPLITTER.split_text(content)
        if not chunks:
            logger.info("Document %s produced no chunks", document_id)
            return

        if len(chunks) > MAX_CHUNKS:
            chunks = chunks[:MAX_CHUNKS]

        chunk_ids = [f"{document_id}_{i}" for i in range(len(chunks))]
        embeddings = await embedding_service.embed_texts(chunks)
        count = qdrant_service.upsert_chunks(
            document_id=document_id,
            chunk_ids=chunk_ids,
            embeddings=embeddings,
            contents=chunks,
            metadata=metadata,
        )
        logger.info("Document %s indexed: %d chunks upserted", document_id, count)

    except Exception as e:
        logger.exception("Failed to index document %s: %s", document_id, e)


async def run_memory_consumer() -> None:
    """Run RabbitMQ consumer for memory indexing tasks."""
    try:
        connection = await aio_pika.connect_robust(settings.rabbitmq_url)
    except Exception as e:
        logger.warning("RabbitMQ connection failed: %s. Memory consumer disabled.", e)
        return

    async def on_message(message: aio_pika.abc.AbstractIncomingMessage) -> None:
        async with message.process():
            await process_memory_message(message.body)

    try:
        channel = await connection.channel()
        await channel.set_qos(prefetch_count=1)
        exchange = await channel.declare_exchange(EXCHANGE, aio_pika.ExchangeType.TOPIC, durable=True)
        queue = await channel.declare_queue(settings.rabbitmq_memory_queue, durable=True)
        await queue.bind(exchange, ROUTING_KEY)
        await queue.consume(on_message)
        logger.info("Memory consumer started, listening on %s", settings.rabbitmq_memory_queue)
        while True:
            await asyncio.sleep(3600)
    except asyncio.CancelledError:
        await connection.close()
        logger.info("Memory consumer stopped")
