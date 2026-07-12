# Architecture

ExamApp is a client–server application. The **client** (`client/`) is a React SPA that can run standalone against an in-browser mock database or talk to the **server** (`backend/`), an Express API backed by PostgreSQL.

## System overview

```mermaid
flowchart LR
  subgraph Browser["Browser — React SPA (client/)"]
    Pages["Pages & Components"] --> Services["ExamService / SubmissionService / AuthService"]
    Services --> Gateway["ApiGateway<br/>(single data entry point)"]
    Gateway -.->|mock mode| Mock["MockDb → localStorage"]
  end

  Gateway -->|"http mode: fetch + Bearer JWT"| API

  subgraph Server["Server (Render web service)"]
    API["Express API"] --> MW["middlewares<br/>authRequired / requireRole"]
    MW --> Routes["routes/"]
    Routes --> Repos["repositories/"]
    Repos --> Pool["pg pool (db.js)"]
  end

  Pool --> DB[("PostgreSQL")]
```

### Dual-mode data layer (the central design)

The client runs in one of two modes, chosen by `Config.dataMode` (`'mock'` | `'http'`):

- **mock** — fully offline; data lives in `localStorage` via `client/src/api/mockDb.js`.
- **http** — calls the Express API.

Every data operation goes through the single `client/src/api/ApiGateway.js`, which switches between MockDb and `fetch` internally, so **pages and services never know which mode is active**. The mode is set by the `VITE_DATA_MODE` env var (see `client/.env`) or at runtime via `localStorage.setItem('examapp::dataMode','http')`; the API base URL comes from `VITE_SERVER_BASE_URL` (default `http://localhost:4000`).

## Client service graph (dependency injection)

`client/src/services/ServiceRegistry.js` bootstraps a singleton graph in dependency order and injects every service through constructors — there are no module-level globals. React reaches the graph through `ServicesContext` (`useServices()`); auth state lives in `AuthContext` (`useAuth()`).

```mermaid
flowchart TD
  Registry["ServiceRegistry (singleton)"]
  Registry --> Config
  Registry --> Logger
  Registry --> Storage
  Registry --> Notify
  Registry --> MockDb

  Config --> Gateway["ApiGateway"]
  MockDb --> Gateway
  Storage --> Auth["AuthService"]

  Gateway --> ExamSvc["ExamService"]
  Gateway --> SubSvc["SubmissionService"]
  Gateway --> Auth

  ExamSvc --> Ctx["ServicesContext / useServices()"]
  SubSvc --> Ctx
  Auth --> AuthCtx["AuthContext / useAuth()"]
```

Domain logic lives in ES6 model classes (`client/src/models/`: `Exam`, `Question`, `User`, `Submission`) with methods like `Exam.publish()`, `Question.isValid()`, and `toJSON()` — not in components.

## Backend layering

Requests flow `routes/ → repositories/ → db.js (pg pool)`, with cross-cutting `middlewares/` and `auth/` helpers.

| Layer | Responsibility |
|-------|----------------|
| `routes/` (`auth`, `exams`, `submissions`, `users`) | Validate input, authorize, orchestrate |
| `middlewares/` (`authRequired`, `requireRole`, `errorHandler`) | Verify JWT → `req.user`; guard by role; normalize errors |
| `auth/` (`tokens.js`, `password.js`) | JWT sign/verify; bcrypt hash/compare |
| `repositories/` (`usersRepo`, `examsRepo`, `submissionsRepo`) | **All SQL** — the only place queries live |
| `db.js` | `pg` connection pool + `ping()` |

Invariants worth preserving:

- **Repositories return the client's shape** — columns are aliased to camelCase (`created_by → createdBy`) and `TIMESTAMPTZ` is converted to epoch-ms numbers.
- **The server is authoritative** — `createdBy` / `studentId` come from the JWT (never the request body), exam scores are computed server-side, and passwords are stripped before responding.
- **Validation is intentionally duplicated** on client (`Question.isValid`) and server (`isValidQuestion`) because the client can be bypassed.

## Auth token flow

```mermaid
sequenceDiagram
  actor U as User
  participant A as AuthService (client)
  participant G as ApiGateway
  participant S as Express /auth/login
  participant DB as PostgreSQL

  U->>A: login(email, password)
  A->>G: login(...)
  G->>S: POST /auth/login
  S->>DB: findByEmail(email)
  DB-->>S: user row (bcrypt hash)
  S->>S: bcrypt.compare + sign JWT
  S-->>G: { token, user }
  G-->>A: { user, token }
  A->>A: Storage.set(token) + gateway.setToken()
  A-->>U: user profile
```

On reload, `AuthService` rehydrates the stored token onto the gateway, so `ApiGateway` keeps attaching `Authorization: Bearer <token>`. In mock mode there is no token (role gating is client-side only).

## Request lifecycle — submitting an exam

```mermaid
sequenceDiagram
  participant C as Client (ExamTakerPage)
  participant G as ApiGateway (Bearer JWT)
  participant M as authRequired + requireRole student
  participant R as submissions route + repo
  participant DB as PostgreSQL

  C->>G: submit({ examId, answers })
  G->>M: POST /submissions
  M->>M: verify JWT → req.user
  M->>R: authorized (student)
  R->>DB: load exam (with questions)
  R->>R: compute score server-side
  R->>DB: insert submission
  DB-->>R: submission row
  R-->>C: { score, total, ... }
```

## Database connection modes

`backend/src/db.js` picks a connection at startup:

- **`DATABASE_URL` wins** (managed / cloud PostgreSQL such as Render) — a single connection string with TLS.
- Otherwise, discrete **`PG_*`** vars (local Docker / native).

`server.js` loads `import 'dotenv/config'` first, then **pings the DB on boot and exits** with a clear message if it can't connect — so the API requires a reachable PostgreSQL in http mode.

## Deployment

Deployed on **Render**, both services auto-deploying from `main`:

```mermaid
flowchart LR
  Repo["GitHub: main"] -->|auto-deploy| Static["Static Site<br/>(client/ → dist)"]
  Repo -->|auto-deploy| Web["Web Service<br/>(backend/ API)"]
  Web --> PG[("Managed PostgreSQL")]
  Static -.->|VITE_SERVER_BASE_URL| Web
```

- **Static site** — rootDir `client/`, build `npm install; npm run build`, publishes `dist`, with an SPA rewrite `/* → /index.html`. `VITE_*` env is baked in at build time.
- **Web service** — rootDir `backend/`, `npm install` / `npm start`; reads `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN` from Render env vars; connects to the managed Postgres over its internal URL.
