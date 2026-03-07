import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import health, llm, memory, research, tools
from app.workers.research_consumer import run_research_consumer
from app.workers.simulation_consumer import run_simulation_consumer
from app.workers.experiment_consumer import run_experiment_consumer
from app.workers.memory_consumer import run_memory_consumer


@asynccontextmanager
async def lifespan(app: FastAPI):
    research_task = asyncio.create_task(run_research_consumer())
    simulation_task = asyncio.create_task(run_simulation_consumer())
    experiment_task = asyncio.create_task(run_experiment_consumer())
    memory_task = asyncio.create_task(run_memory_consumer())
    yield
    for task in (research_task, simulation_task, experiment_task, memory_task):
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            pass


app = FastAPI(
    title="Verdant AI Engine",
    description="Agent & AI Engine for Verdant Foundry",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(llm.router, prefix="/llm", tags=["llm"])
app.include_router(memory.router, prefix="/memory", tags=["memory"])
app.include_router(research.router, prefix="/research", tags=["research"])
app.include_router(tools.router, prefix="/tools", tags=["tools"])


@app.get("/")
async def root():
    return {"service": "verdant-ai-engine", "status": "running"}
