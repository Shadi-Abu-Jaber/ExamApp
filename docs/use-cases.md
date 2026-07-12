# Use cases

Two actors: **Teacher** and **Student**. Both authenticate; authorization (who may do what) is enforced on the server via role + ownership checks.

## Use-case diagram

```mermaid
flowchart LR
  Teacher([Teacher])
  Student([Student])

  Teacher --> AUTH[Register / Login]
  Teacher --> CE[Create / edit exam]
  Teacher --> Q[Add / edit questions]
  Teacher --> PUB[Publish / close / reopen exam]
  Teacher --> DEL[Delete exam]
  Teacher --> TD[View teacher dashboard]

  Student --> AUTH
  Student --> AV[View published exams]
  Student --> TAKE[Take exam and submit]
  Student --> RES[View grades and results]
  Student --> SD[View student dashboard]
```

## Teacher flow

```mermaid
flowchart TD
  A[Login] --> B[Teacher dashboard]
  B --> C[Create exam]
  C --> D[Add questions<br/>2–6 options, mark correct]
  D --> E{Valid?}
  E -->|no| D
  E -->|yes| F[Save draft]
  F --> G[Publish exam]
  G --> H[Students can take it]
  G --> I[Close exam]
  I -->|reopen| F
```

A teacher can only edit, publish, or delete **exams they own** — the server rejects actions on another teacher's exam (403).

## Student flow

```mermaid
flowchart TD
  A[Login] --> B[Student dashboard]
  B --> C[Browse published exams]
  C --> D[Start exam]
  D --> E[Answer every question]
  E --> F{All answered?}
  F -->|no| E
  F -->|yes| G[Submit]
  G --> H[Server computes score]
  H --> I[See result: score, %, pass/fail]
  I --> J[Results page and dashboard average]
```

Grading is **automatic and server-side**: on submit, the API compares each answer to the exam's `correctAnswer` and stores `score` / `total`. Students see published exams only, and can retake a published exam.

## Implemented vs. planned

| Use case | Status |
|----------|--------|
| Create / edit / publish / close / delete exams | ✅ Implemented |
| Single-answer multiple-choice questions | ✅ Implemented |
| Take exam, submit, server auto-grade | ✅ Implemented |
| View grades + dashboards | ✅ Implemented |
| Multiple question types (true/false, open text…) | ⬜ Planned |
| Teacher reviews submissions / manual grading | ⬜ Planned |
| Separate "publish results" step | ⬜ Planned (results are shown immediately) |
| Per-question feedback | ⬜ Planned |
| Admin role & management tools | ⬜ Planned |

See the [root README roadmap](../README.md#roadmap) for the broader direction.
