// שירות לוגים מבוסס מחלקה (OOP).
// מספק רמות לוג (debug/info/warn/error/silent), תחילית (prefix) לזיהוי המקור,
// והאפשרות ליצור logger-ים בנים (child) עם תחילית מורחבת — שימושי
// להבחנה בין רכיבים שונים כשמסתכלים בקונסולה.

// טבלת רמות מספרית — לוג בעל רמה נמוכה מהרף לא ייכתב.
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

  // מתודה פנימית שמדפיסה לוג רק אם רמתו עוברת את הרף שהוגדר.
  // מוסיפה חותמת זמן ותחילית כדי שיהיה קל לעקוב בקונסולה.
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
