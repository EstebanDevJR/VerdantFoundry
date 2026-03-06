from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from langchain_openai import ChatOpenAI

from app.config import settings

router = APIRouter()


class ChatRequest(BaseModel):
    messages: list[dict[str, str]]
    model: str | None = None
    max_tokens: int | None = None
    temperature: float | None = None


@router.post("/chat")
async def chat(request: ChatRequest):
    if not settings.openai_api_key:
        raise HTTPException(
            status_code=503,
            detail="OPENAI_API_KEY not configured. Set it in .env for LLM features.",
        )
    model = request.model or settings.default_llm_model
    # Clamp temperature and tokens to safe ranges
    temperature = request.temperature if request.temperature is not None else 0.7
    if temperature < 0:
        temperature = 0
    if temperature > 1.5:
        temperature = 1.5
    max_tokens = request.max_tokens if request.max_tokens is not None else None
    if max_tokens is not None and max_tokens > 4000:
        max_tokens = 4000

    # Hard-limit total input size
    trimmed_messages: list[dict[str, str]] = []
    total_chars = 0
    max_chars = 16_000
    for m in reversed(request.messages):
        content = m.get("content", "") or ""
        role = m.get("role", "user")
        if total_chars + len(content) > max_chars and trimmed_messages:
            break
        total_chars += len(content)
        trimmed_messages.insert(0, {"role": role, "content": content})

    messages = trimmed_messages or [
        {"role": m["role"], "content": m.get("content", "")}
        for m in request.messages
    ]
    # langchain expects HumanMessage, AIMessage, SystemMessage
    from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

    lc_messages = []
    for m in messages:
        role = m.get("role", "user")
        content = m.get("content", "")
        if role == "system":
            lc_messages.append(SystemMessage(content=content))
        elif role == "assistant":
            lc_messages.append(AIMessage(content=content))
        else:
            lc_messages.append(HumanMessage(content=content))

    llm = ChatOpenAI(
        model=model,
        api_key=settings.openai_api_key,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    response = await llm.ainvoke(lc_messages)
    content = response.content if hasattr(response, "content") else str(response)
    return {"content": content, "model": model}
