"""Research pipeline: RAG search -> LLM synthesis -> report."""

import httpx

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

from app.config import settings
from app.services.embedding_service import embedding_service
from app.services.qdrant_service import qdrant_service
from app.services.event_bus import publish_research_event


async def notify_core_log(
    research_id: str,
    agent: str,
    message: str,
    log_type: str = "info",
) -> None:
    """Append log via Core internal API (persists and broadcasts to WebSocket)."""
    url = f"{settings.core_api_url}/internal/research/{research_id}/log"
    headers = {"X-Internal-Key": settings.internal_api_secret}
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                url,
                json={"agent": agent, "message": message, "type": log_type},
                headers=headers,
                timeout=10.0,
            )
    except Exception:
        pass


async def run_research_pipeline(
    research_id: str,
    query: str,
    depth: str = "standard",
    focus: str = "general",
) -> tuple[str, str]:
    """
    Run research pipeline and return (report_content, status).
    On failure returns ("", "failed").
    """
    try:
        # RAG search
        context_chunks: list[str] = []
        try:
            await notify_core_log(
                research_id,
                "System",
                f"Starting {depth} research with {focus} focus...",
                "info",
            )
            query_vector = await embedding_service.embed_text(query)
            results = qdrant_service.search(
                query_vector=query_vector,
                limit=5,
            )
            context_chunks = [r["content"] for r in results]
            await notify_core_log(
                research_id,
                "System",
                f"RAG search completed, {len(context_chunks)} chunks retrieved.",
                "info",
            )
            await publish_research_event(
                research_id,
                "timeline",
                {
                    "title": "RAG search",
                    "description": f"Retrieved {len(context_chunks)} context chunks",
                    "status": "completed",
                    "agent": "System",
                },
            )
        except ValueError:
            await notify_core_log(
                research_id,
                "System",
                "RAG skipped (embeddings not configured).",
                "info",
            )

        context = "\n\n".join(context_chunks) if context_chunks else "No prior knowledge base available."

        # LLM synthesis
        if not settings.openai_api_key:
            await notify_core_log(
                research_id,
                "System",
                "Research pipeline requires OPENAI_API_KEY.",
                "error",
            )
            return (
                "Research pipeline requires OPENAI_API_KEY. Please configure it in .env.",
                "failed",
            )
        await notify_core_log(
            research_id,
            "System",
            "Synthesizing report with LLM...",
            "action",
        )
        llm = ChatOpenAI(
            model=settings.default_llm_model,
            api_key=settings.openai_api_key,
            temperature=0.3,
        )
        system_prompt = f"""You are a research assistant. Generate a concise research report in Markdown.
Focus: {focus}. Depth: {depth}.
Use the provided context if relevant, otherwise reason from general knowledge."""

        user_prompt = f"## Research Query\n{query}\n\n## Context from Memory\n{context}\n\n## Your Task\nWrite a structured research report in Markdown with sections (Executive Summary, Key Findings, Recommendations, Sources)."

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt),
        ]
        response = await llm.ainvoke(messages)
        report_content = response.content if hasattr(response, "content") else str(response)

        await notify_core_log(
            research_id,
            "System",
            "Report generated successfully.",
            "success",
        )
        await publish_research_event(
            research_id,
            "timeline",
            {
                "title": "LLM synthesis",
                "description": "Report generated",
                "status": "completed",
                "agent": "System",
            },
        )
        return (report_content, "completed")
    except Exception as e:
        await notify_core_log(
            research_id,
            "System",
            f"Research failed: {str(e)}",
            "error",
        )
        return (f"Research failed: {str(e)}", "failed")


async def notify_core_complete(
    research_id: str,
    report_content: str,
    status: str,
) -> None:
    """Call Core API to update research record."""
    url = f"{settings.core_api_url}/internal/research/{research_id}/complete"
    headers = {"X-Internal-Key": settings.internal_api_secret}
    async with httpx.AsyncClient() as client:
        resp = await client.patch(
            url,
            json={"reportContent": report_content, "status": status},
            headers=headers,
            timeout=30.0,
        )
        if resp.status_code >= 400:
            raise RuntimeError(f"Core API error: {resp.status_code} {resp.text}")


async def notify_core_fail(research_id: str, message: str) -> None:
    """Call Core API to mark research as failed."""
    url = f"{settings.core_api_url}/internal/research/{research_id}/fail"
    headers = {"X-Internal-Key": settings.internal_api_secret}
    async with httpx.AsyncClient() as client:
        await client.patch(
            url,
            json={"message": message},
            headers=headers,
            timeout=10.0,
        )
