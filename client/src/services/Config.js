// שירות תצורה (Configuration) מרכזי לאפליקציה.
// נשמרים כאן ערכי ברירת מחדל שמשמשים את שאר השירותים והרכיבים,
// כך שאפשר לשנות התנהגות גלובלית במקום אחד בלבד.

const DEFAULTS = Object.freeze({
  appName: 'מערכת בחינות אלקטרונית',
  appVersion: '0.2.0',
  storagePrefix: 'examapp',
  logLevel: 'info',
  mockLatencyMs: 350,
  defaultPageSize: 10,
  passingGrade: 60,
});

export class Config {
  constructor(overrides = {}) {
    this._values = { ...DEFAULTS, ...overrides };
  }

  get(key) {
    return this._values[key];
  }

  set(key, value) {
    this._values[key] = value;
  }

  all() {
    return { ...this._values };
  }
}
