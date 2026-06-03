-- ============================================================================
-- ExamApp — שאילתות הדגמה לסרטון.
-- ----------------------------------------------------------------------------
-- מריצים את הקובץ עם psql -f כדי לראות פלט של כל שאילתה ברצף.
-- כל שאילתה מתועדת עם \echo שמדפיס כותרת כדי שיהיה קל לעקוב בסרטון.
-- ============================================================================

\echo
\echo '================================================================'
\echo '  1) בדיקת חיבוריות — גרסת השרת ושעה נוכחית'
\echo '================================================================'
SELECT version(), NOW() AS server_time;

\echo
\echo '================================================================'
\echo '  2) כל המשתמשים (users) במסד'
\echo '================================================================'
SELECT id, name, email, role, created_at
FROM users
ORDER BY role, name;

\echo
\echo '================================================================'
\echo '  3) כל הבחינות (exams) — מטא-דאטה + מספר שאלות'
\echo '================================================================'
SELECT
  id,
  title,
  status,
  created_by,
  jsonb_array_length(questions) AS num_questions,
  created_at
FROM exams
ORDER BY created_at DESC;

\echo
\echo '================================================================'
\echo '  4) שליפת בחינה מסוימת — exam_seed_js — והרצת לולאה'
\echo '     על השאלות שלה (כל שאלה כאובייקט JSONB נפרד)'
\echo '================================================================'
SELECT
  (q->>'id')              AS question_id,
  (q->>'text')            AS question_text,
  (q->'options')          AS options,
  (q->>'correctAnswer')::int AS correct_answer_index,
  (q->'options' -> (q->>'correctAnswer')::int) #>> '{}' AS correct_answer_text
FROM exams,
     jsonb_array_elements(questions) AS q
WHERE id = 'exam_seed_js'
ORDER BY (q->>'id');

\echo
\echo '================================================================'
\echo '  5) שאילתת JSONB מתקדמת — כל הבחינות שיש בהן שאלה'
\echo '     שמכילה את המילה "closure"'
\echo '================================================================'
SELECT
  e.id,
  e.title,
  q->>'text' AS matching_question
FROM exams e,
     jsonb_array_elements(e.questions) AS q
WHERE q->>'text' ILIKE '%closure%';

\echo
\echo '================================================================'
\echo '  6) סטטיסטיקה: ספירת שאלות סך הכל לפי בחינה'
\echo '================================================================'
SELECT
  title,
  status,
  jsonb_array_length(questions) AS total_questions
FROM exams
ORDER BY total_questions DESC;
