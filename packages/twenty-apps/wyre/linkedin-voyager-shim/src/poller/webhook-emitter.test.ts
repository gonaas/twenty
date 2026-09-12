import { createLogger } from 'src/logger';
import { createWebhookEmitter } from 'src/poller/webhook-emitter';

const logger = createLogger('error');

describe('createWebhookEmitter', () => {
  it('is a no-op when not configured', async () => {
    const emitter = createWebhookEmitter({ url: undefined, secret: undefined, logger });

    expect(emitter.configured).toBe(false);
    await expect(emitter.emit({ account_id: 'a', message: 'x' })).resolves.toBe(false);
  });

  it('posts the payload with the Unipile-Auth header', async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fetchImplementation: typeof fetch = async (url, init) => {
      calls.push({ url: String(url), init: init ?? {} });

      return new Response(null, { status: 200 });
    };
    const emitter = createWebhookEmitter({
      url: 'https://crm.example/webhooks/server/abc',
      secret: 'shared-secret',
      logger,
      fetchImplementation,
    });

    await expect(emitter.emit({ account_id: 'a', message: 'CREDENTIALS' })).resolves.toBe(true);

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe('https://crm.example/webhooks/server/abc');
    expect(new Headers(calls[0]?.init.headers).get('unipile-auth')).toBe('shared-secret');
    expect(JSON.parse(String(calls[0]?.init.body))).toEqual({ account_id: 'a', message: 'CREDENTIALS' });
  });
});
