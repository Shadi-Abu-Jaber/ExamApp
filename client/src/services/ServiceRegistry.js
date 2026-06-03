import { Logger } from './Logger.js';
import { Config } from './Config.js';
import { Storage } from './Storage.js';
import { Notify } from './Notify.js';
import { MockDb } from '../api/mockDb.js';
import { ExamService, SubmissionService } from '../api/examService.js';

// רישום שירותים מרכזי (Service Registry).
// אחראי על יצירת כל השירותים בסדר הנכון של תלויות:
// Config → Logger → Storage → Notify → MockDb → ExamService/SubmissionService.
// נשמר instance יחיד כדי שכל האפליקציה תעבוד מול אותם מופעים (singleton).

let instance = null;

// יוצר את גרף השירותים פעם אחת ומחזיר אותו בכל קריאה נוספת.
export function bootstrapServices(overrides = {}) {
  if (instance) return instance;

  const config = new Config(overrides.config);
  const logger = new Logger({ prefix: 'examapp', level: config.get('logLevel') });
  const storage = new Storage({ prefix: config.get('storagePrefix'), logger: logger.child('storage') });
  const notify = new Notify({ logger: logger.child('notify') });
  const db = new MockDb({ storage, logger });
  const examService = new ExamService({ db, config, logger });
  const submissionService = new SubmissionService({ db, config, logger });

  instance = { config, logger, storage, notify, db, examService, submissionService };
  logger.info(`${config.get('appName')} v${config.get('appVersion')} ready`);
  return instance;
}

export function getServices() {
  if (!instance) throw new Error('services not bootstrapped — call bootstrapServices() first');
  return instance;
}
