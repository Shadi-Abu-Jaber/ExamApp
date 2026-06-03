import React, { useState } from 'react';
import { getExamById } from './api/examService';

// קומפוננטת פורטל הסטודנטים.
// כאן סטודנט יכול לחפש בחינה לפי מזהה ולהתחיל אותה.
const StudentPortal = () => {
  // שמירת מזהה הבחינה שהוזן על ידי הסטודנט.
  const [examId, setExamId] = useState('');
  // שמירת פרטי הבחינה שנמצאה.
  const [exam, setExam] = useState(null);
  // שמירת מצב טעינה.
  const [loading, setLoading] = useState(false);
  // שמירת הודעת שגיאה.
  const [error, setError] = useState('');

  // פונקציה לטיפול בלחיצה על כפתור החיפוש.
  const handleSearch = async () => {
    if (!examId) return; // אם אין מזהה בחינה, לא עושים כלום.
    setLoading(true); // מתחילים טעינה.
    setError(''); // מאפסים שגיאות קודמות.
    setExam(null); // מאפסים בחינה קודמת.
    try {
      // מנסים לשלוף בחינה לפי המזהה שהוזן.
      const data = await getExamById(examId);
      setExam(data); // אם נמצאה, שומרים את פרטי הבחינה.
    } catch (err) {
      setError('הבחינה לא נמצאה. אנא בדוק את המזהה.'); // אם לא נמצאה, מציגים שגיאה.
    } finally {
      setLoading(false); // מסיימים טעינה.
    }
  };

  return (
    // עיצוב באמצעות Bootstrap למיכל ולכותרת.
    <div className="container mt-4">
      <h2 className="mb-4">פורטל סטודנטים</h2>
      {/* כרטיס המאפשר להזין מזהה בחינה. */}
      <div className="card shadow-sm">
        <div className="card-body">
          <h5 className="card-title">הזן מזהה בחינה כדי להתחיל</h5>
          {/* קבוצת קלט לכתיבת מזהה הבחינה וכפתור חיפוש. */}
          <div className="input-group mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="לדוגמה, 1"
              value={examId}
              onChange={(e) => setExamId(e.target.value)} // עדכון הסטייט בשינוי קלט.
            />
            <button
              className="btn btn-primary"
              type="button"
              onClick={handleSearch}
              disabled={loading} // הכפתור מושבת בזמן טעינה.
            >
              {loading ? 'מחפש...' : 'חפש בחינה'} {/* שינוי טקסט הכפתור לפי מצב הטעינה. */}
            </button>
          </div>
          {error && <div className="alert alert-danger">{error}</div>} {/* הצגת שגיאה אם קיימת. */}
        </div>
      </div>

      {exam && (
        // אם בחינה נמצאה, מציגים את פרטיה ואת כפתור ההתחלה.
        <div className="card mt-4 border-success">
          <div className="card-header bg-success text-white">
            <h5 className="mb-0">בחינה מוכנה: {exam.title}</h5>
          </div>
          <div className="card-body">
            <p>בחינה זו מכילה {exam.questions.length} שאלות.</p>
            <button className="btn btn-success">התחל בחינה עכשיו</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPortal; // ייצוא הקומפוננטה.
