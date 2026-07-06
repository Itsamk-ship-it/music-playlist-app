# Nexlayer — music-playlist-app

<!-- nexlayer:meta version=1 analyzed=2026-07-06T17:20:14Z repo=https://github.com/Itsamk-ship-it/music-playlist-app branch=nexlayer -->

> **For AI agents (Claude Code, Cursor, Gemini CLI, Copilot):**
> This file is the **project context** for this Nexlayer deployment — tech stack, env vars, secrets, live URL.
> For full platform detail (nexlayer.yaml schema, Dockerfile rules, CI/CD, task recipes) read **`nexlayer.skills`** in this repo.
>
> **Critical rules (full detail in `nexlayer.skills`):**
> - Inter-pod refs: `${podName:port}` only — never `localhost` or bare hostnames
> - Docker Hub images: prefix with `mirror.gcr.io/library/` — bare tags fail on the cluster
> - Secrets: set in the Nexlayer dashboard — never commit to `nexlayer.yaml` or Dockerfile
>
> **This file:** `agent-managed` sections update automatically. `user-editable` sections (Local Development Setup, Nexlayer Deployment Plan, Build Notes) are yours — preserved across re-analysis.

## Project Summary
<!-- nexlayer:section agent-managed=project_summary -->
A full-stack music playlist management application featuring user accounts, playlist organization, and a discovery feed. It utilizes a Next.js frontend, Express backend, PostgreSQL database, and Redis for caching and session management.
<!-- nexlayer:end -->

## Technology Stack
<!-- nexlayer:section agent-managed=tech_stack -->
| Name | Kind | Version | Detected From |
|------|------|---------|---------------|
| Next.js | framework | 15 | README.md, docker-compose.yml |
| Node.js | language | 22 | docker-compose.yml |
| Express | framework | latest | README.md |
| PostgreSQL | database | 16 | README.md, docker-compose.yml |
| Redis | database | 7 | README.md, docker-compose.yml |
| Prisma | tool | latest | README.md |
<!-- nexlayer:end -->

## Repository Structure
<!-- nexlayer:section agent-managed=structure_map -->
- frontend/ — Next.js 15 App Router frontend
- backend/ — Node.js Express API with Prisma ORM
- docker-compose.yml — Orchestration for local development
<!-- nexlayer:end -->

## External Services Required
<!-- nexlayer:section agent-managed=external_deps -->
_No external services detected._
<!-- nexlayer:end -->

## Local Development Setup
<!-- nexlayer:section user-editable=local_setup -->
### Prerequisites

- Node.js >= 20
- Docker & Docker Compose

### Environment variables

Copy `.env.example` to `.env.local` and fill in:

```
DATABASE_URL=postgresql://mpa:mpa_password@localhost:5432/music_playlist?schema=public
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### Steps

1. `cp .env.example .env` — Setup environment variables
2. `docker compose up --build` — Start all services (Postgres, Redis, Backend, Frontend)

<!-- nexlayer:end -->

## Nexlayer Setup
<!-- nexlayer:section agent-managed=nexlayer_setup -->
### Pod Environment Variables

| Pod | Variable | Value | Kind |
|-----|----------|-------|------|
| `backend` | `CORS_ORIGIN` | `"http://localhost:3000"` | plain |
| `backend` | `DATABASE_URL` | `"postgresql://app:${POSTGRES_PASSWORD}@postgres.pod:5432/app"` | inter-pod |
| `backend` | `JWT_ACCESS_EXPIRES` | `"${JWT_ACCESS_EXPIRES}"` | inter-pod |
| `backend` | `JWT_ACCESS_SECRET` | `"${JWT_ACCESS_SECRET}"` | inter-pod |
| `backend` | `JWT_REFRESH_EXPIRES` | `"${JWT_REFRESH_EXPIRES}"` | inter-pod |
| `backend` | `JWT_REFRESH_SECRET` | `"${JWT_REFRESH_SECRET}"` | inter-pod |
| `backend` | `NODE_ENV` | `"development"` | plain |
| `backend` | `PORT` | `"4000"` | plain |
| `backend` | `REDIS_URL` | `"redis://redis.pod:6379"` | plain |
| `backend` | `SEED_ON_START` | `"false"` | plain |
| `frontend` | `API_URL` | `"http://backend.pod:3000"` | plain |
| `frontend` | `NEXT_PUBLIC_API_URL` | `"http://backend.pod:3000"` | plain |
| `frontend` | `VITE_API_URL` | `"http://backend.pod:3000"` | plain |

### nexlayer.yaml

```yaml
application:
  name: soft-eagle-music-playlist-app
  pods:
    - name: backend
      image: "registry.nexlayer.io/user_01kdnss9re3ack631zmxgpra36/music-playlist-app-backend:9f38716-fix6"
      path: /api
      servicePorts:
        - 3000
      vars:
        CORS_ORIGIN: "http://localhost:3000"
        DATABASE_URL: "postgresql://app:${POSTGRES_PASSWORD}@postgres.pod:5432/app"
        JWT_ACCESS_EXPIRES: "${JWT_ACCESS_EXPIRES}"
        JWT_ACCESS_SECRET: "${JWT_ACCESS_SECRET}"
        JWT_REFRESH_EXPIRES: "${JWT_REFRESH_EXPIRES}"
        JWT_REFRESH_SECRET: "${JWT_REFRESH_SECRET}"
        NODE_ENV: "development"
        PORT: "4000"
        REDIS_URL: "redis://redis.pod:6379"
        SEED_ON_START: "false"
    - name: frontend
      image: "registry.nexlayer.io/user_01kdnss9re3ack631zmxgpra36/music-playlist-app-frontend:9f38716-fix6"
      path: /
      servicePorts:
        - 3000
      vars:
        API_URL: "http://backend.pod:3000"
        NEXT_PUBLIC_API_URL: "http://backend.pod:3000"
        VITE_API_URL: "http://backend.pod:3000"
    - name: postgres
      image: mirror.gcr.io/library/postgres:16-alpine
      servicePorts:
        - 5432
      vars: {}
    - name: redis
      image: mirror.gcr.io/library/redis:7-alpine
      servicePorts:
        - 6379
      vars: {}
