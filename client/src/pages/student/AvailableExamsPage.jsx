// רשימת הבחינות הזמינות לתלמיד.
// מציגה רק בחינות בסטטוס "מפורסם", ומסמנת בחינות שכבר הוגשו על ידי
// המשתמש כדי שיוכל להבחין בקלות (אפשר להיבחן שוב).

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useServices } from '../../context/ServicesContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function AvailableExamsPage() {
  const { examService, submissionService } = useServices();
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [submittedIds, setSubmittedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      examService.listPublished(),
      submissionService.listByStudent(user.id),
    ]).then(([allExams, subs]) => {
      if (!active) return;
      setExams(allExams);
      setSubmittedIds(new Set(subs.map(s => s.examId)));
      setLoading(false);
    });
    return () => { active = false; };
  }, [examService, submissionService, user.id]);

  if (loading) return <div className="container py-5 text-center" dir="rtl">טוען בחינות...</div>;

  return (
    <div className="container py-4" dir="rtl">
      <h2 className="mb-4">בחינות זמינות</h2>

      {exams.length === 0 ? (
        <div className="alert alert-secondary text-center">אין כרגע בחינות מפורסמות.</div>
      ) : (
        <div className="row g-3">
          {exams.map(exam => {
            const taken = submittedIds.has(exam.id);
            return (
              <div key={exam.id} className="col-md-6">
                <div className="card h-100">
                  <div className="card-body d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="card-title mb-0">{exam.title}</h5>
                      {taken && <span className="badge bg-info">נבחנת</span>}
                    </div>
                    {exam.description && (
                      <p className="card-text text-muted small">{exam.description}</p>
                    )}
                    <div className="mt-auto d-flex justify-content-between align-items-center">
                      <small className="text-muted">{exam.questions.length} שאלות</small>
                      <Link
                        to={`/student/exams/${exam.id}/take`}
                        className={`btn btn-sm ${taken ? 'btn-outline-primary' : 'btn-primary'}`}
                      >
                        {taken ? 'להיבחן שוב' : 'התחל בחינה'}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
