# VS Code Workspace Config

Two-terminal dev workflow and three debug modes, shared via `.vscode/tasks.json` and `.vscode/launch.json`.

## Tasks

Run with **Ctrl/Cmd+Shift+B** or **"Tasks: Run Task"**.

| Task | What it does |
|------|--------------|
| `client: dev` | Vite dev server (`client/`) in its own dedicated terminal panel. |
| `server: dev` | Express + nodemon (`backend/`) in its own dedicated terminal panel. |
| `dev: both (client + server)` | Runs both tasks in parallel — two side-by-side terminals, each with its own log stream. |

The two terminals are grouped under `examapp` so VS Code lays them out side-by-side instead of stacking them.

## Launch configs

Open the **Run & Debug** panel and pick one:

| Config | What it does |
|--------|--------------|
| `Debug Server (Node)` | Launches `backend/src/server.js` with the Node debugger attached; breakpoints in `backend/src/**` are hit. Sets `PORT=4000`, `CORS_ORIGIN=http://localhost:5173`, `LOG_LEVEL=debug` so you don't need to copy `backend/.env` first. Requires a reachable PostgreSQL (see the root README / [docs](../docs/architecture.md#database-connection-modes)). |
| `Debug Client (Chrome)` | Runs the `client: dev` task as a `preLaunchTask`, then opens Chrome at `http://localhost:5173` with the JS debugger attached. Source maps resolve breakpoints to `client/src/**`. |
| `Debug Both (Server + Client)` | Compound config that runs the two above together; `stopAll` is enabled so pressing Stop kills both. |

## Notes

- Chrome debugging uses the **JavaScript Debugger** that ships built-in with VS Code — no extra extension needed.
- You can also run only `Debug Server (Node)` while starting the client manually with `npm run dev` in a separate terminal — handy when iterating on the backend alone.
