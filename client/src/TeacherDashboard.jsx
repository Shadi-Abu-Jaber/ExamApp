import React, { useState, useEffect, useCallback } from 'react';
import { getAllExams } from './api/examService';
import AIQuestionGenerator from './AIQuestionGenerator';

const TeacherDashboard = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchExams = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllExams();
      setExams(data);
    } catch (error) {
      console.error("שגיאה בשליפת בחינות:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  return (
    <div className="container mt-4" dir="rtl">
      <h2 className="mb-4">לוח מחוונים למורה</h2>

      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">בחינות קיימות</h5>
        </div>
        <div className="card-body">
          {loading ? (
            <p>טוען בחינות...</p>
          ) : (
            <div className="list-group">
              {exams.map(exam => (
                <div key={exam.id} className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-1">{exam.title}</h6>
                    <small className="text-muted">{exam.questions.length} שאלות</small>
                  </div>
                  <span className="badge bg-secondary rounded-pill">מזהה: {exam.id}</span>
                </div>
              ))}
              {exams.length === 0 && <p>לא נמצאו בחינות.</p>}
            </div>
          )}
        </div>
      </div>

      <AIQuestionGenerator onExamCreated={fetchExams} />
    </div>
  );
};

export default TeacherDashboard;
