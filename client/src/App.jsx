import React, { useState } from 'react';
import TeacherDashboard from './TeacherDashboard';
import StudentPortal from './StudentPortal';
import LoginPage from './LoginPage';
import './App.css';

function getStoredUser() {
  try {
    const raw = localStorage.getItem('exam_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function App() {
  const [user, setUser] = useState(getStoredUser);

  const handleLogin = (userData) => {
    localStorage.setItem('exam_user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('exam_user');
    setUser(null);
  };

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-vh-100 bg-light" dir="rtl">
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
        <div className="container">
          <span className="navbar-brand">מערכת בחינות אלקטרונית</span>
          <div className="d-flex align-items-center gap-3">
            <span className="text-white-50 small">
              {user.name} ({user.role === 'teacher' ? 'מורה' : 'תלמיד'})
            </span>
            <button className="btn btn-outline-danger btn-sm" onClick={handleLogout}>
              יציאה
            </button>
          </div>
        </div>
      </nav>

      <main>
        {user.welcomeMessage && (
          <div className="container mb-4">
            <div className="alert alert-success d-flex align-items-center gap-2">
              <span>✨</span>
              <span>{user.welcomeMessage}</span>
            </div>
          </div>
        )}

        {user.role === 'teacher' ? (
          <TeacherDashboard />
        ) : (
          <StudentPortal />
        )}
      </main>

      <footer className="mt-5 py-4 bg-white border-top text-center text-muted">
        <div className="container">
          <p>&copy; 2026 הדגמת מערכת בחינות אלקטרונית Mock API</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
