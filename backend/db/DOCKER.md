# ExamApp — Local PostgreSQL with Docker

A guide to running a local database (PostgreSQL) with Docker: Postgres runs inside Docker while Node/Express runs on the host and connects to it via `localhost:5432`.

---

## Three ways to work with data (data configurations)

The project supports three setups. The same `PG_*` variables serve all of them — only the values change:

| # | Configuration | When to use | How to enable |
|---|---------------|-------------|---------------|
| 1 | **Mock (no DB)** | Fast, offline development | Client in `dataMode: 'mock'` (default) — no server or database needed |
| 2 | **Remote / managed DB** | Cloud or shared database | Set `DATABASE_URL` (TLS), or point the `PG_*` vars at the remote host, in `backend/.env` |
| 3 | **Local DB (Docker)** | Developing against a real Postgres | `npm run db:up` (see below) |

> The client switches between "mock" and "server" via `VITE_DATA_MODE=mock|http` (or `localStorage['examapp::dataMode']`). See `CLAUDE.md`. In http mode the server requires a reachable PostgreSQL — local (config 3) or remote (config 2).

---

## Prerequisites

* Docker installed and running (`docker --version`).
* A `backend/.env` file (copy from `backend/.env.example`).
* Once: `cd backend && npm install` (installs the `pg` package).

---

## Option A — Docker Compose (recommended)

From the `backend/` directory:

```bash
npm run db:up        # docker compose up -d  (builds the image on first run)
npm run db:test      # node db/connect-test.js — verifies connection + queries
npm run db:logs      # live DB logs
npm run db:down      # stop (data is kept in the volume)
npm run db:reset     # wipe data + bring back up (re-runs the init scripts)
```

Benefits: a named volume persists data across runs, there is a healthcheck, and the host port is configurable via `PG_PORT`.

---

## Option B — Docker "manually" (without compose)

From the `backend/` directory:

```bash
# 1. Build the image from ./db/Dockerfile
docker build -t examapp-postgres ./db

# 2. Run the container (publishes port 5432 to the host)
docker run --name examapp-pg -p 5432:5432 -d examapp-postgres

# 3. Check the container is running
docker ps

# 4. Verify connection + fetch data from Node
node db/connect-test.js

# Stop and clean up
docker stop examapp-pg && docker rm examapp-pg
```

---

## What happens on first startup?

The `postgres:16` image automatically runs every `*.sql` file in `/docker-entrypoint-initdb.d/` (in alphabetical order), but **only when the data directory is empty**:

1. `01_schema.sql` — creates the `users` / `exams` / `submissions` tables (the `questions` column is `JSONB` — the hybrid model).
2. `02_seed.sql` — seeds 2 demo users + 2 demo exams.

So as soon as the container comes up, `examapp` is populated and ready. To re-run the init scripts (e.g. after a schema change), use `npm run db:reset` (which removes the volume).

Connection details baked into the image (matching `.env.example`):

```
host=localhost  port=5432  user=postgres  password=postgres  database=examapp
```

---

## Troubleshooting

* **`port is already allocated` / connection fails** — a local Postgres is already running on 5432. Bring Docker up on another port:
  ```bash
  PG_PORT=5433 npm run db:up      # then set PG_PORT=5433 in backend/.env
  ```
* **Schema change not picked up** — the init scripts only run against an empty data directory. Run `npm run db:reset` to drop the volume and re-seed. (If you changed `01`/`02` themselves, also rebuild the image: `docker compose down -v && docker compose up -d --build`.)
* **`password authentication failed`** — make sure `PG_PASSWORD` in `backend/.env` matches the container's (default `postgres`).
