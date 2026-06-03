import { logger } from '../logger.js';

const log = logger.child('error');

export function notFound(_req, res) {
  res.status(404).json({ error: 'route not found' });
}

export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  if (status >= 500) log.error(err.stack || err.message);
  else log.warn(err.message);
  res.status(status).json({ error: err.message || 'internal error' });
}

export function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}
