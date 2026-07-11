// Single class that the rest of the client calls for *any* data work.
// Internally it switches between two backends based on Config.dataMode:
//   'mock' → use the local MockDb (offline / standalone client).
//   'http' → call the Express server at Config.serverBaseUrl.
// React components do not import this class — they keep using
// ExamService / SubmissionService / AuthService, which now delegate here.

// שער ה-API היחיד של הלקוח.
// כל פעולה (התחברות, הרשמה, בחינות, הגשות) עוברת דרך המחלקה הזו.
// בפנים, המחלקה בודקת את Config.dataMode ומחליטה אם לדבר עם השרת
// (http) או להישאר עם המסד המקומי בזיכרון (mock). הרכיבים והשירותים
// אינם רואים את ההבדל — אותה תשובה חוזרת מאותה חתימה.

// כשעובדים מול MockDb צריך להכניס *מופע של מודל* ולא אובייקט גולמי —
// אחרת אין id (המזהה נוצר בקונסטרקטור) וגם _persist() קורס כי הוא
// קורא ל-row.toJSON() על כל שורה בטבלה.
import { Exam } from '../models/Exam.js';
import { User } from '../models/User.js';
import { Submission } from '../models/Submission.js';

// כלי עזר קטן: ממתין X מילישניות כדי לדמות השהיית רשת במצב mock.
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

export class ApiGateway {
  constructor({ config, mockDb, logger }) {
    this.config = config;
    this.mockDb = mockDb;
    this.logger = logger?.child('api');
    // טוקן ה-JWT למצב http. נשמר/משוחזר על ידי AuthService (localStorage)
    // ונשלח בכותרת Authorization בכל בקשה. במצב mock נשאר null.
    this._token = null;
  }

  // מוגדר על ידי AuthService בכניסה/הרשמה ובעליית האפליקציה (rehydrate).
  setToken(token) { this._token = token || null; }

  get mode() { return this.config.get('dataMode'); }
  get baseUrl() { return this.config.get('serverBaseUrl'); }

