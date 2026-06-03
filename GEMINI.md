# ExamApp Project

An Examination Management System for teachers and students. Teachers create and publish exams; students browse, take them, and see their results.

## Project Overview

- **Architecture:** Client-server. The client runs standalone in mock mode (localStorage) or switches to HTTP mode to talk to the Express server.
- **Technologies:**
  - **Backend:** Node.js, Express.js, in-memory JSON store (`backend/src/db.js`).
  - **Frontend:** React 19 (Vite), Bootstrap 5, OOP service layer (Config / Logger / Storage / Notify / AuthService / ApiGateway).
  - **Auth:** Role-based (teacher / student) stored in localStorage via AuthService.

## Directory Structure

- `backend/`: Express server — routes for `/auth`, `/exams`, `/submissions`. Seeded in-memory store, no database needed.
- `client/`: React SPA — the live project deployed to GitHub Pages.
- `docs/`: Project documentation and UML diagrams.
- `.vscode/`: Shared workspace config (tasks + debug launchers).

## Building and Running

### Backend

```bash
cd backend
npm install
npm run dev          # nodemon on src/server.js, default PORT=4000
```

### Client

```bash
cd client
npm install
npm run dev          # Vite dev server at http://localhost:5173
```

By default the client runs in **mock mode** (no server needed). To switch to HTTP mode:

```bash
# Option 1 — .env file
echo "VITE_DATA_MODE=http" > client/.env

# Option 2 — browser DevTools console, then refresh
localStorage.setItem('examapp::dataMode', 'http')
```

### Both together (VS Code)

Open the repo in VS Code and run **Tasks: Run Task → dev: both (client + server)**.  
For debugging use the **Run & Debug** panel: Debug Server (Node), Debug Client (Chrome), or Debug Both.

## Development Conventions

### Backend
- **Routes:** `backend/src/routes/` — `exams.js`, `submissions.js`, `auth.js`.
- **DB:** `backend/src/db.js` — simple in-memory store seeded on boot.
- **Middleware:** `backend/src/middlewares/errorHandler.js`.

### Client
- **Models:** `client/src/models/` — `Exam`, `Question`, `User`, `Submission` (plain ES6 classes with `toJSON` / `isValid`).
- **Services:** `client/src/services/` — `Config`, `Logger`, `Storage`, `Notify`, `AuthService`, `ServiceRegistry`.
- **API layer:** `client/src/api/ApiGateway.js` — single class that routes every call to mock or HTTP based on `dataMode`.
- **Pages:** `client/src/pages/` — split by role (`teacher/`, `student/`, `auth/`).
- **Components:** `client/src/components/` — shared UI + teacher-specific editors.

## Demo credentials

| Role    | Email                | Password    |
|---------|----------------------|-------------|
| Teacher | teacher@demo.test    | teacher123  |
| Student | student@demo.test    | student123  |
