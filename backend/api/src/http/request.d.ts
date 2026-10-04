declare module 'express-serve-static-core' {
  interface Request {
    requestId: string;
    auth?: import('../modules/auth/domain.js').AuthContext;
  }
}

export {};
