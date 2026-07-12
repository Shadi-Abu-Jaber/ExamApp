# ExamApp — Online Exam Management System

An online examination platform (Hebrew / RTL UI) where **teachers** create, publish, and manage exams and **students** take them and receive auto-graded results instantly.

Full-stack app: **React 19 (Vite) SPA + Express API + PostgreSQL**, with JWT authentication and server-side role/ownership authorization.

> 📄 **Project submission overview:** [SUBMISSION.md](SUBMISSION.md) — features, architecture, diagrams, milestones, and deployment in one place.

## Live demo

- **App:** https://examapp-1-wfnn.onrender.com
- **API:** https://examapp-x6bh.onrender.com

> Hosted on Render's free tier — the API sleeps when idle, so the first request after a period of inactivity may take ~50s to wake up.

### Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Teacher | `teacher@demo.test` | `teacher123` |
| Student | `student@demo.test` | `student123` |

## Features

**Teachers**
- Create, edit, publish, close, and delete exams
- Author multiple-choice questions (2–6 options, one correct answer)
- Dashboard with exam counts by status

**Students**
- Browse published exams and take them
- Answers are submitted and **graded automatically on the server**
- View grades (score, %, pass/fail) and personal stats (average, submissions)

**Platform**
- Register / login with JWT; passwords are bcrypt-hashed
- Role + ownership authorization enforced on the server (never trusts the client)
- Responsive Bootstrap 5 UI (Hebrew / RTL)

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, React Router, Bootstrap 5 |
| Backend | Node.js, Express |
| Database | PostgreSQL (hybrid relational + JSONB) |
| Auth | JWT + bcrypt |
| Infra | Docker (local DB), Render (deployment) |

## Architecture

The client has a **dual-mode data layer**: it runs fully offline against an in-browser mock database (`localStorage`), or in HTTP mode against the Express API — chosen by a single config flag, with every data call funneled through one `ApiGateway` so pages never know which mode is active. The backend is layered `routes → repositories → pg pool`, with JWT middleware and server-side validation and grading.

For a deeper guide (service graph, auth token flow, database design, conventions), see **[CLAUDE.md](CLAUDE.md)**.

## Getting started

### Prerequisites

- Node.js 18+
- Docker (for the local PostgreSQL), or an existing PostgreSQL instance

### 1. Clone

```bash
git clone https://github.com/Shadi-Abu-Jaber/ExamApp.git
cd ExamApp
```

### 2. Backend + database

```bash
cd backend
npm install
cp .env.example .env          # adjust PG_* / JWT_SECRET if needed
npm run db:up                 # start local PostgreSQL in Docker (auto-seeds on first run)
npm run dev                   # API on http://localhost:4000
```

> If host port 5432 is already taken, use another port: `PG_PORT=5433 npm run db:up` and `PG_PORT=5433 npm run dev`.

### 3. Client

```bash
cd client
npm install
npm run dev                   # http://localhost:5173
```

By default the client runs in **mock mode** (no server needed). To talk to the API, create `client/.env`:

```env
VITE_DATA_MODE=http
VITE_SERVER_BASE_URL=http://localhost:4000
```

You can also start both from the repo root: `npm run install:all`, then `npm run dev:server` and `npm run dev:client` (or use the VS Code task **"dev: both (client + server)"**).

## Scripts

Root (delegates to sub-projects): `install:all`, `dev:server`, `dev:client`, `build`, `db:up`, `db:down`.

Backend (`backend/`): `dev`, `start`, `db:up`, `db:down`, `db:reset`, `db:logs`, `db:test`.

Client (`client/`): `dev`, `build`; lint with `npx eslint .`.

There is no automated test suite yet; `backend/db/connect-test.js` (`npm run db:test`) is a DB connectivity smoke test.

## Project structure

```
backend/    Express API — routes, repositories (SQL), auth (JWT+bcrypt),
            middlewares, db.js (pg pool); db/ has schema, seed, Docker setup
client/     React SPA — pages (by role), components, services, api, models, context
docs/       Documentation and diagrams
```

## Deployment

Deployed on **Render**, auto-deploying from `main`: a static site (frontend), a web service (API), and a managed PostgreSQL database. Configuration details are in [CLAUDE.md](CLAUDE.md).

## Development workflow

`main` (release, auto-deploys) ← PRs from `dev` (integration) ← short-lived `feature/*` / `fixbug/*` / `chore/*` branches. Commit messages follow Conventional Commits (`feat(backend): …`, `fix(client/student): …`).

## Roadmap

Planned but not yet implemented: additional question types, teacher review of submissions with manual grading, a separate publish-results step, per-question feedback, and admin management tools.

## Notes

UI copy and code comments are written in Hebrew (RTL) to match the target users. Built for educational purposes as a full-stack course project.
