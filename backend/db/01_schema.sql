-- ============================================================================
-- ExamApp — סכמת בסיס נתונים (HYBRID: relational + JSONB)
-- ============================================================================
-- כל ישות מטא-דאטה (id, title, status, ...) יושבת בעמודות "רגילות"
-- כדי לתת לנו אינדקסים מהירים ושאילתות SQL פשוטות.
-- שאלות הבחינה נשמרות בעמודת JSONB אחת ("questions") — כל שאלה היא
-- אובייקט { id, text, options[], correctAnswer }. כך אנחנו לא צריכים
-- טבלת questions+options נפרדת, אבל עדיין יכולים לעבור עליהן ב-SQL
-- (jsonb_array_elements) ובקוד.
-- ============================================================================

DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS exams CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ----------------------------------------------------------------------------
-- USERS — תפקיד teacher או student.
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
-- EXAMS — HYBRID: מטא-דאטה בעמודות + השאלות כ-JSONB.
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

-- אינדקס GIN על questions מאפשר חיפוש מהיר בתוך ה-JSONB
-- (לדוגמה: כל הבחינות שיש בהן שאלה עם טקסט מסוים).
CREATE INDEX idx_exams_questions_gin ON exams USING GIN (questions);

-- ----------------------------------------------------------------------------
-- SUBMISSIONS — answers כ-JSONB array של אינדקסי בחירות.
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
-- תצוגת אימות שהסכמה נוצרה.
-- ----------------------------------------------------------------------------
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
