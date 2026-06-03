import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useServices } from '../context/ServicesContext.jsx';

export default function NavigationMenu({ user, onLogout }) {
  const { config } = useServices();
  const appName = config.get('appName');
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark" dir="rtl">
      <div className="container">
        <Link to="/" className="navbar-brand fw-bold">{appName}</Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {isTeacher && (
              <>
                <li className="nav-item">
                  <NavLink to="/teacher" end className="nav-link">לוח מורה</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/teacher/exams" className="nav-link">הבחינות שלי</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/teacher/exams/new" className="nav-link">בחינה חדשה</NavLink>
                </li>
              </>
            )}
            {isStudent && (
              <>
                <li className="nav-item">
                  <NavLink to="/student" end className="nav-link">לוח תלמיד</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/student/exams" className="nav-link">בחינות זמינות</NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/student/results" className="nav-link">התוצאות שלי</NavLink>
                </li>
              </>
            )}
          </ul>

          <div className="d-flex align-items-center gap-2">
            {user ? (
              <>
                <span className="text-white-50 small">
                  {user.name} ({isTeacher ? 'מורה' : 'תלמיד'})
                </span>
                <button className="btn btn-outline-light btn-sm" onClick={onLogout}>
                  יציאה
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="btn btn-outline-light btn-sm">כניסה</NavLink>
                <NavLink to="/register" className="btn btn-light btn-sm">הרשמה</NavLink>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
