// Exam editing page.
// Loads the exam by id, allows editing all fields, and changing the status
// (draft / published / closed) via buttons in the header.

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useServices } from '../../context/ServicesContext.jsx';
import { EXAM_STATUS } from '../../models/Exam.js';
import ExamForm from '../../components/teacher/ExamForm.jsx';
import ExamStatusBadge from '../../components/teacher/ExamStatusBadge.jsx';

export default function ExamEditorPage() {
  const { id } = useParams();
  const { examService, notify } = useServices();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    examService.getById(id)
      .then(data => { if (active) { setExam(data); setLoading(false); } })
      .catch(err => {
        if (!active) return;
        notify.error(err?.message || 'הבחינה לא נמצאה');
        navigate('/teacher/exams');
      });
    return () => { active = false; };
  }, [id, examService, notify, navigate]);

  const handleUpdate = async (payload) => {
    setSubmitting(true);
    try {
      const updated = await examService.update(id, payload);
      setExam(updated);
      notify.success('הבחינה עודכנה');
    } catch (err) {
      notify.error(err?.message || 'שגיאה בעדכון');
    } finally {
      setSubmitting(false);
    }
  };

  const setStatus = async (next) => {
    try {
      const updated = await examService.setStatus(id, next);
      setExam(updated);
      const label = next === EXAM_STATUS.PUBLISHED ? 'פורסמה'
        : next === EXAM_STATUS.CLOSED ? 'נסגרה'
        : 'הוחזרה לטיוטה';
      notify.success(`הבחינה ${label}`);
    } catch (err) {
      notify.error(err?.message || 'שגיאה');
    }
  };

  if (loading || !exam) {
    return <div className="container py-5 text-center" dir="rtl">טוען...</div>;
  }

  return (
    <div className="container py-4" dir="rtl">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <h2 className="mb-0">עריכת בחינה</h2>
          <ExamStatusBadge status={exam.status} />
        </div>
        <div className="d-flex gap-1 flex-wrap">
          {exam.status === EXAM_STATUS.DRAFT && (
            <button className="btn btn-success btn-sm"
              onClick={() => setStatus(EXAM_STATUS.PUBLISHED)}>
              פרסם
            </button>
          )}
          {exam.status === EXAM_STATUS.PUBLISHED && (
            <button className="btn btn-warning btn-sm"
              onClick={() => setStatus(EXAM_STATUS.CLOSED)}>
              סגור
            </button>
          )}
          {exam.status === EXAM_STATUS.CLOSED && (
            <button className="btn btn-outline-secondary btn-sm"
              onClick={() => setStatus(EXAM_STATUS.DRAFT)}>
              החזר לטיוטה
            </button>
          )}
        </div>
      </div>

      <ExamForm
        initial={exam}
        submitLabel="שמור שינויים"
        onSubmit={handleUpdate}
        onCancel={() => navigate('/teacher/exams')}
        submitting={submitting}
      />
    </div>
  );
}
