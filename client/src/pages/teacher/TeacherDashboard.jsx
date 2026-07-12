// דשבורד המורה — מציג סטטיסטיקה מהירה של הבחינות שלו וקישורי פעולה.
// טוען רק את הבחינות של המורה המחובר (לא של מורים אחרים).

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useServices } from '../../context/ServicesContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { EXAM_STATUS } from '../../models/Exam.js';

export default function TeacherDashboard() {
  const { examService } = useServices();
  const { user } = useAuth();
  const [counts, setCounts] = useState({ total: 0, draft: 0, published: 0, closed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    examService.listByTeacher(user.id).then(exams => {
      if (!active) return;
      setCounts({
        total: exams.length,
        draft: exams.filter(e => e.status === EXAM_STATUS.DRAFT).length,
        published: exams.filter(e => e.status === EXAM_STATUS.PUBLISHED).length,
        closed: exams.filter(e => e.status === EXAM_STATUS.CLOSED).length,
      });
      setLoading(false);
    });
    return () => { active = false; };
  }, [examService, user.id]);

  if (loading) {
    return <div className="container py-5 text-center" dir="rtl">טוען...</div>;
  }

  const cards = [
    { label: 'סך הבחינות', value: counts.total, color: 'primary' },
    { label: 'טיוטות', value: counts.draft, color: 'secondary' },
    { label: 'מפורסמות', value: counts.published, color: 'success' },
    { label: 'סגורות', value: counts.closed, color: 'danger' },
  ];

  return (
    <div className="container py-4" dir="rtl">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">לוח מורה — {user.name}</h2>
        <Link to="/teacher/exams/new" className="btn btn-primary">+ בחינה חדשה</Link>
      </div>

      <div className="row g-3 mb-4">
        {cards.map(c => (
          <div key={c.label} className="col-6 col-md-3">
            <div className={`card text-bg-${c.color} h-100`}>
              <div className="card-body text-center">
                <div className="display-6 fw-bold">{c.value}</div>
                <div className="small">{c.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-body">
          <h5>פעולות מהירות</h5>
          <div className="d-flex flex-wrap gap-2">
            <Link to="/teacher/exams" className="btn btn-outline-primary">לרשימת הבחינות שלי</Link>
            <Link to="/teacher/exams/new" className="btn btn-outline-success">צור בחינה חדשה</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
