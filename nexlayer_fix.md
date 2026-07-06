# Nexlayer working build + deploy fix (authoritative)

This file is the pinned, authoritative solution for this repo. The pipeline uses it
verbatim and will not override it.

## TL;DR

- **Build stage is fixed** — images build cleanly.
- The failure was at **Deploy**, caused by a wrong `nexlayer.yaml` and by collapsing a
  two-service monorepo into a single combined image.
- Fix = **two images, four pods**. Build the backend and frontend from their **own**
  Dockerfiles (do NOT combine them), and deploy the corrected `nexlayer.yaml` below.

## Architecture (do not collapse into one image)

This is a monorepo with two independent services plus two datastores:

| Pod        | Source                  | Port | Route  | Notes |
|------------|-------------------------|------|--------|-------|
| `frontend` | `./frontend/Dockerfile` | 3000 | `/`    | Next.js standalone (`node server.js`) |
| `backend`  | `./backend/Dockerfile`  | 4000 | `/api` | Express API; entrypoint runs `prisma db push` then starts the API |
| `postgres` | `postgres:16-alpine`    | 5432 | —      | stateful, volume + `PGDATA` subdir |
| `redis`    | `redis:7-alpine`        | 6379 | —      | stateful, appendonly volume |

**Build each service from its own Dockerfile** (this is what the
`# filled by pipeline:frontend` / `:backend` image markers select). Do **not** build a
single combined image with one `CMD` — that only starts the frontend and leaves the API
dead, which is what broke the previous deploy.

## Root causes of the failed Deploy (all fixed below)

1. **Backend port mismatch** — service was `3000` while the app listens on `PORT=4000`.
   The health check hit the wrong port → pod never healthy. → `servicePorts: [4000]`.
2. **PostgreSQL misconfigured** — `vars: {}` (no `POSTGRES_USER/PASSWORD/DB`) so the
   container refuses to initialize; no volume and no `PGDATA` subdir; and the
   `DATABASE_URL` pointed at a `app:${POSTGRES_PASSWORD}@…/app` user/db that was never
   created. → real credentials on the pod, matching `DATABASE_URL`, `PGDATA` subdir + volume.
3. **CORS_ORIGIN was `http://localhost:3000`** → the browser origin is the public URL.
   → `CORS_ORIGIN: <% URL %>`.
4. **Frontend `NEXT_PUBLIC_API_URL` was `http://backend.pod:3000`** — `.pod` DNS is not
   reachable from a browser and the port was wrong. It is browser-facing and baked at
   build time. → `NEXT_PUBLIC_API_URL: <% URL %>/api` (routes to the backend pod via `/api`).
5. **Single combined image** — replaced with per-service images (see Architecture).

## Frontend build note

`frontend/Dockerfile` already accepts `ARG NEXT_PUBLIC_API_URL` and bakes it. The pipeline
passes the `NEXT_PUBLIC_API_URL` pod var (`<% URL %>/api`) as the build arg — no Dockerfile
change needed. Peer-dependency and OOM hardening are already in `frontend/Dockerfile`
(`.npmrc` legacy-peer-deps + `--legacy-peer-deps`, telemetry off, larger Node heap).

## Backend build note

`backend/Dockerfile` installs `openssl` (Prisma engine needs it on Alpine) and
`schema.prisma` pins `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]`. The
entrypoint runs `prisma db push` on every boot to create the schema, so the app works even
with `SEED_ON_START=false`.

## Fixed nexlayer.yaml

```yaml
application:
  name: soft-eagle-music-playlist-app
  version: "2.0"
  pods:
    - name: frontend
      image: "# filled by pipeline:frontend" # built from ./frontend/Dockerfile
      path: /
      servicePorts:
        - 3000
      vars:
        NODE_ENV: "production"
        PORT: "3000"
        HOSTNAME: "0.0.0.0"
        NEXT_PUBLIC_API_URL: "<% URL %>/api"
    - name: backend
      image: "# filled by pipeline:backend" # built from ./backend/Dockerfile
      path: /api
      servicePorts:
        - 4000
      vars:
        NODE_ENV: "production"
        PORT: "4000"
        DATABASE_URL: "postgresql://mpa:mpa_password@postgres.pod:5432/music_playlist?schema=public"
        REDIS_URL: "redis://redis.pod:6379"
        CORS_ORIGIN: "<% URL %>"
        JWT_ACCESS_SECRET: "dev_access_secret_change_me"
        JWT_REFRESH_SECRET: "dev_refresh_secret_change_me"
        JWT_ACCESS_EXPIRES: "15m"
        JWT_REFRESH_EXPIRES: "7d"
        SEED_ON_START: "false"
    - name: postgres
      image: mirror.gcr.io/library/postgres:16-alpine
      resourceType: statefulset
      servicePorts:
        - 5432
      vars:
        POSTGRES_USER: "mpa"
        POSTGRES_PASSWORD: "mpa_password"
        POSTGRES_DB: "music_playlist"
        PGDATA: "/var/lib/postgresql/data/pgdata"
      volumes:
        - name: postgres-data
          size: 10Gi
          mountPath: /var/lib/postgresql/data
    - name: redis
      image: mirror.gcr.io/library/redis:7-alpine
      resourceType: statefulset
      servicePorts:
        - 6379
      command: redis-server --appendonly yes
      volumes:
        - name: redis-data
          size: 1Gi
          mountPath: /data
```

_Validated against the Nexlayer schema: **VALID** (only a "preview deployment / no custom
url" informational warning)._
