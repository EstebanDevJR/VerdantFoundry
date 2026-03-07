import asyncio

import pytest

from app.services import research_pipeline, agent_orchestrator


@pytest.mark.asyncio
async def test_run_research_pipeline_handles_missing_api_key(monkeypatch):
    """Pipeline should fail gracefully when OPENAI_API_KEY is missing."""

    class DummySettings:
        core_api_url = "http://127.0.0.1:4000/api"
        internal_api_secret = "test"  # pragma: allowlist secret
        default_llm_model = "gpt-4o-mini"  # pragma: allowlist secret
        openai_api_key = None
        embedding_model = "text-embedding-3-small"  # pragma: allowlist secret
        qdrant_url = "http://127.0.0.1:6333"
        qdrant_collection = "test"
        redis_url = "redis://127.0.0.1:6379"
        rabbitmq_url = "amqp://127.0.0.1:5672"

    monkeypatch.setattr(research_pipeline, "settings", DummySettings())
    monkeypatch.setattr(agent_orchestrator, "settings", DummySettings())

    async def fake_publish(*args, **kwargs):
        pass

    monkeypatch.setattr(agent_orchestrator, "publish_research_event", fake_publish)
    monkeypatch.setattr(research_pipeline, "notify_core_log", fake_publish)

    content, status = await research_pipeline.run_research_pipeline(
        research_id="test-id",
        query="What is Verdant Foundry?",
    )

    assert status == "failed"
    assert "OPENAI_API_KEY" in content
