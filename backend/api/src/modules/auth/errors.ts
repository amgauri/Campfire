export type AuthFailureCode =
  | 'EMAIL_IN_USE'
  | 'USERNAME_UNAVAILABLE'
  | 'INVALID_CREDENTIALS'
  | 'INVALID_REFRESH_TOKEN'
  | 'UNAUTHENTICATED';

export class AuthFailure extends Error {
  constructor(public readonly code: AuthFailureCode) {
    super(code);
    this.name = 'AuthFailure';
  }
}
