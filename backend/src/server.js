import { createApp } from './app.js';
import { logger } from './logger.js';

const port = Number(process.env.PORT) || 4000;
const app = createApp();

app.listen(port, () => {
  logger.info(`examapp-server listening on http://localhost:${port}`);
});
