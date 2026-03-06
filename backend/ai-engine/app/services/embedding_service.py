"""Embedding service for vector search."""

from openai import AsyncOpenAI

from app.config import settings


class EmbeddingService:
    def __init__(self) -> None:
        self.client = AsyncOpenAI(api_key=settings.openai_api_key or "sk-placeholder")
        self.model = settings.embedding_model

    def _ensure_api_key(self) -> None:
        if not settings.openai_api_key:
            raise ValueError("OPENAI_API_KEY is not configured. Set it in .env for memory RAG.")

    async def embed_text(self, text: str) -> list[float]:
        """Get embedding for a single text."""
        self._ensure_api_key()
        response = await self.client.embeddings.create(
            model=self.model,
            input=text,
        )
        return response.data[0].embedding

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        """Get embeddings for multiple texts in batch."""
        self._ensure_api_key()
        if not texts:
            return []
        response = await self.client.embeddings.create(
            model=self.model,
            input=texts,
        )
        return [d.embedding for d in sorted(response.data, key=lambda x: x.index)]


embedding_service = EmbeddingService()
