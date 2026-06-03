// Auth service — login / register / logout / current-user.
// Data validation and the user store live behind the ApiGateway. AuthService
// only orchestrates: invoke the gateway, persist the public profile via
// Storage, and surface success/failure toasts via Notify.

// שירות אימות (גרסת P3).
// כל הוולידציה ובדיקת הסיסמה עברו אל ApiGateway — כך אותו קוד
// שירות תקף גם במצב mock וגם כשהשרת אמיתי מגיב.
// השירות עצמו רק שומר את הפרופיל ב-Storage ומציג toast הצלחה.

const CURRENT_USER_KEY = 'current_user';

export class AuthService {
  constructor({ gateway, storage, notify, logger }) {
    this.gateway = gateway;
    this.storage = storage;
    this.notify = notify;
    this.logger = logger?.child('auth');
  }

  getCurrentUser() {
    return this.storage.get(CURRENT_USER_KEY);
  }

  async login(email, password) {
    try {
      const profile = await this.gateway.login(email, password);
      this.storage.set(CURRENT_USER_KEY, profile);
      this.logger?.info('login ok', profile.email, profile.role);
      this.notify?.success(`ברוך הבא, ${profile.name}`);
      return profile;
    } catch (err) {
      this.logger?.warn('login failed', err?.message);
      throw err;
    }
  }

  async register(payload) {
    const profile = await this.gateway.register(payload);
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
