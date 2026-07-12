# ExamApp — Client (Frontend)

React 19 (Vite) single-page app for ExamApp. UI is Hebrew / RTL and styled with Bootstrap 5. The client has a **dual-mode data layer**: it can run fully offline against an in-browser mock database, or in HTTP mode against the [Express API](../backend).

## Scripts

```bash
npm install
npm run dev       # Vite dev server at http://localhost:5173
npm run build     # production build → dist/
npm run preview   # serve the production build locally
npm run lint      # ESLint (flat config in eslint.config.js)
```

## Data mode (mock vs. HTTP)

The mode is `Config.dataMode` — `'mock'` (default) or `'http'`. Every data call flows through the single `src/api/ApiGateway.js`, so pages and services don't know which mode is active.

```bash
# .env (build/dev time)
VITE_DATA_MODE=http
VITE_SERVER_BASE_URL=http://localhost:4000
```

Or flip it at runtime in the browser console, then refresh:

```js
localStorage.setItem('examapp::dataMode', 'http')
```

## Structure

```
src/
  pages/       Route screens, split by role: auth/, teacher/, student/
  components/  Shared UI + teacher/ editors (ExamForm, QuestionEditor, …)
  services/    OOP layer: Config, Logger, Storage, Notify, AuthService, ServiceRegistry
  api/         ApiGateway (mock/HTTP switch), MockDb, ExamService, SubmissionService
  models/      ES6 classes: User, Exam, Question, Submission (validation + toJSON)
  context/     ServicesContext (useServices), AuthContext (useAuth)
```

- **Dependency injection:** `services/ServiceRegistry.js` builds a singleton service graph (Config → Logger → Storage → Notify → MockDb → ApiGateway → Exam/Submission/AuthService) and injects everything via constructors. Components reach it through `useServices()`; auth state through `useAuth()`.
- **Domain logic lives in models**, not components (`Exam.publish()`, `Question.isValid()`).
- **Routing:** `HashRouter` (`main.jsx`) — routes are hash-based (`/#/login`, `/#/teacher`, …).

## Persistence (localStorage keys)

| Key | Contents |
|-----|----------|
| `examapp::mockdb` | The three mock tables (users, exams, submissions) — mock mode only |
| `examapp::current_user` | Public profile of the signed-in user (no password) |
| `examapp::auth_token` | JWT for HTTP mode (set on login, sent as a Bearer header) |
| `examapp::dataMode` | Optional runtime `mock`/`http` override |

To reset mock data to the seeded demo, clear `examapp::mockdb` (or call `db.reset()` from the console).

## Documentation

- Frontend deep-dive (component tree, client class structure, data model): [`docs/`](docs/README.md).
- System-level docs (architecture, real database schema, use cases): [`../docs/`](../docs/README.md).
- Project overview & setup: [root README](../README.md) · conventions: [CLAUDE.md](../CLAUDE.md).

Demo logins: `teacher@demo.test` / `teacher123`, `student@demo.test` / `student123`.
