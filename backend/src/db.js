// In-memory JSON store. Matches the client MockDb shape so that the client
// can switch between mock-only and HTTP modes without any component changes.

import { logger } from './logger.js';

const log = logger.child('db');

const SEED_USERS = [
  { id: 'u_teacher_demo', name: 'מורה לדוגמה', email: 'teacher@demo.test', password: 'teacher123', role: 'teacher' },
  { id: 'u_student_demo', name: 'תלמיד לדוגמה', email: 'student@demo.test', password: 'student123', role: 'student' },
];

const SEED_EXAMS = [
  {
    id: 'exam_seed_js',
    title: 'יסודות JavaScript',
    description: 'בחינה קצרה על מושגי יסוד בשפת JavaScript.',
    status: 'published',
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
    status: 'draft',
    createdBy: 'u_teacher_demo',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    questions: [
      { id: 'q_re_1', text: 'מהו JSX?', options: ['JavaScript XML', 'Java Syntax Extension', 'JSON XML', 'Java Server Pages'], correctAnswer: 0 },
      { id: 'q_re_2', text: 'איזה hook מטפל בתופעות לוואי?', options: ['useState', 'useEffect', 'useMemo', 'useRef'], correctAnswer: 1 },
    ],
  },
];

function rid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export class MemoryDb {
  constructor() {
    this.tables = {
      users: SEED_USERS.map(u => ({ ...u })),
      exams: SEED_EXAMS.map(e => ({ ...e, questions: e.questions.map(q => ({ ...q, options: [...q.options] })) })),
      submissions: [],
    };
    log.info(`seeded ${this.tables.users.length} users, ${this.tables.exams.length} exams`);
  }

  list(table)              { return this.tables[table].map(r => structuredClone(r)); }
  findById(table, id)      { const r = this.tables[table].find(x => x.id === id); return r ? structuredClone(r) : null; }
  findOne(table, pred)     { const r = this.tables[table].find(pred); return r ? structuredClone(r) : null; }
  insert(table, row) {
    const withId = row.id ? row : { ...row, id: rid(table.slice(0, 3)) };
    this.tables[table].push(withId);
    return structuredClone(withId);
  }
  update(table, id, patch) {
    const i = this.tables[table].findIndex(r => r.id === id);
    if (i === -1) return null;
    Object.assign(this.tables[table][i], patch);
    return structuredClone(this.tables[table][i]);
  }
  remove(table, id) {
    const before = this.tables[table].length;
    this.tables[table] = this.tables[table].filter(r => r.id !== id);
    return this.tables[table].length !== before;
  }
}

export const db = new MemoryDb();
