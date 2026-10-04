import { createApp } from './app.js';
import { loadConfig } from './config/env.js';
import { createLogger } from './config/logger.js';
import { MongoRefreshSessionRepository } from './infrastructure/auth/mongo-refresh-session-repository.js';
import { MongoUserRepository } from './infrastructure/auth/mongo-user-repository.js';

const config = loadConfig();
const logger = createLogger(config);
const app = createApp(config, {
  users: new MongoUserRepository(),
  refreshSessions: new MongoRefreshSessionRepository(),
});

app.listen(config.port, config.host, () => {
  logger.info(
    { host: config.host, port: config.port },
    'Campfire API listening',
  );
});