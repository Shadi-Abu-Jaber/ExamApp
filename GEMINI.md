# ExamFlow Project

A comprehensive Examination Management System designed for admins, lecturers, and students. It facilitates exam creation, monitoring, student submissions, and automated/manual grading.

## Project Overview

- **Architecture:** Client-Server architecture with a decoupled frontend and backend.
- **Technologies:**
  - **Backend:** Node.js, Express.js, Prisma ORM, PostgreSQL.
  - **Frontend:** React (Vite), Tailwind CSS, React Router, Recharts, Lucide Icons.
  - **Authentication:** JWT-based authentication with role-based access control (ADMIN, LECTURER, STUDENT).

## Directory Structure

- `backend/`: Express.js server and Prisma database configuration.
- `frontend/`: Primary React application with a modern UI using Tailwind CSS.
- `client/`: An alternative or legacy React implementation.
- `docs/`: Project documentation, including UML diagrams and feature specifications.

## Building and Running

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   - Copy `.env.example` to `.env`.
   - Update `DATABASE_URL` with your PostgreSQL connection string.
4. Initialize the database:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Development Conventions

### Backend
- **Controllers:** Business logic is located in `backend/src/controllers/`.
- **Routes:** API endpoints are defined in `backend/src/routes/`.
- **Middleware:** Authentication and error handling are managed in `backend/src/middlewares/`.
- **Validation:** Request data is validated using `express-validator` in `backend/src/validators/`.
- **Prisma:** The database schema is defined in `backend/prisma/schema.prisma`.

### Frontend
- **Components:** Reusable UI components are in `frontend/src/components/`.
- **Pages:** Top-level view components are in `frontend/src/pages/`, organized by user role.
- **Context:** Global state (like Auth) is managed in `frontend/src/context/`.
- **API Services:** Backend communication is centralized in `frontend/src/api/`.
- **Styling:** Follow Tailwind CSS utility-first patterns.

## Key Features
- **AI-Powered Question Generation:** Located in `frontend/src/pages/lecturer/AiTools.jsx`.
- **Exam Monitoring:** Real-time monitoring for lecturers in `frontend/src/pages/lecturer/ExamMonitor.jsx`.
- **Analytics:** Performance tracking for lecturers and students.
- **Role-Based Dashboards:** Distinct experiences for Admins, Lecturers, and Students.
