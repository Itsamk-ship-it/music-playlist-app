# 🎵 Playlistr — Full-Stack Music Playlist App

A production-style, **Spotify-inspired playlist manager** (metadata only — no music streaming). Create,
organize, and share playlists; discover public feeds; like, favorite, comment, and follow. Built to run
**100% free and locally** with a single command — no paid APIs or external services.

```bash
docker compose up
```

Then open **http://localhost:3000** and log in with the seeded demo account:

| Email            | Password       |
| ---------------- | -------------- |
| `admin@mpa.dev`  | `Password123!` |
| `user1@mpa.dev`  | `Password123!` |

> API runs at **http://localhost:4000/api** · Swagger docs at **http://localhost:4000/api/docs**

---

## ✨ Tech Stack

| Layer        | Technology                                                                  |
| ------------ | --------------------------------------------------------------------------- |
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Zustand, React Hook Form, Zod, dnd-kit |
| **Backend**  | Node.js, Express, Prisma ORM, JWT (access + refresh), bcrypt, Zod, Helmet, Swagger |
| **Database** | PostgreSQL 16                                                               |
| **Cache**    | Redis 7 (response cache, trending, search cache, dashboard cache, sessions, rate limiting) |
| **Infra**    | Docker + Docker Compose                                                     |

---

## 🚀 Quick Start

### Option 1 — Docker (recommended)

```bash
git clone <repo> && cd music-playlist-app
cp .env.example .env          # optional — sane defaults are baked in
docker compose up --build
```

On first boot the backend automatically:

1. Applies the Prisma schema to PostgreSQL (`prisma db push`).
2. Seeds the database (500 songs, 100 playlists, 21 users, likes, comments…).

The frontend, backend, PostgreSQL, and Redis all start together. To reset everything:

```bash
docker compose down -v        # -v also wipes the postgres/redis volumes
```

### Option 2 — Local development (without Docker)

Requires local PostgreSQL and Redis running.

```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run prisma:push          # create tables
npm run seed                 # load demo data
npm run dev                  # http://localhost:4000

# Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                  # http://localhost:3000
```

---

## 🗂️ Project Structure

```
music-playlist-app/
├── docker-compose.yml          # postgres · redis · backend · frontend
├── .env.example                # single source of truth for env vars
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # 12+ normalized models, FKs, indexes
│   │   └── seed.ts              # demo data generator (500 songs, …)
│   ├── src/
│   │   ├── config/              # env, prisma, redis, swagger
│   │   ├── middleware/          # auth, validate (zod), rate limit, error
│   │   ├── services/            # business logic (service layer)
│   │   ├── routes/              # REST controllers + OpenAPI annotations
│   │   ├── utils/               # jwt, errors, pagination, respond
│   │   ├── validators/          # shared Zod schemas
│   │   ├── app.ts               # express app assembly
│   │   └── server.ts            # bootstrap + graceful shutdown
│   └── Dockerfile
└── frontend/
    ├── src/
    │   ├── app/                 # App Router: (auth) + (app) route groups
    │   ├── components/          # ui/ (shadcn), layout/, playlist/, cards…
    │   ├── hooks/               # TanStack Query hooks, debounce, search
    │   ├── lib/                 # api client, types, zod schemas, utils
    │   └── store/               # Zustand auth store
    └── Dockerfile
```

The backend follows a **layered / repository-service pattern**: routes handle HTTP concerns, services
own business logic and caching, and Prisma is the data-access layer.

---

## 🔐 Authentication Flow

- **Access token** (JWT, 15 min) returned to the client and sent as `Authorization: Bearer …`.
- **Refresh token** (JWT, 7 days) stored in an **httpOnly cookie** *and* mirrored in Redis + Postgres
  `sessions` for fast validation and revocation.
- On a `401`, the frontend transparently calls `/auth/refresh` once and retries the request.
- Passwords hashed with **bcrypt** (cost 12). Changing a password revokes all sessions.
- **Forgot password** is UI-only (no email provider in the free/local setup) and never leaks whether an
  account exists.

---

## ⚡ How Redis Is Used

Redis is **functional, not decorative**:

