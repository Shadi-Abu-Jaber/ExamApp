import React, { useState } from 'react';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

async function fetchAIWelcome(name, role, apiKey) {
  const roleHebrew = role === 'teacher' ? 'מורה' : 'תלמיד';
  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 80,
      messages: [{
        role: 'user',
        content: `כתוב הודעת ברכה קצרה ומעוררת בעברית ל${name} שנכנס/ת כ${roleHebrew} למערכת בחינות אלקטרונית. משפט אחד בלבד.`,
      }],
    }),
  });
  if (!response.ok) throw new Error('AI request failed');
  const data = await response.json();
  return data.content[0].text.trim();
}

function LoginPage({ onLogin }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  const [apiKey, setApiKey] = useState(localStorage.getItem('anthropic_key') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('אנא הכנס את שמך');
      return;
    }

    setLoading(true);
    setError('');

    let welcomeMessage = '';

    if (apiKey.trim()) {
      try {
        welcomeMessage = await fetchAIWelcome(name, role, apiKey.trim());
        localStorage.setItem('anthropic_key', apiKey.trim());
      } catch {
        welcomeMessage = '';
      }
    }

    if (!welcomeMessage) {
      welcomeMessage = role === 'teacher'
        ? `שלום ${name}! ברוך הבא למערכת הבחינות. מוכן לנהל את הבחינות שלך?`
        : `שלום ${name}! ברוך הבא למערכת הבחינות. בהצלחה בבחינות שלך!`;
    }

    setLoading(false);
    onLogin({ name, role, welcomeMessage });
  };

  return (
    <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center" dir="rtl">
      <div className="card shadow-lg" style={{ maxWidth: '450px', width: '100%' }}>
        <div className="card-header bg-dark text-white text-center py-4">
          <h2 className="mb-1">מערכת בחינות אלקטרונית</h2>
          <p className="mb-0 small text-white-50">כניסה למערכת</p>
        </div>
        <div className="card-body p-4">
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label fw-semibold">שם מלא</label>
              <input
                type="text"
                className="form-control"
                placeholder="הכנס את שמך"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold">תפקיד</label>
              <div className="d-flex gap-4">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="role"
                    id="roleStudent"
                    value="student"
                    checked={role === 'student'}
                    onChange={() => setRole('student')}
                  />
                  <label className="form-check-label" htmlFor="roleStudent">תלמיד</label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="role"
                    id="roleTeacher"
                    value="teacher"
                    checked={role === 'teacher'}
                    onChange={() => setRole('teacher')}
                  />
                  <label className="form-check-label" htmlFor="roleTeacher">מורה</label>
                </div>
              </div>
            </div>

            <details className="mb-4">
              <summary className="text-muted small" style={{ cursor: 'pointer' }}>
                הגדרות AI — ברכה מותאמת אישית (אופציונלי)
              </summary>
              <div className="mt-2">
                <label className="form-label small fw-semibold">Anthropic API Key</label>
                <input
                  type="password"
                  className="form-control form-control-sm"
                  placeholder="sk-ant-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <div className="form-text">
                  הזן מפתח API כדי לקבל הודעת ברכה מותאמת אישית מ-AI
                </div>
              </div>
            </details>

            <button type="submit" className="btn btn-dark w-100" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                  מתחבר...
                </>
              ) : (
                'כניסה'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
