import { type UnipileWebhookEventPayload } from 'src/domain/unipile/unipile-webhook-event.type';
import { type Logger } from 'src/logger';

const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 2_000;

export type WebhookEmitter = {
  configured: boolean;
  emit: (payload: UnipileWebhookEventPayload) => Promise<boolean>;
};

const sleep = (milliseconds: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });

export const createWebhookEmitter = ({
  url,
  secret,
  logger,
  fetchImplementation = fetch,
}: {
  url: string | undefined;
  secret: string | undefined;
  logger: Logger;
  fetchImplementation?: typeof fetch;
}): WebhookEmitter => {
  if (url === undefined || secret === undefined) {
    return {
      configured: false,
      emit: async () => false,
    };
  }

  return {
    configured: true,
    emit: async (payload) => {
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
        try {
          const response = await fetchImplementation(url, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'unipile-auth': secret,
            },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            return true;
          }

          logger.warn('Webhook delivery rejected', {
            attempt,
            status: response.status,
            event: 'event' in payload ? payload.event : 'account_status',
          });
        } catch (error) {
          logger.warn('Webhook delivery failed', { attempt, error: String(error) });
        }

        if (attempt < MAX_ATTEMPTS) {
          await sleep(BASE_BACKOFF_MS * 2 ** (attempt - 1));
        }
      }

      logger.error('Webhook dropped after retries', {
        event: 'event' in payload ? payload.event : 'account_status',
      });

      return false;
    },
  };
};
