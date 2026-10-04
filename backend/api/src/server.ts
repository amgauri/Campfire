import dotenv from 'dotenv';
import { createApp } from './app.js';
import { loadConfig } from './config/env.js';
import { createLogger } from './config/logger.js';
import { connectDB, disconnectDB } from './lib/db.js';

dotenv.config({ quiet: true });
const config = loadConfig();
if (config.nodeEnv === 'production') {
  throw new Error(
    'Persistent authentication repositories are required in production',
  );
}
const logger = createLogger(config);
const app = createApp(config);

async function start(): Promise<void> {
  if (config.mongoUri) await connectDB(config.mongoUri);

  const server = app.listen(config.port, config.host, () => {
    logger.info(
      { host: config.host, port: config.port },
      'Campfire API listening',
    );
  });

  let closing = false;
  async function close(): Promise<void> {
    if (closing) return;
    closing = true;
    await new Promise<void>((resolve) => server.close(() => resolve()));
    if (config.mongoUri) await disconnectDB();
  }

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.once(signal, () => {
      void close().catch(() => {
        logger.error('Campfire API shutdown failed');
        process.exitCode = 1;
      });
    });
  }
  server.once('error', () => {
    logger.error('Campfire API failed to bind');
    process.exitCode = 1;
    void close().catch(() => {
      logger.error('Campfire API shutdown failed');
    });
  });
}

void start().catch(async (error: unknown) => {
  logger.fatal(
    { errorName: error instanceof Error ? error.name : 'UnknownError' },
    'Campfire API startup failed',
  );
  process.exitCode = 1;
  if (config.mongoUri) await disconnectDB().catch(() => undefined);
});
