class LoggerService {
  info(message, data) {
    if (import.meta.env.DEV) {
      console.info(`[ExamFlow] ${message}`, data || '');
    }
  }

  warn(message, data) {
    if (import.meta.env.DEV) {
      console.warn(`[ExamFlow] ${message}`, data || '');
    }
  }

  error(message, error) {
    if (import.meta.env.DEV) {
      console.error(`[ExamFlow] ${message}`, error || '');
    }
  }
}

const loggerService = new LoggerService();

export default loggerService;