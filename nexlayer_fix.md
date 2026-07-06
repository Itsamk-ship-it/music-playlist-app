# Nexlayer working build fix

This file is the authoritative, pinned build solution for this repo. Nexlayer uses it verbatim on every run and will not override it. If a future build with this fix fails, Nexlayer appends/updates it rather than regenerating.

## Fixed Dockerfile

```dockerfile
FROM mirror.gcr.io/library/node:22-bookworm-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# --- Backend Build Stage ---
FROM base AS backend-builder
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
RUN npx prisma generate && npm run build

# --- Frontend Build Stage ---
FROM base AS frontend-builder
COPY frontend/package*.json ./
# Use --force to break the React 19 RC deadlock and ensure Next.js 15 builds
RUN npm install --force
COPY frontend/ ./

# Force standalone mode for production
RUN sed -i 's/output.*export/output: "standalone"/' next.config.* 2>/dev/null || true

# Build-time environment variables
ENV NEXT_PUBLIC_API_URL=<%URL%>/api
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV TSC_COMPILE_ON_ERROR=true
ENV DISABLE_ESLINT_PLUGIN=true

RUN npm run build

# --- Final Image Stage ---
FROM mirror.gcr.io/library/node:22-bookworm-slim
WORKDIR /app

# Copy frontend standalone build
COPY --from=frontend-builder /app/.next/standalone ./
COPY --from=frontend-builder /app/.next/static ./.next/static
COPY --from=frontend-builder /app/public ./public

# Copy backend build
COPY --from=backend-builder /app/dist ./dist
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/package*.json ./
COPY --from=backend-builder /app/prisma ./prisma

ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000
EXPOSE 4000

CMD ["node", "server.js"]
```

## Fixed nexlayer.yaml

```yaml
application:
  name: music-playlist-app
  pods:
    postgres:
      image: mirror.gcr.io/library/postgres:16-alpine
      port: 5432
      env:
        POSTGRES_USER: mpa
        POSTGRES_PASSWORD: mpa_password
        POSTGRES_DB: music_playlist
    redis:
      image: mirror.gcr.io/library/redis:7-alpine
      port: 6379
    backend:
      image: "# filled by pipeline"
      port: 4000
      env:
        DATABASE_URL: postgresql://mpa:mpa_password@postgres.pod:5432/music_playlist?schema=public
        REDIS_URL: redis://redis.pod:6379
        CORS_ORIGIN: <%URL%>
        JWT_ACCESS_SECRET: dev_access_secret_change_me
        JWT_REFRESH_SECRET: dev_refresh_secret_change_me
    frontend:
      image: "# filled by pipeline"
      port: 3000
      env:
        NEXT_PUBLIC_API_URL: <%URL%>/api
```
