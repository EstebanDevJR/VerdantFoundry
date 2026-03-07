"""Research pipeline: orchestrates multi-agent research and notifies Core API."""

import httpx

from app.config import settings
from app.services.agent_orchestrator import run_multi_agent_pipeline
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
    Run the multi-agent research pipeline.
    Returns (report_content, status).
    """
    await notify_core_log(research_id, "System", f"Starting multi-agent {depth} research pipeline ({focus} focus)...")

    report_content, status = await run_multi_agent_pipeline(
        research_id=research_id,
        query=query,
        depth=depth,
        focus=focus,
    )

    if status == "completed":
        await notify_core_log(research_id, "System", "Multi-agent report generated successfully.", "success")
    else:
        await notify_core_log(research_id, "System", f"Research pipeline ended with status: {status}", "error")

    return (report_content, status)


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
