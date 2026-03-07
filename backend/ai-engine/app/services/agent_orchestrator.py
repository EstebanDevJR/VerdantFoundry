"""Multi-agent orchestrator for research pipelines.

Coordinates specialized agents: Planner, Researcher, Analyst, Writer.
Each agent has a defined role and contributes to the final research output.
"""

import asyncio
import time
from dataclasses import dataclass, field

from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage

from app.config import settings
from app.services.embedding_service import embedding_service
from app.services.qdrant_service import qdrant_service
from app.services.event_bus import publish_research_event


@dataclass
class AgentResult:
    agent_name: str
    output: str
    duration_ms: float = 0
    metadata: dict = field(default_factory=dict)


AGENT_DEFINITIONS = {
    "Planner": {
        "role": "Research Planning Specialist",
        "system_prompt": (
            "You are a research planning specialist. Given a query, break it down into "
            "specific sub-questions and a structured research plan. Output a numbered list "
            "of research angles and key questions to investigate. Be thorough but concise."
        ),
    },
    "Researcher": {
        "role": "Information Retrieval Agent",
        "system_prompt": (
            "You are an information retrieval specialist. Given context from a knowledge base "
            "and a research plan, synthesize the available information and identify key facts, "
            "data points, and insights. Cite specific details from the provided context. "
            "If information is lacking, note what additional data would be needed."
        ),
    },
    "Analyst": {
        "role": "Critical Analysis Agent",
        "system_prompt": (
            "You are a critical analysis specialist. Given raw research findings, analyze "
            "patterns, draw connections, identify risks, evaluate strength of evidence, "
            "and generate actionable insights. Be objective and highlight both strengths "
            "and weaknesses in the findings."
        ),
    },
    "Writer": {
        "role": "Report Synthesis Agent",
        "system_prompt": (
            "You are an expert research report writer. Given a research plan, findings, "
            "and analysis, produce a polished, well-structured research report in Markdown. "
            "Include: Executive Summary, Key Findings (with sub-sections), Analysis, "
            "Recommendations, and Methodology. Use clear headings, bullet points, and "
            "bold text for emphasis. The report should be thorough, professional, and "
            "ready for executive review."
        ),
    },
}


def _get_llm(temperature: float = 0.3) -> ChatOpenAI:
    return ChatOpenAI(
        model=settings.default_llm_model,
        api_key=settings.openai_api_key,
        temperature=temperature,
    )


async def _run_agent(
    agent_name: str,
    user_prompt: str,
    research_id: str,
    temperature: float = 0.3,
) -> AgentResult:
    """Run a single agent and return its output."""
    defn = AGENT_DEFINITIONS[agent_name]
    await publish_research_event(
        research_id,
        "log",
        {
            "agent": agent_name,
            "message": f"{defn['role']} starting...",
            "type": "action",
        },
    )
    await publish_research_event(
        research_id,
        "reasoning",
        {
            "agent": agent_name,
            "role": defn["role"],
            "status": "thinking",
            "thought": f"Processing research input with {defn['role'].lower()} perspective...",
        },
    )

    start = time.monotonic()
    llm = _get_llm(temperature)
    messages = [
        SystemMessage(content=defn["system_prompt"]),
        HumanMessage(content=user_prompt),
    ]
    response = await llm.ainvoke(messages)
    output = response.content if hasattr(response, "content") else str(response)
    duration_ms = (time.monotonic() - start) * 1000

    await publish_research_event(
        research_id,
        "reasoning",
        {
            "agent": agent_name,
            "role": defn["role"],
            "status": "complete",
            "thought": f"Completed in {duration_ms:.0f}ms",
        },
    )
    await publish_research_event(
        research_id,
        "timeline",
        {
            "title": f"{agent_name} Agent",
            "description": f"{defn['role']} completed ({duration_ms:.0f}ms)",
            "status": "completed",
            "agent": agent_name,
            "durationMs": duration_ms,
        },
    )
    await publish_research_event(
        research_id,
        "log",
        {
            "agent": agent_name,
            "message": f"Completed in {duration_ms:.0f}ms",
            "type": "success",
        },
    )

    return AgentResult(
        agent_name=agent_name,
        output=output,
        duration_ms=duration_ms,
    )


