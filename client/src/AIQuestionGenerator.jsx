import React, { useState } from 'react';
import { createExam } from './api/examService';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

async function generateQuestionsWithAI(topic, count, apiKey) {
  const prompt = `Generate exactly ${count} multiple-choice exam questions about "${topic}".
Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{
  "title": "exam title in Hebrew",
  "questions": [
    {
      "id": 1,
      "text": "question text in Hebrew",
      "options": ["option A", "option B", "option C", "option D"],
      "correctAnswer": 0
    }
  ]
}
Rules:
- All text must be in Hebrew
- Each question must have exactly 4 options
- correctAnswer is the index (0-3) of the correct option
- Title should describe the topic in Hebrew`;

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
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `שגיאת API: ${response.status}`);
  }

  const data = await response.json();
  const rawText = data.content[0].text.trim();

  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('תגובת AI לא תקינה');
  return JSON.parse(jsonMatch[0]);
}

function AIQuestionGenerator({ onExamCreated }) {
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(3);
  const [apiKey, setApiKey] = useState(localStorage.getItem('anthropic_key') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [saved, setSaved] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!topic.trim()) { setError('אנא הכנס נושא לבחינה'); return; }
    if (!apiKey.trim()) { setError('נדרש Anthropic API Key ליצירת שאלות עם AI'); return; }

    setLoading(true);
    setError('');
    setPreview(null);
    setSaved(false);

    try {
      const exam = await generateQuestionsWithAI(topic.trim(), count, apiKey.trim());
      localStorage.setItem('anthropic_key', apiKey.trim());
      setPreview(exam);
    } catch (err) {
      setError(err.message || 'שגיאה ביצירת השאלות');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preview) return;
    setLoading(true);
    try {
      await createExam(preview);
      setSaved(true);
      setPreview(null);
      setTopic('');
      if (onExamCreated) onExamCreated();
    } catch {
      setError('שגיאה בשמירת הבחינה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card mt-4 border-0 shadow-sm">
      <div className="card-header bg-success text-white d-flex align-items-center gap-2">
        <span>✨</span>
        <h5 className="mb-0">יצירת בחינה עם AI</h5>
      </div>
      <div className="card-body">
        {error && (
          <div className="alert alert-danger alert-dismissible">
            {error}
            <button type="button" className="btn-close" onClick={() => setError('')} />
          </div>
        )}
        {saved && (
          <div className="alert alert-success">
            הבחינה נשמרה בהצלחה ✓
          </div>
        )}

        <form onSubmit={handleGenerate} className="row g-3 align-items-end mb-3">
          <div className="col-md-5">
            <label className="form-label fw-semibold">נושא הבחינה</label>
            <input
              type="text"
              className="form-control"
              placeholder="לדוגמה: הגוף האנושי, מהפכת התעשייה..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label fw-semibold">מספר שאלות</label>
            <select
              className="form-select"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            >
              {[2, 3, 4, 5].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label fw-semibold">Anthropic API Key</label>
            <input
              type="password"
              className="form-control"
              placeholder="sk-ant-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          <div className="col-md-1">
            <button type="submit" className="btn btn-success w-100" disabled={loading}>
              {loading ? (
                <span className="spinner-border spinner-border-sm" role="status" />
              ) : (
                'צור'
              )}
            </button>
          </div>
        </form>

        {loading && (
          <div className="text-center text-muted my-3">
            <div className="spinner-border text-success mb-2" role="status" />
            <p>AI יוצר שאלות עבורך...</p>
          </div>
        )}

        {preview && (
          <div className="border rounded p-3 bg-light">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0 fw-bold">{preview.title}</h6>
              <span className="badge bg-success">{preview.questions?.length} שאלות</span>
            </div>
            <ol className="mb-3">
              {preview.questions?.map((q, i) => (
                <li key={i} className="mb-2">
                  <div className="fw-semibold">{q.text}</div>
                  <ul className="list-unstyled mt-1 ms-3">
                    {q.options?.map((opt, j) => (
                      <li key={j} className={j === q.correctAnswer ? 'text-success fw-bold' : 'text-muted'}>
                        {j === q.correctAnswer ? '✓ ' : '• '}{opt}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
            <div className="d-flex gap-2">
              <button className="btn btn-success btn-sm" onClick={handleSave} disabled={loading}>
                שמור בחינה
              </button>
              <button className="btn btn-outline-secondary btn-sm" onClick={() => setPreview(null)}>
                בטל
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AIQuestionGenerator;