```

<!-- nexlayer:end -->

## Nexlayer Deployment Plan
<!-- nexlayer:section user-editable=deployment_plan -->
### Pod Topology

| Pod | Image | Port | Role |
|-----|-------|------|------|
| postgres | mirror.gcr.io/library/postgres:16-alpine | 5432 | database |
| redis | mirror.gcr.io/library/redis:7-alpine | 6379 | cache |
| backend | mirror.gcr.io/library/node:22-alpine | 4000 | web |
| frontend | mirror.gcr.io/library/node:22-alpine | 3000 | web |

### Deployment notes

- Backend communicates with DB via postgres.pod:5432 and Cache via redis.pod:6379
- Frontend communicates with API via backend.pod:4000
- To fix the Next.js build error reported in nexlayer_error.md, the build command must use --legacy-peer-deps due to React 19 and Next.js 15 dependency conflicts.

<!-- nexlayer:end -->

## Build Notes
<!-- nexlayer:section user-editable=build_notes -->
<!-- Add notes for future builds here — preserved across re-analysis -->
<!-- nexlayer:end -->

## Nexlayer Configuration
<!-- nexlayer:section agent-managed=nexlayer_config -->
**Last deployed:** 2026-07-06T17:40:18Z  
**Live URL:** https://vibrant-wasp-soft-eagle-music-playlist-app.cloud.nexlayer.ai  
**Runtime:** multi · **Port:** 3000  
**Deploy branch:** nexlayer  

```yaml
application:
  name: soft-eagle-music-playlist-app
  pods:
    - name: backend
      image: "registry.nexlayer.io/user_01kdnss9re3ack631zmxgpra36/music-playlist-app-backend:9f38716-fix6"
      path: /api
      servicePorts:
        - 3000
      vars:
        CORS_ORIGIN: "http://localhost:3000"
        DATABASE_URL: "postgresql://app:${POSTGRES_PASSWORD}@postgres.pod:5432/app"
        JWT_ACCESS_EXPIRES: "${JWT_ACCESS_EXPIRES}"
        JWT_ACCESS_SECRET: "${JWT_ACCESS_SECRET}"
        JWT_REFRESH_EXPIRES: "${JWT_REFRESH_EXPIRES}"
        JWT_REFRESH_SECRET: "${JWT_REFRESH_SECRET}"
        NODE_ENV: "development"
        PORT: "4000"
        REDIS_URL: "redis://redis.pod:6379"
        SEED_ON_START: "false"
    - name: frontend
      image: "registry.nexlayer.io/user_01kdnss9re3ack631zmxgpra36/music-playlist-app-frontend:9f38716-fix6"
      path: /
      servicePorts:
        - 3000
      vars:
        API_URL: "http://backend.pod:3000"
        NEXT_PUBLIC_API_URL: "http://backend.pod:3000"
        VITE_API_URL: "http://backend.pod:3000"
    - name: postgres
      image: mirror.gcr.io/library/postgres:16-alpine
      servicePorts:
        - 5432
      vars: {}
    - name: redis
      image: mirror.gcr.io/library/redis:7-alpine
      servicePorts:
        - 6379
      vars: {}
```
<!-- nexlayer:end -->

## Build History
<!-- nexlayer:section agent-managed=build_history -->
| Date | Status | Notes |
|------|--------|-------|
| 2026-07-06T17:20:14Z | analyzed | initial repo analysis |
| 2026-07-06T17:40:18Z | success | deployed https://vibrant-wasp-soft-eagle-music-playlist-app.cloud.nexlayer.ai |
<!-- nexlayer:end -->
