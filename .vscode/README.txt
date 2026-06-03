==============================================================================
VS CODE WORKSPACE CONFIG — Two-terminal dev + three debug modes
==============================================================================

TASKS  (Cmd/Ctrl+Shift+B  or  "Tasks: Run Task")
------------------------------------------------------------------------------
  client: dev                Vite dev server in its own dedicated terminal.
  server: dev                Express + nodemon in its own dedicated terminal.
  dev: both (client+server)  Launches BOTH tasks in parallel — you get two
                             side-by-side terminal panels, each with its own
                             log stream.

LAUNCH CONFIGS  (Run & Debug panel)
------------------------------------------------------------------------------
  Debug Server (Node)        Launches backend/src/server.js with the Node
                             debugger attached. Breakpoints in backend/src/*
                             are hit. Logs stream to the Debug Console.

  Debug Client (Chrome)      Starts the "client: dev" task as a preLaunchTask,
                             then opens Chrome at http://localhost:5173 with
                             the JS debugger attached. Set breakpoints in
                             client/src/* — the source-map override resolves
                             them to your local files.

  Debug Both (Server+Client) Compound config. Runs the two above in parallel.
                             "stopAll" is enabled so hitting Stop kills both.

NOTES
------------------------------------------------------------------------------
* The two terminals are grouped under "examapp" so VS Code lays them out
  side-by-side rather than stacking them in one panel.
* "Debug Server" sets PORT=4000, CORS_ORIGIN=http://localhost:5173 and
  LOG_LEVEL=debug as env vars so you don't need to copy backend/.env first.
* If Chrome doesn't open, install the "JavaScript Debugger" extension that
  ships with VS Code (built-in) and the "Debugger for Chrome" auto-attach
  feature handles the rest.
* You can also do "Debug Server only" while running `npm run dev` in the
  client manually in a separate terminal — useful when iterating only on
  the server.
==============================================================================