| Use case            | Implementation                                                        |
| ------------------- | --------------------------------------------------------------------- |
| Response cache      | Playlist detail pages cached (`cacheAside`) and invalidated on writes |
| Trending / Explore  | Explore feeds cached per feed + page                                  |
| Search cache        | Popular search queries cached for 45s                                 |
| Dashboard cache     | Aggregated user stats cached for 30s                                  |
| Session store       | Refresh tokens mirrored for fast validation & revocation              |
| Rate limiting       | `express-rate-limit` + `rate-limit-redis` (global, auth, search tiers)|

Caching **fails open** — if Redis is down the app still works, just uncached.

---

## 📚 API Overview

Full interactive docs (Swagger UI): **http://localhost:4000/api/docs**

| Group          | Endpoints                                                                |
| -------------- | ------------------------------------------------------------------------ |
| Auth           | `POST /auth/register · login · refresh · logout · change-password · forgot-password` |
| Users          | `GET /users/me` · `PATCH /users/me` · `GET /users/:username` · `POST /users/:username/follow` |
| Songs          | `GET /songs` · `GET /songs/:id` · `POST /songs/:id/play`                  |
| Artists/Albums | `GET /artists` · `GET /artists/:id` · `GET /albums` · `GET /albums/:id`   |
| Playlists      | `POST/PATCH/DELETE /playlists` · `/explore` · `/duplicate` · `/songs` · `/reorder` · `/comments` |
| Comments       | `POST /comments` · `PATCH/DELETE /comments/:id`                          |
| Likes          | `POST /likes/toggle` (song · playlist · comment)                         |
| Favorites      | `POST /favorites/toggle` · `GET /favorites/songs` · `/favorites/playlists`|
| Search         | `GET /search?q=&type=` · `GET /search/genres`                            |
| Dashboard      | `GET /dashboard`                                                         |
| Notifications  | `GET /notifications` · `POST /:id/read` · `/read-all`                    |
| Health         | `GET /health` (db + redis status)                                        |

Responses use a consistent envelope: `{ "data": … }` and `{ "data": [...], "meta": { pagination } }`.

---

## 🎨 Features

- **Dashboard** — total playlists, favorites, public playlists, total likes, recently played & created.
- **Playlists** — create/edit/delete/duplicate, public/private, cover + description, **drag-and-drop
  song reordering** (dnd-kit), add/remove songs, views & likes.
- **Explore** — Trending / New / Most Liked / Recently Updated / Featured feeds with pagination.
- **Search** — global, debounced, multi-entity (songs, artists, albums, playlists, users) with a live
  dropdown and a full results page with type filters.
- **Social** — likes (songs, playlists, comments), favorites, comments (add/edit/delete/like), follows,
  notifications.
- **Profiles** — avatar, bio, favorite genre, public/private, playlist & like counts, follow button.
- **UX** — loading skeletons, toasts (sonner), confirmation dialogs, empty/error states, infinite
  scroll / load-more, **dark & light mode**, fully responsive sidebar + top nav.

---

## 🛡️ Security

JWT auth · bcrypt password hashing · Helmet security headers · CORS allow-list · Zod input validation
(frontend **and** backend) · parameterized queries via Prisma (SQL-injection safe) · Redis-backed rate
limiting · httpOnly refresh cookies.

---

## 🧰 Environment Variables

See [`.env.example`](.env.example). Every variable has a working local default, so `docker compose up`
works with no configuration. **Change the JWT secrets before deploying anywhere public.**

---

## 🧪 Code Quality

TypeScript end-to-end · ESLint + Prettier in both packages · service/repository layering on the backend
· reusable hooks and components on the frontend · shared validation schemas.

---

## 📝 Notes & Limitations

- **No audio streaming** by design — songs are metadata only (title, artist, album, genre, duration…).
- Images use free, key-less services (`picsum.photos`, `dicebear`) so seeding needs internet the first
  time. Nothing else calls an external API.
- The seed script is destructive: it clears existing rows before inserting.
- `prisma db push` is used (no migration history) to keep the demo one-command simple. For a real
  deployment, switch to `prisma migrate`.

Enjoy building playlists! 🎧
