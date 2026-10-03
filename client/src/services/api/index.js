import { env } from '@/config/env';
import { createRealApi } from './real';
import { createMockApi } from './mock';

// The ONLY entry point the rest of the app uses to talk to the backend.
export const api = env.useMocks ? createMockApi() : createRealApi();