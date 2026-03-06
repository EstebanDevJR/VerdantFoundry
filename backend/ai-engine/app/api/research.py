from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class StartResearchRequest(BaseModel):
    research_id: str
    query: str
    depth: str = "standard"
    focus: str = "general"
    user_id: str


@router.post("/start")
async def start_research(request: StartResearchRequest):
    # Placeholder: will consume from RabbitMQ and run pipeline
    return {
        "research_id": request.research_id,
        "status": "queued",
        "message": "Research pipeline placeholder",
    }
