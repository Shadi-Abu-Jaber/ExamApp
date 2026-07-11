-- ============================================================================
-- ExamApp — נתוני זרע (SEED) ל-HYBRID schema.
-- ----------------------------------------------------------------------------
-- שני משתמשי דמו (מורה + תלמיד) ושתי בחינות לדוגמה.
-- שאלות הבחינה נכתבות כ-JSONB inline — כך כל בחינה היא שורה אחת
-- שמחזיקה את כל המבנה שלה ביחד.
-- ============================================================================

TRUNCATE submissions, exams, users RESTART IDENTITY CASCADE;

-- ----------------------------------------------------------------------------
-- USERS
-- הסיסמאות נשמרות כ-bcrypt hashes (לא בטקסט גלוי). ערכי הדמו:
--   teacher@demo.test / teacher123   ·   student@demo.test / student123
-- ----------------------------------------------------------------------------
INSERT INTO users (id, name, email, password, role) VALUES
  ('u_teacher_demo', 'מורה לדוגמה',  'teacher@demo.test', '$2b$10$pORnoQS0o9pa7AAhH4j5Dear72Ys8a1BEb/ItvP3Omf6kuiVattz2', 'teacher'),
  ('u_student_demo', 'תלמיד לדוגמה', 'student@demo.test', '$2b$10$8nb1m0cRmoFhGK3fa/FjL.izkwUVgcYHuc/EuAx/Z9gT7C4WW5BQy', 'student');

-- ----------------------------------------------------------------------------
-- EXAMS — שאלות כ-JSONB
-- ----------------------------------------------------------------------------
INSERT INTO exams (id, title, description, status, created_by, questions) VALUES
(
  'exam_seed_js',
  'יסודות JavaScript',
  'בחינה קצרה על מושגי יסוד בשפת JavaScript.',
  'published',
  'u_teacher_demo',
  '[
    {
      "id": "q_js_1",
      "text": "מהו closure?",
      "options": ["פונקציה עם הסביבה הלקסיקלית שלה", "סוג של לולאה", "תכונת CSS", "מבנה נתונים"],
      "correctAnswer": 0
    },
    {
      "id": "q_js_2",
      "text": "איזו מילת מפתח מגדירה קבוע?",
      "options": ["var", "let", "const", "static"],
      "correctAnswer": 2
    },
    {
      "id": "q_js_3",
      "text": "מהי תוצאת typeof null ב-JavaScript?",
      "options": ["null", "undefined", "object", "string"],
      "correctAnswer": 2
    }
  ]'::jsonb
),
(
  'exam_seed_react',
  'יסודות React',
  'בחינה קצרה על React ו-hooks.',
  'draft',
  'u_teacher_demo',
  '[
    {
      "id": "q_re_1",
      "text": "מהו JSX?",
      "options": ["JavaScript XML", "Java Syntax Extension", "JSON XML", "Java Server Pages"],
      "correctAnswer": 0
    },
    {
      "id": "q_re_2",
      "text": "איזה hook מטפל בתופעות לוואי?",
      "options": ["useState", "useEffect", "useMemo", "useRef"],
      "correctAnswer": 1
    }
  ]'::jsonb
);

-- ----------------------------------------------------------------------------
-- אישור: ספירה לפי טבלה.
-- ----------------------------------------------------------------------------
SELECT 'users'       AS table_name, COUNT(*) AS rows FROM users
UNION ALL
SELECT 'exams'       AS table_name, COUNT(*) AS rows FROM exams
UNION ALL
SELECT 'submissions' AS table_name, COUNT(*) AS rows FROM submissions;
