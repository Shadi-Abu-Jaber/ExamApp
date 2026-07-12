// Storage service — a thin wrapper around localStorage.
// Benefits of the wrapper:
//   1. A prefix — prevents collisions with other apps' data.
//   2. Automatic JSON on read and write.
//   3. An in-memory fallback (Map) for when localStorage is unavailable.

export class Storage {
  constructor({ prefix = 'app', logger } = {}) {
    this.prefix = prefix;
    this.logger = logger;
    this.available = this._probe();
  }

  // Checks whether localStorage is available in the runtime (e.g. private mode).
  // If not, fall back to in-memory storage (not persisted across reloads).
  _probe() {
    try {
      const k = `${this.prefix}::__probe__`;
      window.localStorage.setItem(k, '1');
      window.localStorage.removeItem(k);
      return true;
    } catch (err) {
      this.logger?.warn('localStorage unavailable, falling back to in-memory', err?.message);
      this._mem = new Map();
      return false;
    }
  }

  _key(key) {
    return `${this.prefix}::${key}`;
  }

  get(key, fallback = null) {
    try {
      const raw = this.available
        ? window.localStorage.getItem(this._key(key))
        : this._mem.get(this._key(key));
      if (raw == null) return fallback;
      return JSON.parse(raw);
    } catch (err) {
      this.logger?.warn(`Storage.get failed for ${key}`, err?.message);
      return fallback;
    }
  }

  set(key, value) {
    const raw = JSON.stringify(value);
    if (this.available) {
      window.localStorage.setItem(this._key(key), raw);
    } else {
      this._mem.set(this._key(key), raw);
    }
  }

  remove(key) {
    if (this.available) {
      window.localStorage.removeItem(this._key(key));
    } else {
      this._mem.delete(this._key(key));
    }
  }

  clearNamespace() {
    if (this.available) {
      const toRemove = [];
      for (let i = 0; i < window.localStorage.length; i += 1) {
        const k = window.localStorage.key(i);
        if (k?.startsWith(`${this.prefix}::`)) toRemove.push(k);
      }
      toRemove.forEach(k => window.localStorage.removeItem(k));
    } else {
      this._mem.clear();
    }
  }
}
