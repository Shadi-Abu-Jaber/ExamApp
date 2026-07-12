// רשימת הבחינות של המורה.
// תומכת בכל מעברי הסטטוס: טיוטה → מפורסם → סגור → טיוטה (לולאת חזרה).
// פעולת מחיקה מאומתת עם confirm() לפני קריאה ל-service.

import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useServices } from '../../context/ServicesContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { EXAM_STATUS } from '../../models/Exam.js';
import ExamStatusBadge from '../../components/teacher/ExamStatusBadge.jsx';

export default function MyExamsPage() {
  const { examService, notify } = useServices();
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const data = await examService.listByTeacher(user.id);
    setExams(data);
    setLoading(false);
  }, [examService, user.id]);

  useEffect(() => { reload(); }, [reload]);

  const changeStatus = async (id, nextStatus) => {
    try {
      await examService.setStatus(id, nextStatus);
      const label = nextStatus === EXAM_STATUS.PUBLISHED ? 'פורסם'
        : nextStatus === EXAM_STATUS.CLOSED ? 'נסגר'
        : 'הוחזר לטיוטה';
      notify.success(`הבחינה ${label}`);
      reload();
    } catch (err) {
      notify.error(err?.message || 'שגיאה בשינוי הסטטוס');
    }
  };

  const removeExam = async (id) => {
    if (!window.confirm('למחוק את הבחינה?')) return;
    await examService.remove(id);
    notify.info('הבחינה נמחקה');
    reload();
  };

  if (loading) {
    return <div className="container py-5 text-center" dir="rtl">טוען בחינות...</div>;
  }

  return (
    <div className="container py-4" dir="rtl">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">הבחינות שלי</h2>
        <Link to="/teacher/exams/new" className="btn btn-primary btn-sm">+ בחינה חדשה</Link>
      </div>

      {exams.length === 0 ? (
        <div className="alert alert-secondary text-center">
          אין בחינות עדיין. <Link to="/teacher/exams/new">צור את הראשונה</Link>.
        </div>
      ) : (
        <div className="list-group">
          {exams.map(exam => (
            <div key={exam.id} className="list-group-item">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <h5 className="mb-0">{exam.title}</h5>
                    <ExamStatusBadge status={exam.status} />
                  </div>
                  <small className="text-muted">
                    {exam.questions.length} שאלות · נוצר {new Date(exam.createdAt).toLocaleDateString('he-IL')}
                  </small>
                </div>

                <div className="d-flex gap-1 flex-wrap">
                  <Link to={`/teacher/exams/${exam.id}/edit`} className="btn btn-outline-primary btn-sm">
                    ערוך
                  </Link>

                  {exam.status === EXAM_STATUS.DRAFT && (
                    <button className="btn btn-success btn-sm"
                      onClick={() => changeStatus(exam.id, EXAM_STATUS.PUBLISHED)}>
                      פרסם
                    </button>
                  )}
                  {exam.status === EXAM_STATUS.PUBLISHED && (
                    <button className="btn btn-warning btn-sm"
                      onClick={() => changeStatus(exam.id, EXAM_STATUS.CLOSED)}>
                      סגור
                    </button>
                  )}
                  {exam.status === EXAM_STATUS.CLOSED && (
                    <button className="btn btn-outline-secondary btn-sm"
                      onClick={() => changeStatus(exam.id, EXAM_STATUS.DRAFT)}>
                      החזר לטיוטה
                    </button>
                  )}

                  <button className="btn btn-outline-danger btn-sm" onClick={() => removeExam(exam.id)}>
                    מחק
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
