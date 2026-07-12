# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Online exam management system (Hebrew/RTL UI). Teachers create/publish exams; students take them and see auto-graded results. **React 19 (Vite) SPA + Express API + PostgreSQL**, with JWT auth (bcrypt-hashed passwords) and an OOP service layer on the client.

## Commands

Backend (`cd backend`):
- First-time setup: `cp .env.example .env` (adjust `PG_*` / `JWT_SECRET`), then `npm install` and `npm run db:up`.
- `npm run dev` — API with nodemon on `src/server.js` (default `PORT=4000`).
- `npm start` — API without watch.
- `npm run db:up` / `db:down` / `db:reset` / `db:logs` — local PostgreSQL in Docker.
- `npm run db:test` — run `db/connect-test.js` to verify DB connectivity + queries.

Client (`cd client`):
- `npm run dev` — Vite dev server at http://localhost:5173.
- `npm run build` — production build to `client/dist`.
- `npm run lint` (or `npx eslint .`) — lint (flat config in `client/eslint.config.js`; no ESLint setup on the backend).

Tests — **Vitest** in both packages:
- `npm test` in `backend/` (unit tests for password/JWT/id helpers) and in `client/` (models, services, ApiGateway). Tests live in `backend/tests/` and `client/tests/`.
- `npm test` from the repo root runs both. Run a single test file with `npx vitest run <path>` (or `npx vitest` to watch).
- `backend/db/connect-test.js` (`npm run db:test`) is a DB-connectivity smoke test. Beyond the unit tests, verify UI/behavior changes by running the app.

Run both dev servers: VS Code task **"dev: both (client + server)"**, or the **Run & Debug** panel (Debug Server / Debug Client / Debug Both) — see `.vscode/tasks.json` + `launch.json`.

Demo logins: `teacher@demo.test` / `teacher123`, `student@demo.test` / `student123`.

## Repository layout
- `backend/` — Express API. `src/routes` (`/auth`, `/exams`, `/submissions`, `/users`), `src/repositories` (all SQL), `src/auth` (JWT + bcrypt), `src/middlewares`, `src/db.js` (pg pool); `db/` holds schema, seed, Dockerfile, and compose.
- `client/` — React SPA. `src/pages` (split by role: `teacher/`, `student/`, `auth/`), `src/components`, `src/services`, `src/api`, `src/models`, `src/context`.
- `docs/` — system documentation (architecture, database, use cases) with Mermaid diagrams. Frontend deep-dives live in `client/docs/`.
- `.vscode/` — shared workspace tasks + debug launchers.

## Architecture

### Dual-mode data layer (the central design)
The client runs in one of two modes, chosen by `Config.dataMode` (`'mock'` | `'http'`):
- **mock** — fully offline, data in `localStorage` via `client/src/api/mockDb.js`.
- **http** — calls the Express API.

Every data operation goes through the single `client/src/api/ApiGateway.js`, which switches between MockDb and `fetch` internally — **pages and services never know which mode is active**. Mode is set by `VITE_DATA_MODE` (build/dev env, see `client/.env`) or at runtime via `localStorage.setItem('examapp::dataMode','http')` + refresh; API base by `VITE_SERVER_BASE_URL` (default `http://localhost:4000`). When adding a data operation, implement **both** branches in ApiGateway so mock mode keeps working.

### Client service graph (dependency injection)
`client/src/services/ServiceRegistry.js` bootstraps a singleton graph in dependency order (Config → Logger → Storage → Notify → MockDb → ApiGateway → Exam/Submission/AuthService) and injects everything via constructors — no module-level globals. React reaches it through `ServicesContext`/`useServices()`; auth state lives in `AuthContext`/`useAuth()`. Domain logic lives in ES6 model classes (`client/src/models/`: `Exam.publish()`, `Question.isValid()`, `toJSON()`), not in components.

