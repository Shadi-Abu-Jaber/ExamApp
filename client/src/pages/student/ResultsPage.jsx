// The student's results table.
// Loads the submissions and, for each one, fetches the exam title (in parallel)
// to render a single readable table. Sorted newest-first.

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useServices } from '../../context/ServicesContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ResultsPage() {
  const { submissionService, examService, config } = useServices();
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    submissionService.listByStudent(user.id).then(async (subs) => {
      const enriched = await Promise.all(
        subs.map(async (s) => {
          let title = '(בחינה לא ידועה)';
          try {
            const exam = await examService.getById(s.examId);
            title = exam.title;
          } catch { /* ignore */ }
          const pct = s.total ? Math.round((s.score / s.total) * 100) : 0;
          return { ...s, title, pct };
        })
      );
      if (!active) return;
      enriched.sort((a, b) => b.submittedAt - a.submittedAt);
      setRows(enriched);
      setLoading(false);
    });
    return () => { active = false; };
  }, [submissionService, examService, user.id]);

  if (loading) return <div className="container py-5 text-center" dir="rtl">טוען תוצאות...</div>;

  const passingGrade = config.get('passingGrade');

  return (
    <div className="container py-4" dir="rtl">
      <h2 className="mb-4">התוצאות שלי</h2>

      {rows.length === 0 ? (
        <div className="alert alert-secondary text-center">
          עדיין לא הגשת בחינות. <Link to="/student/exams">לרשימת הבחינות</Link>.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>בחינה</th>
                <th className="text-center">ציון</th>
                <th className="text-center">אחוז</th>
                <th className="text-center">סטטוס</th>
                <th>תאריך הגשה</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const passed = r.pct >= passingGrade;
                return (
                  <tr key={r.id}>
                    <td>{r.title}</td>
                    <td className="text-center">{r.score} / {r.total}</td>
                    <td className="text-center fw-bold">{r.pct}%</td>
                    <td className="text-center">
                      <span className={`badge ${passed ? 'bg-success' : 'bg-danger'}`}>
                        {passed ? 'עבר' : 'נכשל'}
                      </span>
                    </td>
                    <td>{new Date(r.submittedAt).toLocaleString('he-IL')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
