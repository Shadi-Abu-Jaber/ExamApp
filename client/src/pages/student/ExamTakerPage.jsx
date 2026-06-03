// עמוד מילוי הבחינה.
// מציג שאלה אחר שאלה עם רדיו לאפשרויות וסרגל התקדמות.
// כפתור ההגשה נחסם עד שכל השאלות נענו. הציון מחושב בשירות (לא בלקוח)
// ומוצג מיד עם תווית עבר/נכשל לפי ציון המעבר מ-Config.

import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useServices } from '../../context/ServicesContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { EXAM_STATUS } from '../../models/Exam.js';

export default function ExamTakerPage() {
  const { id } = useParams();
  const { examService, submissionService, notify, config } = useServices();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let active = true;
    examService.getById(id)
      .then(data => {
        if (!active) return;
        if (data.status !== EXAM_STATUS.PUBLISHED) {
          notify.warn('הבחינה אינה פתוחה להגשה כרגע');
          navigate('/student/exams');
          return;
        }
        setExam(data);
        setLoading(false);
      })
      .catch(err => {
        if (!active) return;
        notify.error(err?.message || 'הבחינה לא נמצאה');
        navigate('/student/exams');
      });
    return () => { active = false; };
  }, [id, examService, notify, navigate]);

  const selectAnswer = (qIdx, optIdx) => {
    setAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
  };

  const allAnswered = exam && exam.questions.every((_, i) => answers[i] != null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allAnswered) {
      notify.warn('יש לענות על כל השאלות לפני הגשה');
      return;
    }
    setSubmitting(true);
    try {
      const ordered = exam.questions.map((_, i) => answers[i]);
      const submission = await submissionService.submit({
        examId: exam.id,
        studentId: user.id,
        answers: ordered,
      });
      setResult(submission);
      const pct = submission.total ? Math.round((submission.score / submission.total) * 100) : 0;
      const passed = pct >= config.get('passingGrade');
      (passed ? notify.success : notify.warn)(`ציון: ${pct}%`);
    } catch (err) {
      notify.error(err?.message || 'שגיאה בהגשה');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !exam) return <div className="container py-5 text-center" dir="rtl">טוען...</div>;

  if (result) {
    const pct = result.total ? Math.round((result.score / result.total) * 100) : 0;
    const passed = pct >= config.get('passingGrade');
    return (
      <div className="container py-5" dir="rtl">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className={`card border-${passed ? 'success' : 'danger'} text-center`}>
              <div className={`card-header text-white bg-${passed ? 'success' : 'danger'}`}>
                <h4 className="mb-0">{passed ? 'עברת בהצלחה!' : 'לא עברת הפעם'}</h4>
              </div>
              <div className="card-body">
                <h2 className="display-4 fw-bold">{pct}%</h2>
                <p className="text-muted">
                  {result.score} מתוך {result.total} שאלות נכונות
                </p>
                <div className="d-flex gap-2 justify-content-center">
                  <Link to="/student/exams" className="btn btn-primary">לבחינות נוספות</Link>
                  <Link to="/student/results" className="btn btn-outline-primary">לתוצאות שלי</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / exam.questions.length) * 100);

  return (
    <div className="container py-4" dir="rtl">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">{exam.title}</h2>
        <small className="text-muted">
          {answeredCount} / {exam.questions.length} נענו
        </small>
      </div>

      {exam.description && <p className="text-muted">{exam.description}</p>}

      <div className="progress mb-4" style={{ height: '6px' }}>
        <div className="progress-bar bg-primary" style={{ width: `${progress}%` }} />
      </div>

      <form onSubmit={handleSubmit}>
        {exam.questions.map((q, qIdx) => (
          <div key={q.id} className="card mb-3">
            <div className="card-body">
              <h6 className="fw-bold mb-3">
                {qIdx + 1}. {q.text}
              </h6>
              {q.options.map((opt, optIdx) => {
                const inputId = `q-${qIdx}-${optIdx}`;
                const isSelected = answers[qIdx] === optIdx;
                return (
                  <div key={optIdx} className="form-check mb-2">
                    <input
                      className="form-check-input"
                      type="radio"
                      name={`q-${qIdx}`}
                      id={inputId}
                      checked={isSelected}
                      onChange={() => selectAnswer(qIdx, optIdx)}
                    />
                    <label className="form-check-label" htmlFor={inputId}>
                      {opt}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="d-flex gap-2 mt-4 sticky-bottom bg-light py-3">
          <button
            type="submit"
            className="btn btn-success btn-lg"
            disabled={submitting || !allAnswered}
          >
            {submitting ? 'שולח...' : 'הגש בחינה'}
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary btn-lg"
            onClick={() => navigate('/student/exams')}
            disabled={submitting}
          >
            בטל
          </button>
        </div>
      </form>
    </div>
  );
}
