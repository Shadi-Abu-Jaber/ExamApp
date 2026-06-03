// רישום שירותים מרכזי (Service Registry).
// אחראי על יצירת כל השירותים בסדר הנכון של תלויות:
// Config → Logger → Storage → Notify → MockDb → ApiGateway →
// ExamService/SubmissionService/AuthService.
// נשמר instance יחיד כדי שכל האפליקציה תעבוד מול אותם מופעים (singleton).

import { Logger } from './Logger.js';
import { Config } from './Config.js';
import { Storage } from './Storage.js';
import { Notify } from './Notify.js';
import { MockDb } from '../api/mockDb.js';
import { ApiGateway } from '../api/ApiGateway.js';
import { ExamService, SubmissionService } from '../api/examService.js';
import { AuthService } from './AuthService.js';

let instance = null;

// קורא משתני סביבה של Vite (VITE_DATA_MODE, VITE_SERVER_BASE_URL)
// כדי לאפשר שינוי מצב מבלי לערוך קוד — דרך client/.env.
function readEnvOverrides() {
  // Vite injects values prefixed with VITE_ at build time / dev start.
  const env = (typeof import.meta !== 'undefined' && import.meta.env) || {};
  const overrides = {};
  if (env.VITE_DATA_MODE) overrides.dataMode = env.VITE_DATA_MODE;
  if (env.VITE_SERVER_BASE_URL) overrides.serverBaseUrl = env.VITE_SERVER_BASE_URL;
  return overrides;
}

// מאפשר למפתחים להחליף מצב mock/http בזמן ריצה דרך DevTools, בלי build:
//   localStorage.setItem('examapp::dataMode', 'http')
function readLocalStorageOverride(prefix) {
  // Lets a developer flip modes at runtime from DevTools, e.g.:
  //   localStorage.setItem('examapp::dataMode', 'http')
  try {
    const v = window.localStorage.getItem(`${prefix}::dataMode`);
    if (v === 'http' || v === 'mock') return { dataMode: v };
  } catch { /* localStorage unavailable */ }
  return {};
}

// יוצר את גרף השירותים פעם אחת ומחזיר אותו בכל קריאה נוספת.
export function bootstrapServices(overrides = {}) {
  if (instance) return instance;

  const envOverrides = readEnvOverrides();
  const config = new Config({ ...envOverrides, ...overrides.config });

  // localStorage override applied after Config exists, before the rest of
  // the graph reads dataMode.
  const lsOverride = readLocalStorageOverride(config.get('storagePrefix'));
  Object.entries(lsOverride).forEach(([k, v]) => config.set(k, v));

  const logger = new Logger({ prefix: 'examapp', level: config.get('logLevel') });
  const storage = new Storage({ prefix: config.get('storagePrefix'), logger: logger.child('storage') });
  const notify = new Notify({ logger: logger.child('notify') });
  const mockDb = new MockDb({ storage, logger });
  const gateway = new ApiGateway({ config, mockDb, logger });
  const examService = new ExamService({ gateway, logger });
  const submissionService = new SubmissionService({ gateway, logger });
  const auth = new AuthService({ gateway, storage, notify, logger });

  instance = { config, logger, storage, notify, db: mockDb, gateway, examService, submissionService, auth };
  logger.info(
    `${config.get('appName')} v${config.get('appVersion')} ready · mode=${config.get('dataMode')}` +
    (config.get('dataMode') === 'http' ? ` · server=${config.get('serverBaseUrl')}` : '')
  );
  return instance;
}

export function getServices() {
  if (!instance) throw new Error('services not bootstrapped — call bootstrapServices() first');
  return instance;
}
