from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    port: int = 8000
    qdrant_url: str = "http://localhost:6333"
    qdrant_collection: str = "verdant_memory"
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    google_gemini_api_key: str | None = None
    default_llm_provider: str = "openai"
    default_llm_model: str = "gpt-4o-mini"
    embedding_model: str = "text-embedding-3-small"
    rabbitmq_url: str = "amqp://verdant:verdant_secret@localhost:5672"
    rabbitmq_research_queue: str = "research.tasks"
    rabbitmq_simulation_queue: str = "simulation.tasks"
    rabbitmq_experiment_queue: str = "experiment.tasks"
    rabbitmq_memory_queue: str = "verdant.memory"
    core_api_url: str = "http://localhost:4000/api"
    redis_url: str = "redis://localhost:6379"
    internal_api_secret: str = "verdant-internal-secret"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
