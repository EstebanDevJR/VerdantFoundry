# Verdant Foundry

AI-OS (AI Operating System) - Frontend + Backend microservices.

## Structure

```
VerdantFoundry/
├── frontend/          # React + Vite + Tailwind + Zustand
├── backend/
│   ├── api-gateway/   # NestJS + Fastify (Auth, CRUD, Dashboard, Kernel, etc.)
│   └── ai-engine/     # FastAPI (LLM, RAG, tool execution)
├── docker-compose.yml # PostgreSQL, Redis, RabbitMQ, Qdrant
└── .env.example
```

## Quick Start

1. **Start infrastructure** (requires Docker):
   ```bash
   docker-compose up -d
   ```

2. **API Gateway**:
   ```bash
   cd backend/api-gateway
   npm install
   npx prisma migrate dev
   npm run start:dev
   ```

3. **AI Engine**:
   ```bash
   cd backend/ai-engine
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```

4. **Frontend**:
   ```bash
   cd frontend
   bun install  # or npm install
   bun run dev
   ```

Create a user via `POST /api/auth/register` and use the token in the frontend (or add a login UI).
