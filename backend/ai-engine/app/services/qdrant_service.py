"""Qdrant vector store service for RAG."""

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue, FilterSelector

from app.config import settings


class QdrantService:
    def __init__(self) -> None:
        self.client = QdrantClient(url=settings.qdrant_url)
        self.collection = settings.qdrant_collection
        self.vector_size = 1536  # text-embedding-3-small

    def ensure_collection(self) -> None:
        """Create collection if it doesn't exist."""
        collections = self.client.get_collections().collections
        names = [c.name for c in collections]
        if self.collection not in names:
            self.client.create_collection(
                collection_name=self.collection,
                vectors_config=VectorParams(
                    size=self.vector_size,
                    distance=Distance.COSINE,
                ),
            )

    def upsert_chunks(
        self,
        document_id: str,
        chunk_ids: list[str],
        embeddings: list[list[float]],
        contents: list[str],
        metadata: dict | None = None,
    ) -> int:
        """Upsert document chunks into Qdrant."""
        self.ensure_collection()
        points = []
        for i, (chunk_id, embedding, content) in enumerate(
            zip(chunk_ids, embeddings, contents)
        ):
            payload: dict = {
                "document_id": document_id,
                "content": content,
                "chunk_index": i,
            }
            if metadata:
                payload["metadata"] = metadata
            points.append(
                PointStruct(
                    id=chunk_id,
                    vector=embedding,
                    payload=payload,
                )
            )
        self.client.upsert(collection_name=self.collection, points=points)
        return len(points)

    def search(
        self,
        query_vector: list[float],
        limit: int = 10,
        document_ids: list[str] | None = None,
    ) -> list[dict]:
        """Search for similar chunks."""
        self.ensure_collection()
        filter_ = None
        if document_ids:
            from qdrant_client.models import Filter, FieldCondition, MatchAny

            filter_ = Filter(
                must=[
                    FieldCondition(
                        key="document_id",
                        match=MatchAny(any=document_ids),
                    )
                ]
            )
        results = self.client.search(
            collection_name=self.collection,
            query_vector=query_vector,
            limit=limit,
            query_filter=filter_,
        )
        return [
            {
                "id": str(r.id),
                "score": r.score,
                "content": r.payload.get("content", ""),
                "document_id": r.payload.get("document_id"),
                "metadata": r.payload.get("metadata"),
            }
            for r in results
        ]

    def delete_document(self, document_id: str) -> None:
        """Delete all chunks for a document from Qdrant."""
        self.ensure_collection()
        self.client.delete(
            collection_name=self.collection,
            points_selector=FilterSelector(
                filter=Filter(
                    must=[
                        FieldCondition(
                            key="document_id",
                            match=MatchValue(value=document_id),
                        ),
                    ],
                ),
            ),
        )


qdrant_service = QdrantService()
