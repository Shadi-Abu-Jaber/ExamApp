import React, { useState } from 'react';
import TeacherDashboard from './TeacherDashboard';
import StudentPortal from './StudentPortal';
import './App.css';

// הקומפוננטה הראשית של האפליקציה.
// מנהלת את תצוגת לוח המחוונים של המורה או פורטל הסטודנטים.
function App() {
  // סטייט לשמירת התפקיד הנוכחי: 'teacher' או 'student'.
  const [role, setRole] = useState('teacher'); 

  // פונקציה שמחליפה בין התפקידים (מורה/סטודנט).
  const toggleRole = () => {
    setRole(prevRole => (prevRole === 'teacher' ? 'student' : 'teacher'));
  };

  return (
    // עוטף את כל האפליקציה ב-div עם עיצוב בסיסי של Bootstrap.
    <div className="min-vh-100 bg-light">
      // סרגל ניווט עליון עם כותרת וכפתור החלפת תפקידים.
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
        <div className="container">
          <span className="navbar-brand">מערכת בחינות אלקטרונית</span>
          <button 
            // כפתור להחלפת תפקיד, עם עיצוב שמשתנה לפי התפקיד הנוכחי.
            className={`btn ${role === 'teacher' ? 'btn-outline-warning' : 'btn-outline-info'}`}
            onClick={toggleRole}
          >
            החלף ל{role === 'teacher' ? 'תלמיד' : 'מורה'} תצוגה
          </button>
        </div>
      </nav>

      <main>
        // מציג את התפקיד הנוכחי למשתמש.
        <div className="container text-center mb-4">
          <div className="alert alert-secondary py-2 d-inline-block">
            מחובר כרגע בתור: <strong>{role.charAt(0).toUpperCase() + role.slice(1)}</strong>
          </div>
        </div>

        {/* תצוגה מותנית: אם התפקיד הוא 'teacher', מציגים את TeacherDashboard, אחרת את StudentPortal */}
        {role === 'teacher' ? (
          <TeacherDashboard />
        ) : (
          <StudentPortal />
        )}
      </main>

      // פוטר (תחתית העמוד) עם מידע על זכויות יוצרים.
      <footer className="mt-5 py-4 bg-white border-top text-center text-muted">
        <div className="container">
          <p>&copy; 2026 הדגמת מערכת בחינות אלקטרונית Mock API</p>
        </div>
      </footer>
    </div>
  );
}

export default App; // ייצוא הקומפוננטה הראשית.
