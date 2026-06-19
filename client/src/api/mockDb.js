// מסד נתונים מדומה (MockDb) — מחליף שרת אמיתי בשלב זה.
// טבלאות בזיכרון: users, exams, submissions. הכל נשמר ב-Storage
// כדי שהמצב יישמר בין רענונים. בטעינה ראשונה זורעים נתוני דמו.

import { Exam, EXAM_STATUS } from '../models/Exam.js';
import { Question } from '../models/Question.js';
import { User, USER_ROLE } from '../models/User.js';
import { Submission } from '../models/Submission.js';

const SEED_USERS = [
  { id: 'u_teacher_demo', name: 'מורה לדוגמה', email: 'teacher@demo.test', password: 'teacher123', role: USER_ROLE.TEACHER },
  { id: 'u_student_demo', name: 'תלמיד לדוגמה', email: 'student@demo.test', password: 'student123', role: USER_ROLE.STUDENT },
];

const SEED_EXAMS = [
  {
    id: 'exam_seed_js',
    title: 'יסודות JavaScript',
    description: 'בחינה קצרה על מושגי יסוד בשפת JavaScript.',
    status: EXAM_STATUS.PUBLISHED,
    createdBy: 'u_teacher_demo',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    questions: [
      { id: 'q_js_1', text: 'מהו closure?', options: ['פונקציה עם הסביבה הלקסיקלית שלה', 'סוג של לולאה', 'תכונת CSS', 'מבנה נתונים'], correctAnswer: 0 },
      { id: 'q_js_2', text: 'איזו מילת מפתח מגדירה קבוע?', options: ['var', 'let', 'const', 'static'], correctAnswer: 2 },
    ],
  },
  {
    id: 'exam_seed_react',
    title: 'יסודות React',
    description: 'בחינה קצרה על React ו-hooks.',
    status: EXAM_STATUS.DRAFT,
    createdBy: 'u_teacher_demo',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    questions: [
      { id: 'q_re_1', text: 'מהו JSX?', options: ['JavaScript XML', 'Java Syntax Extension', 'JSON XML', 'Java Server Pages'], correctAnswer: 0 },
      { id: 'q_re_2', text: 'איזה hook מטפל בתופעות לוואי?', options: ['useState', 'useEffect', 'useMemo', 'useRef'], correctAnswer: 1 },
    ],
  },
];

export class MockDb {
  constructor({ storage, logger }) {
    this.storage = storage;
    this.logger = logger?.child('mockdb');
    this.tables = { users: [], exams: [], submissions: [] };
    this._load();
  }

  // טעינה ראשונית: אם יש נתונים שמורים — משחזרים; אחרת זורעים demo.
  _load() {
    const saved = this.storage.get('mockdb');
    if (saved && saved.users?.length) {
      this.tables.users = saved.users.map(u => new User(u));
      this.tables.exams = (saved.exams || []).map(e => new Exam(e));
      this.tables.submissions = (saved.submissions || []).map(s => new Submission(s));
      this.logger?.info('loaded from storage', {
        users: this.tables.users.length,
        exams: this.tables.exams.length,
        submissions: this.tables.submissions.length,
      });
    } else {
      this.tables.users = SEED_USERS.map(u => new User(u));
      this.tables.exams = SEED_EXAMS.map(e => new Exam(e));
      this.tables.submissions = [];
      this._persist();
      this.logger?.info('seeded from defaults');
    }
  }

  _persist() {
    this.storage.set('mockdb', {
      users: this.tables.users.map(u => u.toJSON()),
      exams: this.tables.exams.map(e => e.toJSON()),
      submissions: this.tables.submissions.map(s => s.toJSON()),
    });
  }

  reset() {
    this.storage.remove('mockdb');
    this._load();
  }

  // generic CRUD on a table by name; returns plain JSON snapshots
  list(table) { return this.tables[table].map(r => r.toJSON ? r.toJSON() : { ...r }); }

  findById(table, id) {
    const row = this.tables[table].find(r => r.id === id);
    return row ? (row.toJSON ? row.toJSON() : { ...row }) : null;
  }

  findOne(table, predicate) {
    const row = this.tables[table].find(predicate);
    return row ? (row.toJSON ? row.toJSON() : { ...row }) : null;
  }

  insert(table, instance) {
    this.tables[table].push(instance);
    this._persist();
    return instance.toJSON ? instance.toJSON() : { ...instance };
  }

  update(table, id, patch) {
    const idx = this.tables[table].findIndex(r => r.id === id);
    if (idx === -1) return null;
    const current = this.tables[table][idx];
    // ה-patch עשוי להגיע עם אובייקטים גולמיים (למשל questions מהטופס) ולא
    // עם מופעי מודל. מיזוג ובנייה מחדש דרך הקונסטרקטור של השורה שומרים על
    // המופעים המקוננים (Exam.questions → Question) כך ש-_persist()/toJSON()
    // לא קורסים עם "q.toJSON is not a function".
    const Model = current.constructor;
    const merged = { ...(current.toJSON ? current.toJSON() : current), ...patch };
    const next = (Model && Model !== Object) ? new Model(merged) : merged;
    this.tables[table][idx] = next;
    this._persist();
    return next.toJSON ? next.toJSON() : { ...next };
  }

  remove(table, id) {
    const before = this.tables[table].length;
    this.tables[table] = this.tables[table].filter(r => r.id !== id);
    const removed = this.tables[table].length !== before;
    if (removed) this._persist();
    return removed;
  }
}
