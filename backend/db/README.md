# Database layer

Hybrid **relational + JSONB** PostgreSQL setup for ExamApp. See [../../docs/database.md](../../docs/database.md) for the schema, ER diagram, and constraints.

## Files

| File | Purpose |
|------|---------|
| `Dockerfile` | PostgreSQL 16 image for local dev — copies `01`/`02` into `docker-entrypoint-initdb.d/` so the DB seeds itself on first start. |
| `DOCKER.md` | Full guide (Hebrew) for running the local DB with Docker (compose or manual) and the three data configurations. |
| `01_schema.sql` | Creates `users` / `exams` / `submissions`; `exams.questions` is JSONB. |
| `02_seed.sql` | Seeds demo data — 2 users (bcrypt-hashed) + 2 exams. |
| `03_queries.sql` | Demo SQL: connectivity, list users/exams, loop over questions with `jsonb_array_elements`. |
| `connect-test.js` | Node script demonstrating the same flow from code (connect → query → loop over JSONB questions). Run via `npm run db:test`. |

## Quick start — local DB with Docker (recommended)

No local PostgreSQL install needed:

```bash
cd backend
npm run db:up      # start Postgres in a container (auto-creates schema + seed)
npm run db:test    # verify connectivity + queries (node db/connect-test.js)
npm run db:down    # stop
```

- If host port **5432 is taken**, run on another port: `PG_PORT=5433 npm run db:up` (and `PG_PORT=5433 npm run dev` for the server).
- The seed is **baked into the image**. After editing `01_schema.sql` / `02_seed.sql`, reseed with `docker compose down -v && docker compose up -d --build` (a plain `db:up` reuses the old volume/image).

Full details and troubleshooting: [DOCKER.md](DOCKER.md).

## Manual — an already-installed PostgreSQL

Requires PostgreSQL 15+ on `127.0.0.1:5432` and a `backend/.env` (copy from `.env.example`).

```bash
# from the repo root
PGPASSWORD='<pwd>' psql -U postgres -h 127.0.0.1 -c "CREATE DATABASE examapp;"
PGPASSWORD='<pwd>' psql -U postgres -h 127.0.0.1 -d examapp -f backend/db/01_schema.sql
PGPASSWORD='<pwd>' psql -U postgres -h 127.0.0.1 -d examapp -f backend/db/02_seed.sql
node backend/db/connect-test.js
```

## Managed / cloud PostgreSQL (e.g. Render)

Set a single `DATABASE_URL` (with TLS) instead of the `PG_*` vars — see [backend/.env.example](../.env.example). The managed database does **not** run the init scripts automatically, so apply `01_schema.sql` then `02_seed.sql` once against it.
