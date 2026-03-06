"""Memory RAG API - index and semantic search."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.services.embedding_service import embedding_service
from app.services.qdrant_service import qdrant_service


router = APIRouter()

TEXT_SPLITTER = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
    length_function=len,
)


class IndexRequest(BaseModel):
    document_id: str
    content: str
    metadata: dict | None = None


class SearchRequest(BaseModel):
    query: str
    tags: list[str] | None = None
    limit: int = 10
    document_ids: list[str] | None = None


@router.post("/index")
async def index_document(request: IndexRequest):
    """Chunk content, embed, and upsert into Qdrant."""
    try:
        # Hard limit document size to avoid huge payloads
        max_bytes = 200_000  # ~200 KB
        encoded = request.content.encode("utf-8")
        if len(encoded) > max_bytes:
            raise HTTPException(status_code=413, detail="Document too large for indexing.")

        chunks = TEXT_SPLITTER.split_text(request.content)
        if not chunks:
            return {"document_id": request.document_id, "chunks_indexed": 0}

        max_chunks = 200
        if len(chunks) > max_chunks:
            chunks = chunks[:max_chunks]

        chunk_ids = [f"{request.document_id}_{i}" for i in range(len(chunks))]
        embeddings = await embedding_service.embed_texts(chunks)
        count = qdrant_service.upsert_chunks(
            document_id=request.document_id,
            chunk_ids=chunk_ids,
            embeddings=embeddings,
            contents=chunks,
            metadata=request.metadata,
        )
        return {"document_id": request.document_id, "chunks_indexed": count}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/document/{document_id}")
async def delete_document(document_id: str):
    """Remove all chunks for a document from the vector store."""
    try:
        qdrant_service.delete_document(document_id)
        return {"document_id": document_id, "deleted": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search")
async def search(request: SearchRequest):
    """Semantic search over indexed documents."""
    try:
        limit = request.limit
        if limit > 50:
            limit = 50
        query_vector = await embedding_service.embed_text(request.query)
        results = qdrant_service.search(
            query_vector=query_vector,
            limit=limit,
            document_ids=request.document_ids,
        )
        return {"results": results, "query": request.query}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