  // מתודה פנימית — עוטפת fetch עם base URL, סדרת JSON, וטיפול בשגיאות.
  // מכאן יוצאת כל קריאה לשרת — כך לוגיקת הרשת מרוכזת במקום אחד.
  async _http(path, { method = 'GET', body, query } = {}) {
    const qs = query
      ? '?' + Object.entries(query)
          .filter(([, v]) => v != null)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
          .join('&')
      : '';
    const url = `${this.baseUrl}${path}${qs}`;
    this.logger?.debug(method, url);
    const headers = {};
    if (body) headers['Content-Type'] = 'application/json';
    if (this._token) headers.Authorization = `Bearer ${this._token}`;
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 204) return true;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.error || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return data;
  }

  async _simulateLatency() {
    await delay(this.config.get('mockLatencyMs'));
  }

  // ────────────────────────────────────────────────────────────────────
  //  AUTH
  // ────────────────────────────────────────────────────────────────────

  // מחזיר תמיד { user, token } בשני המצבים — במצב mock אין טוקן (null),
  // כך ש-AuthService מטפל בשניהם באותו קוד.
  async login(email, password) {
    if (this.mode === 'http') {
      const data = await this._http('/auth/login', { method: 'POST', body: { email, password } });
      return { user: data.user, token: data.token };
    }
    await this._simulateLatency();
    const normalized = (email || '').toLowerCase().trim();
    const user = this.mockDb.findOne('users', u => u.email === normalized && u.password === password);
    if (!user) throw new Error('אימייל או סיסמה שגויים');
    const { password: _, ...profile } = user;
    return { user: profile, token: null };
  }

  async register({ name, email, password, role }) {
    if (this.mode === 'http') {
      const data = await this._http('/auth/register', { method: 'POST', body: { name, email, password, role } });
      return { user: data.user, token: data.token };
    }
    await this._simulateLatency();
    const normalized = (email || '').toLowerCase().trim();
    if (!name?.trim()) throw new Error('יש להזין שם');
    if (!normalized) throw new Error('יש להזין אימייל');
    if (!password || password.length < 6) throw new Error('סיסמה חייבת להכיל לפחות 6 תווים');
    if (!['teacher', 'student'].includes(role)) throw new Error('יש לבחור תפקיד');
    if (this.mockDb.findOne('users', u => u.email === normalized)) {
      throw new Error('אימייל כבר קיים במערכת');
    }
    const inserted = this.mockDb.insert(
      'users',
      new User({ name: name.trim(), email: normalized, password, role })
    );
    const { password: _, ...profile } = inserted;
    return { user: profile, token: null };
  }

  // ────────────────────────────────────────────────────────────────────
  //  EXAMS
  // ────────────────────────────────────────────────────────────────────

  async listAllExams() {
    if (this.mode === 'http') return this._http('/exams');
    await this._simulateLatency();
    return this.mockDb.list('exams');
  }

  async listPublishedExams() {
    if (this.mode === 'http') return this._http('/exams', { query: { status: 'published' } });
    await this._simulateLatency();
    return this.mockDb.list('exams').filter(e => e.status === 'published');
  }

  async listExamsByTeacher(teacherId) {
    if (this.mode === 'http') return this._http('/exams', { query: { teacherId } });
    await this._simulateLatency();
    return this.mockDb.list('exams').filter(e => e.createdBy === teacherId);
  }

  async getExam(id) {
    if (this.mode === 'http') return this._http(`/exams/${encodeURIComponent(id)}`);
    await this._simulateLatency();
    const exam = this.mockDb.findById('exams', id);
    if (!exam) throw new Error('הבחינה לא נמצאה');
    return exam;
  }

  async createExam({ title, description, questions, createdBy }) {
    if (this.mode === 'http') {
      return this._http('/exams', { method: 'POST', body: { title, description, questions, createdBy } });
    }
    await this._simulateLatency();
    return this.mockDb.insert(
      'exams',
      new Exam({
        title,
        description,
        questions,
        createdBy,
        status: 'draft',
        createdAt: Date.now(),
      })
    );
  }

  async updateExam(id, patch) {
    if (this.mode === 'http') {
      return this._http(`/exams/${encodeURIComponent(id)}`, { method: 'PUT', body: patch });
    }
    await this._simulateLatency();
    const updated = this.mockDb.update('exams', id, patch);
    if (!updated) throw new Error('הבחינה לא נמצאה');
    return updated;
  }

  async setExamStatus(id, status) {
    if (this.mode === 'http') {
      return this._http(`/exams/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { status } });
    }
    if (!['draft', 'published', 'closed'].includes(status)) throw new Error('סטטוס לא תקין');
    return this.updateExam(id, { status });
  }

  async removeExam(id) {
    if (this.mode === 'http') return this._http(`/exams/${encodeURIComponent(id)}`, { method: 'DELETE' });
    await this._simulateLatency();
    return this.mockDb.remove('exams', id);
  }

  // ────────────────────────────────────────────────────────────────────
  //  SUBMISSIONS
  // ────────────────────────────────────────────────────────────────────

  async listSubmissionsByStudent(studentId) {
    if (this.mode === 'http') return this._http('/submissions', { query: { studentId } });
    await this._simulateLatency();
    return this.mockDb.list('submissions').filter(s => s.studentId === studentId);
  }

  async listSubmissionsByExam(examId) {
    if (this.mode === 'http') return this._http('/submissions', { query: { examId } });
    await this._simulateLatency();
    return this.mockDb.list('submissions').filter(s => s.examId === examId);
  }

  async submitExam({ examId, studentId, answers }) {
    if (this.mode === 'http') {
      return this._http('/submissions', { method: 'POST', body: { examId, studentId, answers } });
    }
    await this._simulateLatency();
    const exam = this.mockDb.findById('exams', examId);
    if (!exam) throw new Error('הבחינה לא נמצאה');
    let score = 0;
    exam.questions.forEach((q, i) => { if (answers[i] === q.correctAnswer) score += 1; });
    return this.mockDb.insert(
      'submissions',
      new Submission({
        examId,
        studentId,
        answers,
        score,
        total: exam.questions.length,
        submittedAt: Date.now(),
      })
    );
  }
}
