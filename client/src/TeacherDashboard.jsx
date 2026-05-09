import React, { useState, useEffect } from 'react';
import { getAllExams } from './api/examService';

// קומפוננטת לוח המחוונים של המורה.
// כאן המורה יכול לראות את רשימת הבחינות הקיימות.
const TeacherDashboard = () => {
  // שמירת רשימת הבחינות בסטייט.
  const [exams, setExams] = useState([]);
  // שמירת מצב טעינה כדי להציג הודעה למשתמש.
  const [loading, setLoading] = useState(true);

  // useEffect נקרא פעם אחת כשהקומפוננטה נטענת.
  // הוא משמש לשליפת הנתונים של הבחינות מהשרת המדומה.
  useEffect(() => {
    const fetchExams = async () => {
      try {
        // קוראים לשירות כדי לקבל את כל הבחינות.
        const data = await getAllExams();
        setExams(data);
      } catch (error) {
        console.error("שגיאה בשליפת בחינות:", error);
      } finally {
        // בסיום הטעינה, מעדכנים את מצב הטעינה.
        setLoading(false);
      }
    };
    fetchExams();
  }, []); // המערך הריק מבטיח שהפונקציה תרוץ רק פעם אחת בטעינה הראשונית.

  return (
    // עיצוב באמצעות Bootstrap למיכל ולכותרת.
    <div className="container mt-4">
      <h2 className="mb-4">לוח מחוונים למורה</h2>
      // כרטיס המציג את רשימת הבחינות.
      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">בחינות קיימות</h5>
        </div>
        <div className="card-body">
          {loading ? (
            // אם עדיין בטעינה, מציגים הודעה מתאימה.
            <p>טוען בחינות...</p>
          ) : (
            // לאחר הטעינה, מציגים את רשימת הבחינות או הודעה שאין בחינות.
            <div className="list-group">
              {exams.map(exam => (
                // כל בחינה מוצגת כפריט ברשימה.
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
    </div>
  );
};

export default TeacherDashboard; // ייצוא הקומפוננטה כדי שניתן יהיה להשתמש בה במקומות אחרים.
