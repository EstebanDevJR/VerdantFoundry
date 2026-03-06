# Verdant Foundry Backend

Microservices backend for Verdant Foundry AI-OS.

## Architecture

- **api-gateway** (NestJS + Fastify): Auth, CRUD, Dashboard, Kernel, Memory, Research, Evolution, Reports
- **ai-engine** (FastAPI): LLM integration, RAG, tool execution (placeholder implementations)

## Prerequisites

- Node.js 18+
- Python 3.11+
- Docker & Docker Compose (for PostgreSQL, Redis, RabbitMQ, Qdrant)

## Quick Start

### 1. Start infrastructure

```bash
docker-compose up -d postgres redis rabbitmq qdrant
```

### 2. API Gateway

```bash
cd backend/api-gateway
cp ../.env.example .env   # or use root .env.example
npm install
npx prisma migrate dev    # create tables
npm run start:dev         # http://localhost:4000
```

### 3. AI Engine

```bash
cd backend/ai-engine
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 4. Frontend

```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:4000/api
bun run dev
```

## API Endpoints

| Prefix | Description |
|--------|-------------|
| `/api/auth` | Login, register, refresh |
| `/api/users` | Profile, API keys |
| `/api/dashboard` | Stats, activity, performance, health |
| `/api/kernel` | Metrics, processes, logs, network |
| `/api/agents` | CRUD, actions |
| `/api/tools` | CRUD |
| `/api/memory` | Documents, search, graph |
| `/api/research` | Start, list, report, logs |
| `/api/evolution` | Simulations, experiments, feedback |
| `/api/reports` | CRUD, themes, export |

## Environment

See root `.env.example` and `backend/api-gateway/.env` for required variables.
