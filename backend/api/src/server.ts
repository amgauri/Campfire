import { createApp } from './app.js';
import { loadConfig } from './config/env.js';
import { createLogger } from './config/logger.js';

const config = loadConfig();
if (config.nodeEnv === 'production') {
  throw new Error(
    'Persistent authentication repositories are required in production',
  );
}
const logger = createLogger(config);
const app = createApp(config);

app.listen(config.port, config.host, () => {
  logger.info(
    { host: config.host, port: config.port },
    'Campfire API listening',
  );
});
