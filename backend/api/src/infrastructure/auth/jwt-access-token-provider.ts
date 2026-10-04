import { randomUUID } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import type { AuthContext } from '../../modules/auth/domain.js';
import type { AccessTokenProvider, Clock } from '../../modules/auth/ports.js';

export class JwtAccessTokenProvider implements AccessTokenProvider {
  private readonly key: Uint8Array;

  constructor(
    secret: string,
    private readonly ttlSeconds: number,
    private readonly clock: Clock,
  ) {
    this.key = Buffer.from(secret, 'base64url');
  }

  issue(identity: AuthContext): Promise<string> {
    const issuedAt = Math.floor(this.clock.now().getTime() / 1000);
    return new SignJWT({ role: identity.role, tokenUse: 'access' })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuer('campfire-api')
      .setAudience('campfire-mobile')
      .setSubject(identity.userId)
      .setJti(randomUUID())
      .setIssuedAt(issuedAt)
      .setExpirationTime(issuedAt + this.ttlSeconds)
      .sign(this.key);
  }

  async verify(token: string): Promise<AuthContext> {
    try {
      const { payload } = await jwtVerify(token, this.key, {
        algorithms: ['HS256'],
        issuer: 'campfire-api',
        audience: 'campfire-mobile',
        currentDate: this.clock.now(),
      });
      if (
        payload.tokenUse !== 'access' ||
        (payload.role !== 'user' && payload.role !== 'admin') ||
        typeof payload.sub !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
          payload.sub,
        ) ||
        typeof payload.jti !== 'string' ||
        typeof payload.exp !== 'number'
      ) {
        throw new Error('Invalid access token claims');
      }
      return { userId: payload.sub, role: payload.role };
    } catch {
      throw new Error('Invalid access token');
    }
  }
}
