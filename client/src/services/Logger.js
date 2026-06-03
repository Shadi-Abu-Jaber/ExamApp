const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 99 };

export class Logger {
  constructor({ prefix = 'app', level = 'info' } = {}) {
    this.prefix = prefix;
    this.level = LEVELS[level] ?? LEVELS.info;
  }

  setLevel(level) {
    this.level = LEVELS[level] ?? this.level;
  }

  child(subPrefix) {
    return new Logger({
      prefix: `${this.prefix}:${subPrefix}`,
      level: Object.keys(LEVELS).find(k => LEVELS[k] === this.level) || 'info',
    });
  }

  _emit(levelName, args) {
    if (LEVELS[levelName] < this.level) return;
    const stamp = new Date().toISOString().split('T')[1].replace('Z', '');
    const tag = `[${stamp}][${this.prefix}][${levelName}]`;
    const fn = console[levelName] || console.log;
    fn(tag, ...args);
  }

  debug(...args) { this._emit('debug', args); }
  info(...args)  { this._emit('info', args); }
  warn(...args)  { this._emit('warn', args); }
  error(...args) { this._emit('error', args); }
}
