import { User, USER_ROLE } from '../models/User.js';

const CURRENT_USER_KEY = 'current_user';

export class AuthService {
  constructor({ db, storage, notify, logger }) {
    this.db = db;
    this.storage = storage;
    this.notify = notify;
    this.logger = logger?.child('auth');
  }

  getCurrentUser() {
    return this.storage.get(CURRENT_USER_KEY);
  }

  async login(email, password) {
    const normalized = (email || '').toLowerCase().trim();
    const found = this.db.findOne('users', u => u.email === normalized && u.password === password);
    if (!found) {
      this.logger?.warn('login failed', normalized);
      throw new Error('אימייל או סיסמה שגויים');
    }
    const profile = new User(found).publicProfile();
    this.storage.set(CURRENT_USER_KEY, profile);
    this.logger?.info('login ok', profile.email, profile.role);
    this.notify?.success(`ברוך הבא, ${profile.name}`);
    return profile;
  }

  async register({ name, email, password, role }) {
    const normalized = (email || '').toLowerCase().trim();
    if (!name?.trim()) throw new Error('יש להזין שם');
    if (!normalized) throw new Error('יש להזין אימייל');
    if (!password || password.length < 6) throw new Error('סיסמה חייבת להכיל לפחות 6 תווים');
    if (!Object.values(USER_ROLE).includes(role)) throw new Error('יש לבחור תפקיד');

    const exists = this.db.findOne('users', u => u.email === normalized);
    if (exists) throw new Error('אימייל כבר קיים במערכת');

    const user = new User({ name: name.trim(), email: normalized, password, role });
    this.db.insert('users', user);
    const profile = user.publicProfile();
    this.storage.set(CURRENT_USER_KEY, profile);
    this.logger?.info('register ok', profile.email, profile.role);
    this.notify?.success(`חשבון נוצר בהצלחה. ברוך הבא, ${profile.name}`);
    return profile;
  }

  logout() {
    const current = this.getCurrentUser();
    this.storage.remove(CURRENT_USER_KEY);
    this.logger?.info('logout', current?.email);
  }
}
