import { z } from 'zod';
import type {
  TextModerationGateway,
  TextModerationResult,
} from '../../modules/moderation/port.js';

const responseSchema = z.strictObject({
  status: z.enum(['safe', 'review', 'block']),
  category: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export type ModerationGatewayFailure =
  'TIMEOUT' | 'UNAVAILABLE' | 'INVALID_RESPONSE';

export class ModerationGatewayError extends Error {
  constructor(public readonly reason: ModerationGatewayFailure) {
    super('Text moderation service unavailable');
    this.name = 'ModerationGatewayError';
  }
}

export class FastApiTextModerationGateway implements TextModerationGateway {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs: number,
    private readonly http: typeof fetch = fetch,
  ) {}

  async moderateText(text: string): Promise<TextModerationResult> {
    const signal = AbortSignal.timeout(this.timeoutMs);
    let response: Response;
    try {
      response = await this.http(new URL('/moderate/text', this.baseUrl), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text }),
        signal,
      });
    } catch {
      throw new ModerationGatewayError(
        signal.aborted ? 'TIMEOUT' : 'UNAVAILABLE',
      );
    }
    if (!response.ok) throw new ModerationGatewayError('UNAVAILABLE');
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new ModerationGatewayError(
        signal.aborted ? 'TIMEOUT' : 'INVALID_RESPONSE',
      );
    }
    const parsed = responseSchema.safeParse(body);
    if (!parsed.success) throw new ModerationGatewayError('INVALID_RESPONSE');
    return {
      moderationStatus: parsed.data.status,
      moderationCategory: parsed.data.category,
      confidence: parsed.data.confidence,
    };
  }
}
