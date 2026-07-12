-- ============================================================================
-- ExamApp — database schema (HYBRID: relational + JSONB)
-- ============================================================================
-- Every metadata field (id, title, status, ...) lives in "regular" columns so
-- we get fast indexes and simple SQL queries.
-- Exam questions are stored in a single JSONB column ("questions") — each
-- question is an object { id, text, options[], correctAnswer }. This way we
-- don't need a separate questions+options table, but we can still iterate over
-- them in SQL (jsonb_array_elements) and in code.
-- ============================================================================

DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS exams CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ----------------------------------------------------------------------------
-- USERS — role is either teacher or student.
-- ----------------------------------------------------------------------------
CREATE TABLE users (
  id          TEXT PRIMARY KEY,
  name        TEXT        NOT NULL,
  email       TEXT        NOT NULL UNIQUE,
  password    TEXT        NOT NULL,
  role        TEXT        NOT NULL CHECK (role IN ('teacher', 'student')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- EXAMS — HYBRID: metadata in columns + the questions as JSONB.
-- ----------------------------------------------------------------------------
CREATE TABLE exams (
  id           TEXT PRIMARY KEY,
  title        TEXT        NOT NULL,
  description  TEXT        NOT NULL DEFAULT '',
  status       TEXT        NOT NULL CHECK (status IN ('draft', 'published', 'closed')),
  created_by   TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  questions    JSONB       NOT NULL DEFAULT '[]'::jsonb
);

-- A GIN index on questions enables fast search inside the JSONB
-- (e.g. all exams that contain a question with certain text).
CREATE INDEX idx_exams_questions_gin ON exams USING GIN (questions);

-- ----------------------------------------------------------------------------
-- SUBMISSIONS — answers as a JSONB array of chosen option indices.
-- ----------------------------------------------------------------------------
CREATE TABLE submissions (
  id            TEXT PRIMARY KEY,
  exam_id       TEXT        NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  answers       JSONB       NOT NULL DEFAULT '[]'::jsonb,
  score         INTEGER     NOT NULL DEFAULT 0,
  total         INTEGER     NOT NULL DEFAULT 0,
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_submissions_exam   ON submissions (exam_id);
CREATE INDEX idx_submissions_student ON submissions (student_id);

-- ----------------------------------------------------------------------------
-- Verification: show that the schema was created.
-- ----------------------------------------------------------------------------
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
