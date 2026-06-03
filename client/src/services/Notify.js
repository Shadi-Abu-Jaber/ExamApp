// שירות התראות (Notifications) — תבנית פרסום-מנוי (pub/sub).
// קוד שאינו רכיב React יכול לקרוא ל-push() כדי לשלוח התראה,
// וה-UI נרשם דרך subscribe() ומציג את ההודעה כ-toast.

export class Notify {
  constructor({ logger } = {}) {
    this.logger = logger;
    this._subscribers = new Set();
    this._nextId = 1;
  }

  subscribe(handler) {
    this._subscribers.add(handler);
    return () => this._subscribers.delete(handler);
  }

  _emit(toast) {
    this._subscribers.forEach(fn => {
      try { fn(toast); } catch (err) { this.logger?.warn('notify handler failed', err); }
    });
  }

  push({ type = 'info', message, timeoutMs = 4000 }) {
    const toast = { id: this._nextId++, type, message, timeoutMs, createdAt: Date.now() };
    this.logger?.debug('notify', type, message);
    this._emit(toast);
    return toast.id;
  }

  info(message, opts)    { return this.push({ ...opts, type: 'info', message }); }
  success(message, opts) { return this.push({ ...opts, type: 'success', message }); }
  warn(message, opts)    { return this.push({ ...opts, type: 'warning', message }); }
  error(message, opts)   { return this.push({ ...opts, type: 'danger', message }); }
}
