const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 99 };

export class Logger {
  constructor({ prefix = 'server', level = process.env.LOG_LEVEL || 'info' } = {}) {
    this.prefix = prefix;
    this.level = LEVELS[level] ?? LEVELS.info;
  }

  child(sub) {
    return new Logger({
      prefix: `${this.prefix}:${sub}`,
      level: Object.keys(LEVELS).find(k => LEVELS[k] === this.level) || 'info',
    });
  }

  _emit(name, args) {
    if (LEVELS[name] < this.level) return;
    const stamp = new Date().toISOString().split('T')[1].replace('Z', '');
    const fn = console[name] || console.log;
    fn(`[${stamp}][${this.prefix}][${name}]`, ...args);
  }

  debug(...a) { this._emit('debug', a); }
  info(...a)  { this._emit('info', a); }
  warn(...a)  { this._emit('warn', a); }
  error(...a) { this._emit('error', a); }
}

export const logger = new Logger();
