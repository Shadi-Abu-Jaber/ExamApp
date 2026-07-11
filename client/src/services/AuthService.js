// Auth service — login / register / logout / current-user.
// Data validation and the user store live behind the ApiGateway. AuthService
// only orchestrates: invoke the gateway, persist the public profile via
// Storage, and surface success/failure toasts via Notify.

// שירות אימות (גרסת P3).
// כל הוולידציה ובדיקת הסיסמה עברו אל ApiGateway — כך אותו קוד
// שירות תקף גם במצב mock וגם כשהשרת אמיתי מגיב.
// השירות עצמו רק שומר את הפרופיל ב-Storage ומציג toast הצלחה.

const CURRENT_USER_KEY = 'current_user';
const TOKEN_KEY = 'auth_token';

export class AuthService {
  constructor({ gateway, storage, notify, logger }) {
    this.gateway = gateway;
    this.storage = storage;
    this.notify = notify;
    this.logger = logger?.child('auth');
    // שחזור טוקן קיים בעליית האפליקציה — כדי שבקשות http יישארו מאומתות
    // אחרי רענון דף. במצב mock אין טוקן ולכן אין מה לשחזר.
    const savedToken = this.storage.get(TOKEN_KEY);
    if (savedToken) this.gateway.setToken?.(savedToken);
  }

  getCurrentUser() {
    return this.storage.get(CURRENT_USER_KEY);
  }

  // שומר את הפרופיל, ואם התקבל טוקן (מצב http) — שומר אותו ומגדיר אותו
  // ב-gateway כך שכל בקשה הבאה תישלח עם Authorization.
  _persistSession(user, token) {
    this.storage.set(CURRENT_USER_KEY, user);
    if (token) {
      this.storage.set(TOKEN_KEY, token);
      this.gateway.setToken?.(token);
    }
  }

  async login(email, password) {
    try {
      const { user, token } = await this.gateway.login(email, password);
      this._persistSession(user, token);
      this.logger?.info('login ok', user.email, user.role);
      this.notify?.success(`ברוך הבא, ${user.name}`);
      return user;
    } catch (err) {
      this.logger?.warn('login failed', err?.message);
      throw err;
    }
  }

  async register(payload) {
    const { user, token } = await this.gateway.register(payload);
    this._persistSession(user, token);
    this.logger?.info('register ok', user.email, user.role);
    this.notify?.success(`חשבון נוצר בהצלחה. ברוך הבא, ${user.name}`);
    return user;
  }

  logout() {
    const current = this.getCurrentUser();
    this.storage.remove(CURRENT_USER_KEY);
    this.storage.remove(TOKEN_KEY);
    this.gateway.setToken?.(null);
    this.logger?.info('logout', current?.email);
  }
}
