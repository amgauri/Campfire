import mongoose from 'mongoose';
import type { PostRepository } from '../modules/posts/port.js';
import type { SurgeOverrideRepository } from '../modules/surge/port.js';
import type {
  RefreshSessionRepository,
  UserRepository,
} from '../modules/auth/ports.js';
import { MongoPostRepository } from '../infrastructure/mongo/post-repository.js';
import { MongoRefreshSessionRepository } from '../infrastructure/mongo/refresh-session-repository.js';
import { initializeMongoIndexes } from '../infrastructure/mongo/models.js';
import { MongoSurgeStatusRepository } from '../infrastructure/mongo/surge-status-repository.js';
import { MongoUserRepository } from '../infrastructure/mongo/user-repository.js';

export type MongoRepositories = {
  users: UserRepository;
  refreshSessions: RefreshSessionRepository;
  posts: PostRepository;
  surgeStatus: SurgeOverrideRepository;
  isReady: () => Promise<boolean>;
};

export async function connectDB(uri: string): Promise<MongoRepositories> {
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    autoIndex: true,
  });
  const database = mongoose.connection.db;
  if (!database) {
    await mongoose.disconnect();
    throw new Error('MongoDB connection did not provide a database handle');
  }

  const topology = await database.admin().command({ hello: 1 });
  if (typeof topology.setName !== 'string' && topology.msg !== 'isdbgrid') {
    await mongoose.disconnect();
    throw new Error(
      'MongoDB transactions require a replica set or sharded cluster',
    );
  }

  await initializeMongoIndexes();
  return {
    users: new MongoUserRepository(),
    refreshSessions: new MongoRefreshSessionRepository(),
    posts: new MongoPostRepository(),
    surgeStatus: new MongoSurgeStatusRepository(),
    isReady: async () => {
      if (
        mongoose.connection.readyState !==
          mongoose.ConnectionStates.connected ||
        !mongoose.connection.db
      ) {
        return false;
      }
      try {
        await mongoose.connection.db.admin().command({ ping: 1 });
        return true;
      } catch {
        return false;
      }
    },
  };
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
