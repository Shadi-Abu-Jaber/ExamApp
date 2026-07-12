// Home page — the app's main entry point.
// Shows separate cards for teachers and students; the link updates based on the
// auth state.

import { Link } from 'react-router-dom';
import { useServices } from '../context/ServicesContext.jsx';

export default function HomePage({ user }) {
  const { config } = useServices();

  return (
    <div className="container py-5" dir="rtl">
      <div className="text-center mb-5">
        <h1 className="display-5 fw-bold">{config.get('appName')}</h1>
        <p className="lead text-muted">
          פלטפורמת בחינות מקוונת — מורים בונים בחינות, תלמידים נבחנים ומקבלים ציון מיידי.
        </p>
      </div>

      <div className="row g-4 justify-content-center">
        <div className="col-md-5">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <h5 className="card-title">למורים</h5>
              <p className="card-text text-muted">
                בנו בחינות, ערכו שאלות, פרסמו לתלמידים, סגרו או החזירו לטיוטה.
              </p>
              {user?.role === 'teacher' ? (
                <Link to="/teacher" className="btn btn-primary">לוח המורה שלי</Link>
              ) : (
                <Link to="/login" className="btn btn-outline-primary">כניסת מורה</Link>
              )}
            </div>
          </div>
        </div>

        <div className="col-md-5">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <h5 className="card-title">לתלמידים</h5>
              <p className="card-text text-muted">
                גלשו בין בחינות פתוחות, ענו, שלחו וקבלו ציון מיידי.
              </p>
              {user?.role === 'student' ? (
                <Link to="/student" className="btn btn-success">לאזור התלמיד</Link>
              ) : (
                <Link to="/login" className="btn btn-outline-success">כניסת תלמיד</Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-muted mt-5 small">
        גרסה {config.get('appVersion')} · {config.get('dataMode') === 'http'
          ? 'מחובר לשרת'
          : 'נתוני דמו נשמרים מקומית בדפדפן'}
      </p>
    </div>
  );
}