async def run_multi_agent_pipeline(
    research_id: str,
    query: str,
    depth: str = "standard",
    focus: str = "general",
) -> tuple[str, str]:
    """
    Execute the multi-agent research pipeline.

    Pipeline stages:
    1. RAG retrieval (context from vector store)
    2. Planner agent (research plan)
    3. Researcher agent (synthesize findings from context + plan)
    4. Analyst agent (critical analysis of findings)
    5. Writer agent (final report synthesis)

    Returns (report_content, status).
    """
    if not settings.openai_api_key:
        await publish_research_event(
            research_id,
            "log",
            {"agent": "System", "message": "OPENAI_API_KEY required.", "type": "error"},
        )
        return ("Research pipeline requires OPENAI_API_KEY.", "failed")

    try:
        # Stage 1: RAG retrieval
        await publish_research_event(
            research_id,
            "log",
            {"agent": "System", "message": f"Starting {depth} multi-agent research ({focus} focus)...", "type": "info"},
        )
        await publish_research_event(
            research_id,
            "timeline",
            {"title": "Pipeline Initialized", "description": f"Multi-agent {depth} research", "status": "running", "agent": "System"},
        )

        context_chunks: list[str] = []
        try:
            query_vector = await embedding_service.embed_text(query)
            rag_limit = {"quick": 3, "standard": 5, "deep": 10}.get(depth, 5)
            results = qdrant_service.search(query_vector=query_vector, limit=rag_limit)
            context_chunks = [r["content"] for r in results]
            await publish_research_event(
                research_id,
                "log",
                {"agent": "System", "message": f"RAG: {len(context_chunks)} context chunks retrieved", "type": "info"},
            )
            await publish_research_event(
                research_id,
                "timeline",
                {"title": "RAG Search", "description": f"{len(context_chunks)} chunks", "status": "completed", "agent": "System"},
            )
        except (ValueError, Exception):
            await publish_research_event(
                research_id,
                "log",
                {"agent": "System", "message": "RAG skipped (embeddings not configured)", "type": "info"},
            )

        context = "\n\n".join(context_chunks) if context_chunks else "No prior knowledge base available."

        # Stage 2: Planner
        planner_prompt = (
            f"## Research Query\n{query}\n\n"
            f"## Parameters\nDepth: {depth}, Focus: {focus}\n\n"
            f"## Available Context Summary\n"
            f"{'Context available from ' + str(len(context_chunks)) + ' document chunks.' if context_chunks else 'No prior context available.'}\n\n"
            f"Create a detailed research plan with numbered sub-questions and investigation angles."
        )
        planner_result = await _run_agent("Planner", planner_prompt, research_id, temperature=0.4)

        # Stage 3: Researcher (uses RAG context + plan)
        researcher_prompt = (
            f"## Research Query\n{query}\n\n"
            f"## Research Plan\n{planner_result.output}\n\n"
            f"## Knowledge Base Context\n{context}\n\n"
            f"Synthesize findings from the available context according to the research plan. "
            f"Identify key facts, data points, and noteworthy details."
        )
        researcher_result = await _run_agent("Researcher", researcher_prompt, research_id)

        # Stage 4: Analyst (can run partially in parallel for deep research)
        analyst_prompt = (
            f"## Research Query\n{query}\n\n"
            f"## Research Plan\n{planner_result.output}\n\n"
            f"## Research Findings\n{researcher_result.output}\n\n"
            f"Provide critical analysis: patterns, connections, risks, evidence strength, "
            f"and actionable insights."
        )
        analyst_result = await _run_agent("Analyst", analyst_prompt, research_id, temperature=0.2)

        # Stage 5: Writer (synthesizes everything)
        depth_guidance = {
            "quick": "Write a concise report (~500 words) covering the essentials.",
            "standard": "Write a comprehensive report (~1000-1500 words) with detailed sections.",
            "deep": "Write an exhaustive report (~2000-3000 words) with deep analysis and multiple sub-sections.",
        }
        writer_prompt = (
            f"## Research Query\n{query}\n\n"
            f"## Research Plan\n{planner_result.output}\n\n"
            f"## Research Findings\n{researcher_result.output}\n\n"
            f"## Critical Analysis\n{analyst_result.output}\n\n"
            f"## Instructions\n{depth_guidance.get(depth, depth_guidance['standard'])}\n"
            f"Focus area: {focus}. Write the final report in well-structured Markdown."
        )
        writer_result = await _run_agent("Writer", writer_prompt, research_id, temperature=0.3)

        await publish_research_event(
            research_id,
            "log",
            {"agent": "System", "message": "Multi-agent pipeline complete.", "type": "success"},
        )

        total_ms = planner_result.duration_ms + researcher_result.duration_ms + analyst_result.duration_ms + writer_result.duration_ms
        metadata = {
            "pipeline": "multi-agent",
            "agents": ["Planner", "Researcher", "Analyst", "Writer"],
            "totalDurationMs": total_ms,
            "ragChunks": len(context_chunks),
        }
        await publish_research_event(
            research_id,
            "timeline",
            {
                "title": "Pipeline Complete",
                "description": f"4 agents, {total_ms:.0f}ms total",
                "status": "completed",
                "agent": "System",
                "metadata": metadata,
            },
        )

        return (writer_result.output, "completed")

    except Exception as e:
        await publish_research_event(
            research_id,
            "log",
            {"agent": "System", "message": f"Pipeline error: {str(e)}", "type": "error"},
        )
        return (f"Research failed: {str(e)}", "failed")
