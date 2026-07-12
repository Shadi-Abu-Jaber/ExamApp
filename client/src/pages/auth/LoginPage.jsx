// Login page.
// Takes an email and password, calls AuthContext.login, and on success
// navigates to the dashboard by role (teacher / student). Includes a hint with
// the demo accounts.

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useServices } from '../../context/ServicesContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const { notify } = useServices();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const profile = await login(email, password);
      const target = profile.role === 'teacher' ? '/teacher' : '/student';
      navigate(redirectTo === '/' ? target : redirectTo, { replace: true });
    } catch (err) {
      const msg = err?.message || 'שגיאה בכניסה';
      setError(msg);
      notify.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-5" dir="rtl">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow-sm">
            <div className="card-header bg-dark text-white text-center py-3">
              <h4 className="mb-0">כניסה למערכת</h4>
            </div>
            <div className="card-body p-4">
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">אימייל</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">סיסמה</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-dark w-100" disabled={submitting}>
                  {submitting ? 'מתחבר...' : 'כניסה'}
                </button>
              </form>

              <hr className="my-4" />
              <p className="text-center mb-2 small text-muted">
                אין לך חשבון? <Link to="/register">להרשמה</Link>
              </p>
              <details className="small text-muted">
                <summary>חשבונות דמו</summary>
                <ul className="mt-2 mb-0">
                  <li>מורה: teacher@demo.test / teacher123</li>
                  <li>תלמיד: student@demo.test / student123</li>
                </ul>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
