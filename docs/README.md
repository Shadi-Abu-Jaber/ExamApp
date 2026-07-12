# ExamApp — Documentation

Technical documentation for **ExamApp**, an online exam management system (Hebrew / RTL UI) built with **React 19 (Vite) SPA + Express API + PostgreSQL**.

> These documents describe the system **as it is actually built**. For setup and a project overview see the [root README](../README.md); for contributor/agent conventions see [CLAUDE.md](../CLAUDE.md). Diagrams are written in [Mermaid](https://mermaid.js.org) and render inline on GitHub.

## Contents

| Document | What's inside |
|----------|---------------|
| [Architecture](architecture.md) | Dual-mode data layer, client service graph, backend layering, request lifecycle, deployment — with diagrams |
| [Database](database.md) | Schema, ER diagram, constraints, indexes, connection modes |
| [Use cases](use-cases.md) | Actors (teacher / student), use-case diagram, user flows |

## System at a glance

- **Two roles:** `teacher` (create / manage / publish exams) and `student` (take exams, see auto-graded results). There is no admin role.
- **Dual-mode client:** runs fully offline against an in-browser mock database, or against the Express API — chosen by a single config flag, with every data call routed through one `ApiGateway`.
- **Server-authoritative:** JWT auth, bcrypt password hashing, role + ownership checks, and exam scoring all live on the server; the client is never trusted.
- **Storage:** PostgreSQL with a hybrid **relational + JSONB** schema — exam questions and submission answers are stored as JSONB.

## Current scope

Implemented: exam create/edit/publish/close, single-answer multiple-choice questions, student take + **server-side auto-grading**, results and role dashboards, JWT auth with role/ownership authorization, PostgreSQL persistence, Render deployment.

Not yet implemented (intended future scope): additional question types, teacher review of submissions with manual grading, a separate publish-results step, per-question feedback, and admin tools.
