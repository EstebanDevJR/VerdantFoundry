import asyncio

import pytest

from app.services import research_pipeline


@pytest.mark.asyncio
async def test_run_research_pipeline_handles_missing_api_key(monkeypatch):
  """Pipeline should fail gracefully when OPENAI_API_KEY is missing."""

  class DummySettings:
      core_api_url = "http://localhost:4000/api"
      internal_api_secret = "test"
      default_llm_model = "gpt-4o-mini"
      openai_api_key = None

  monkeypatch.setattr(research_pipeline, "settings", DummySettings())

  content, status = await research_pipeline.run_research_pipeline(
      research_id="test-id",
      query="What is Verdant Foundry?",
  )

  assert status == "failed"
  assert "OPENAI_API_KEY" in content

