import { describe, expect, it, vi } from 'vitest';
import {
  FastApiTextModerationGateway,
  ModerationGatewayError,
} from '../src/infrastructure/ai/fastapi-text-moderation-gateway.js';

describe('FastAPI text moderation gateway', () => {
  it('maps the current bare FastAPI response and sends its exact request shape', async () => {
    const http = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({
        status: 'review',
        category: 'toxic',
        confidence: 0.67,
      }),
    );
    const gateway = new FastApiTextModerationGateway(
      'http://127.0.0.1:8000',
      500,
      http,
    );
    await expect(gateway.moderateText('A test post')).resolves.toEqual({
      moderationStatus: 'review',
      moderationCategory: 'toxic',
      confidence: 0.67,
    });
    expect(http).toHaveBeenCalledTimes(1);
    const [url, init] = http.mock.calls[0] ?? [];
    expect(url).toBeInstanceOf(URL);
    expect((url as URL).href).toBe('http://127.0.0.1:8000/moderate/text');
    expect(init?.method).toBe('POST');
    expect(init?.headers).toEqual({ 'content-type': 'application/json' });
    expect(init?.body).toBe(JSON.stringify({ text: 'A test post' }));
  });

  it('translates non-success, malformed, and unexpected responses without leaking upstream bodies', async () => {
    for (const [response, reason] of [
      [
        new Response('internal private details', { status: 500 }),
        'UNAVAILABLE',
      ],
      [new Response('not JSON', { status: 200 }), 'INVALID_RESPONSE'],
      [
        Response.json({ status: 'unknown', category: 'x', confidence: 0.5 }),
        'INVALID_RESPONSE',
      ],
      [
        Response.json({ status: 'safe', category: 'x', confidence: 2 }),
        'INVALID_RESPONSE',
      ],
    ] as const) {
      const http = vi.fn<typeof fetch>().mockResolvedValue(response);
      const gateway = new FastApiTextModerationGateway(
        'http://127.0.0.1:8000',
        500,
        http,
      );
      await expect(gateway.moderateText('hello')).rejects.toMatchObject({
        reason,
      });
    }
  });

  it('distinguishes a bounded timeout from a network failure', async () => {
    const timedOutFetch = vi.fn<typeof fetch>().mockImplementation(
      (_url, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener(
            'abort',
            () => reject(new Error('aborted')),
            { once: true },
          );
        }),
    );
    const gateway = new FastApiTextModerationGateway(
      'http://127.0.0.1:8000',
      100,
      timedOutFetch,
    );
    await expect(gateway.moderateText('hello')).rejects.toMatchObject({
      reason: 'TIMEOUT',
    });

    const slowBody = Response.json({
      status: 'safe',
      category: 'x',
      confidence: 0.5,
    });
    const bodyFetch = vi.fn<typeof fetch>().mockImplementation((_url, init) => {
      vi.spyOn(slowBody, 'json').mockImplementation(
        () =>
          new Promise<unknown>((_resolve, reject) => {
            init?.signal?.addEventListener(
              'abort',
              () => reject(new Error('aborted')),
              { once: true },
            );
          }),
      );
      return Promise.resolve(slowBody);
    });
    const bodyGateway = new FastApiTextModerationGateway(
      'http://127.0.0.1:8000',
      100,
      bodyFetch,
    );
    await expect(bodyGateway.moderateText('hello')).rejects.toMatchObject({
      reason: 'TIMEOUT',
    });

    const failedFetch = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new Error('private network details'));
    const failedGateway = new FastApiTextModerationGateway(
      'http://127.0.0.1:8000',
      500,
      failedFetch,
    );
    await expect(failedGateway.moderateText('hello')).rejects.toMatchObject({
      reason: 'UNAVAILABLE',
    });
    try {
      await failedGateway.moderateText('hello');
    } catch (error) {
      expect(error).toBeInstanceOf(ModerationGatewayError);
      expect(String(error)).not.toContain('private network details');
    }
  });
});
