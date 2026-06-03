import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useServices } from '../../context/ServicesContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function StudentDashboard() {
  const { examService, submissionService, config } = useServices();
  const { user } = useAuth();
  const [stats, setStats] = useState({ available: 0, submitted: 0, avg: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      examService.listPublished(),
      submissionService.listByStudent(user.id),
    ]).then(([exams, subs]) => {
      if (!active) return;
      const avg = subs.length
        ? Math.round(subs.reduce((acc, s) => acc + (s.total ? (s.score / s.total) * 100 : 0), 0) / subs.length)
        : null;
      setStats({ available: exams.length, submitted: subs.length, avg });
      setLoading(false);
    });
    return () => { active = false; };
  }, [examService, submissionService, user.id]);

  if (loading) return <div className="container py-5 text-center" dir="rtl">טוען...</div>;

  const cards = [
    { label: 'בחינות זמינות', value: stats.available, color: 'primary' },
    { label: 'הגשות שלי', value: stats.submitted, color: 'success' },
    { label: 'ממוצע ציונים', value: stats.avg == null ? '—' : `${stats.avg}%`, color: 'info' },
  ];

  return (
    <div className="container py-4" dir="rtl">
      <h2 className="mb-4">שלום, {user.name}</h2>

      <div className="row g-3 mb-4">
        {cards.map(c => (
          <div key={c.label} className="col-12 col-md-4">
            <div className={`card text-bg-${c.color}`}>
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
          <h5>מה הלאה?</h5>
          <div className="d-flex flex-wrap gap-2">
            <Link to="/student/exams" className="btn btn-outline-primary">לבחינות הזמינות</Link>
            <Link to="/student/results" className="btn btn-outline-success">לתוצאות שלי</Link>
          </div>
          <p className="text-muted small mt-3 mb-0">
            ציון מעבר: {config.get('passingGrade')}%
          </p>
        </div>
      </div>
    </div>
  );
}
