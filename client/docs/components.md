# Component hierarchy

Read top-down; `*` marks routed pages. Providers wrap the app, then pages compose shared and teacher-specific components.

```mermaid
flowchart TD
  main["main.jsx"] --> SM["StrictMode"] --> HR["HashRouter"] --> App
  App --> SP["ServicesProvider"] --> AP["AuthProvider"] --> Shell["AppShell"]
  Shell --> Nav["NavigationMenu (role-aware navbar)"]
  Shell --> Toast["ToastViewport (renders Notify stream)"]
  Shell --> Routes

  Routes --> Home["* / — HomePage"]
  Routes --> Login["* /login — LoginPage"]
  Routes --> Reg["* /register — RegisterPage"]
  Routes --> T["* /teacher/* — ProtectedRoute role=teacher"]
  Routes --> S["* /student/* — ProtectedRoute role=student"]

  T --> TR["TeacherRoutes"]
  TR --> TD["TeacherDashboard"]
  TR --> ME["MyExamsPage → ExamStatusBadge"]
  TR --> EB["ExamBuilderPage → ExamForm → QuestionEditor"]
  TR --> EE["ExamEditorPage → ExamForm → QuestionEditor"]

  S --> SR["StudentRoutes"]
  SR --> SD["StudentDashboard"]
  SR --> AV["AvailableExamsPage"]
  SR --> TAKE["ExamTakerPage"]
  SR --> RES["ResultsPage"]
```

Routing uses **`HashRouter`** (`main.jsx`), so paths are hash-based (`/#/login`, `/#/teacher/exams`, …).

## Cross-cutting hooks

| Hook | Purpose |
|------|---------|
| `useServices()` | Reach the OOP service graph from any component |
| `useNotifyToasts()` | Derive toast state from the `Notify` pub/sub stream |
| `useAuth()` | Current user + `login` / `register` / `logout` actions |
| `useLocation` / `useNavigate` / `useParams` | React Router primitives |
