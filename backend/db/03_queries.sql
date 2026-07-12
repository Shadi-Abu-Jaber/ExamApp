-- ============================================================================
-- ExamApp — demonstration queries.
-- ----------------------------------------------------------------------------
-- Run this file with psql -f to see the output of each query in sequence.
-- Each query is labeled with \echo that prints a header so it's easy to follow.
-- ============================================================================

\echo
\echo '================================================================'
\echo '  1) Connectivity check — server version and current time'
\echo '================================================================'
SELECT version(), NOW() AS server_time;

\echo
\echo '================================================================'
\echo '  2) All users in the database'
\echo '================================================================'
SELECT id, name, email, role, created_at
FROM users
ORDER BY role, name;

\echo
\echo '================================================================'
\echo '  3) All exams — metadata + question count'
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
\echo '  4) Fetch a specific exam — exam_seed_js — and iterate'
\echo '     over its questions (each question as a separate JSONB object)'
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
\echo '  5) Advanced JSONB query — all exams that have a question'
\echo '     containing the word "closure"'
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
\echo '  6) Statistics: total question count per exam'
\echo '================================================================'
SELECT
  title,
  status,
  jsonb_array_length(questions) AS total_questions
FROM exams
ORDER BY total_questions DESC;