### Auth token flow
In http mode, `/auth/login` and `/auth/register` return `{ token, user }`. `AuthService` persists the token to `Storage`, calls `gateway.setToken()`, and rehydrates it on construct (survives reloads); `ApiGateway` attaches `Authorization: Bearer <token>`. In mock mode there is no token (role gating is client-side only). Keep this split intact when touching auth.

### Backend layering
`routes/ → repositories/ → db.js (pg pool)`, with cross-cutting `middlewares/` (`authRequired`, `requireRole`, `errorHandler`) and `auth/` (`tokens.js` JWT, `password.js` bcrypt). Routes validate + authorize; **all SQL lives in `repositories/`**. Key invariants to preserve:
- **Repositories return the client's shape:** columns aliased to camelCase (`created_by → createdBy`) and `TIMESTAMPTZ` converted to **epoch-ms numbers** so the existing client contract holds. Match this in any new query.
- **Server is authoritative:** `createdBy`/`studentId` come from the JWT (`req.user`), never the request body; exam scores are computed server-side; passwords are stripped before responding.
- **Validation is intentionally duplicated** client (`Question.isValid`) and server (`isValidQuestion` in `routes/exams.js`) — the server re-validates because the client can be bypassed.

### Database
`backend/db/01_schema.sql` — hybrid **relational + JSONB** design: metadata in columns, `exams.questions` and `submissions.answers` as JSONB. Constraints (FK cascade, `UNIQUE(email)`, `CHECK` on role/status), a GIN index on `questions`, and B-tree indexes on submissions. IDs are TEXT generated by the app (`backend/src/ids.js`), not serial.

Two connection modes in `backend/src/db.js`: **`DATABASE_URL` wins** (managed/cloud PG, TLS on) → else discrete `PG_*` vars (local). `server.js` loads `import 'dotenv/config'` first, then **pings the DB on boot and exits** if it can't connect — so the API requires a reachable PostgreSQL in http mode.

## Local database gotchas
- Host port **5432 is often already taken** on this machine → run Docker PG on another port: `PG_PORT=5433 npm run db:up`, and point the server at it (`PG_PORT=5433 npm run dev`).
- **The seed is baked into the Docker image** (`COPY` in `backend/db/Dockerfile`). Editing `01_schema.sql`/`02_seed.sql` does **not** take effect on a plain `db:up` — reseed with `docker compose down -v && docker compose up -d --build`.
- `backend/.env` is gitignored and may hold the user's own (native) PG creds that differ from Docker; override the `PG_*` vars inline when targeting the Docker DB.

## Deployment (Render)
Both services **auto-deploy from `main`**: a **static site** (frontend, rootDir `client/`, build `npm install; npm run build`, publish `dist`, SPA rewrite `/* → /index.html`) and a **web service** (API, rootDir `backend/`, `npm install` / `npm start`), plus a managed Postgres reached over its internal URL. The frontend bakes `VITE_*` env at build time; the API reads `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN` from Render env vars. Pushing to `main` triggers a redeploy.

## Project scope & current status
Course project (full spec in `Docs-and-resources/Project-Requirments.md`), built incrementally. **Implemented:** exam create/edit/publish/close, single-answer multiple-choice questions, student take + **server-side auto-grading**, results + role dashboards, JWT auth with role/ownership authorization, PostgreSQL persistence, Render deployment, Docker (local DB). **Intended but not yet built** (know this before "extending"): multiple question types, teacher review of submissions + manual grading, a separate publish-results step (results are currently immediate), per-question feedback, and an admin role/tools.

## Conventions
- **Code comments and UI copy are in Hebrew (RTL)** — match this style in existing files.
- Bootstrap 5 is loaded via CDN in `client/index.html` (the root `package.json` bootstrap dep is unused).
- Git: `main` (release; auto-deploys to Render) + `dev` (integration). Cut `feature/*` / `fixbug/*` / `chore/*` branches from `dev`, PR them **into `dev`** (review → merge), then release with a `dev → main` PR. Conventional commit messages with scopes (`feat(backend): …`, `fix(client/student): …`).
