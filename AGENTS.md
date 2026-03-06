# AGENTS.md

## Cursor Cloud specific instructions

### Architecture Overview
Verdant Foundry is an AI-OS platform with three application services and four infrastructure services. See `README.md` for the full structure and quick start.

### Services

| Service | Port | Tech |
|---|---|---|
| Frontend | 3000 | React 19 + Bun + Tailwind |
| API Gateway | 4000 | NestJS + Fastify + Prisma |
| AI Engine | 8000 | FastAPI + LangChain |
| PostgreSQL | 5433 | Docker (required) |
| Redis | 6379 | Docker (optional - real-time streaming) |
| RabbitMQ | 5672 | Docker (optional - async tasks) |
| Qdrant | 6333 | Docker (optional - vector search) |

### Starting Infrastructure
```bash
sudo dockerd &>/tmp/dockerd.log &  # if dockerd not running
sudo docker compose up -d           # starts all 4 infra services
```

### Starting Application Services
```bash
# API Gateway (must run Prisma migrate on first setup)
cd backend/api-gateway && npm run start:dev

# AI Engine
cd backend/ai-engine && source .venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend
cd frontend && bun run dev
```

### Key Gotchas
- **API Gateway npm install** requires `--legacy-peer-deps` due to `@nestjs/config` peer dependency conflict with NestJS 11.
- **Frontend** uses `bun` (lockfile is `bun.lock`). The `@types/bun` package must be installed for `bun run lint` (tsc) to pass.
- **AI Engine** needs `python3.12-venv` system package to create a virtualenv.
- **PostgreSQL** runs on port **5433** (not default 5432).
- **.env** files: copy `.env.example` -> `.env` (root) and `frontend/.env.example` -> `frontend/.env`. The API Gateway also reads from `backend/api-gateway/.env` (copy root `.env` there).
- **Redis/RabbitMQ** failures are non-fatal; the API Gateway logs warnings but continues. Core CRUD works without them.
- **ESLint** for the API Gateway has pre-existing type-safety warnings (the codebase compiles and runs fine).
- **Jest** for the API Gateway unit tests requires a jest config with `ts-jest` transform (the e2e config at `test/jest-e2e.json` has this, but there is no root jest config for unit tests).

### Lint / Test / Build Commands
- **API Gateway**: `npm run lint`, `npm test`, `npm run build` (in `backend/api-gateway/`)
- **Frontend**: `bun run lint` (runs `tsc --noEmit`, in `frontend/`)
- **AI Engine**: `source .venv/bin/activate && python -m pytest` (in `backend/ai-engine/`)
