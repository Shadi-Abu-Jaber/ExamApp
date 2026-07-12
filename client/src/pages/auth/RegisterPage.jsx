// Registration page.
// Takes a name, email, password and role; calls AuthContext.register, and on
// success logs in automatically and navigates to the dashboard for the role.

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useServices } from '../../context/ServicesContext.jsx';

export default function RegisterPage() {
  const { register } = useAuth();
  const { notify } = useServices();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const profile = await register({ name, email, password, role });
      const target = profile.role === 'teacher' ? '/teacher' : '/student';
      navigate(target, { replace: true });
    } catch (err) {
      const msg = err?.message || 'שגיאה בהרשמה';
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
            <div className="card-header bg-success text-white text-center py-3">
              <h4 className="mb-0">הרשמה למערכת</h4>
            </div>
            <div className="card-body p-4">
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">שם מלא</label>
                  <input
                    type="text"
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">אימייל</label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">סיסמה</label>
                  <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <div className="form-text">לפחות 6 תווים</div>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold d-block">תפקיד</label>
                  <div className="btn-group w-100" role="group">
                    <input
                      type="radio"
                      className="btn-check"
                      id="roleStudent"
                      checked={role === 'student'}
                      onChange={() => setRole('student')}
                    />
                    <label className="btn btn-outline-success" htmlFor="roleStudent">תלמיד</label>

                    <input
                      type="radio"
                      className="btn-check"
                      id="roleTeacher"
                      checked={role === 'teacher'}
                      onChange={() => setRole('teacher')}
                    />
                    <label className="btn btn-outline-primary" htmlFor="roleTeacher">מורה</label>
                  </div>
                </div>

                <button type="submit" className="btn btn-success w-100" disabled={submitting}>
                  {submitting ? 'נרשם...' : 'הרשמה'}
                </button>
              </form>

              <hr className="my-4" />
              <p className="text-center mb-0 small text-muted">
                כבר רשום? <Link to="/login">להתחברות</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
