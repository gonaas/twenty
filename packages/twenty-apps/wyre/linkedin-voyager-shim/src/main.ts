import { resolve } from 'node:path';

import { serve } from '@hono/node-server';

import { parseEnv } from 'src/config/env';
import { mapMeToProviderId } from 'src/domain/mappers/map-me-to-provider-id.util';
import { buildAccountStatusPayload } from 'src/domain/webhooks/build-webhook-payloads.util';
import { createApp } from 'src/http/app';
import { VOYAGER_ENDPOINTS } from 'src/linkedin/endpoints';
import { createProfileLookupService } from 'src/linkedin/profile-lookup.service';
import { createSessionManager } from 'src/linkedin/session-manager';
import { createVoyagerClient } from 'src/linkedin/voyager-client';
import { createLogger } from 'src/logger';
import { createPoller } from 'src/poller/poller';
import { createWebhookEmitter } from 'src/poller/webhook-emitter';
import { createStore } from 'src/store/create-store';
import { META_KEYS } from 'src/store/meta.repository';

const main = async () => {
  const env = parseEnv();
  const logger = createLogger(env.LOG_LEVEL);
  const store = createStore(resolve(env.DATA_DIR, 'shim.db'));
  const sessionManager = createSessionManager({ env, sessionRepository: store.session, logger });
  const voyagerClient = createVoyagerClient({ env, sessionManager, logger });
  const webhookEmitter = createWebhookEmitter({
    url: env.WEBHOOK_URL,
    secret: env.WEBHOOK_SECRET,
    logger,
  });
  const profileLookup = createProfileLookupService({
    env,
    voyagerClient,
    lookupsRepository: store.lookups,
    metaRepository: store.meta,
    logger,
  });
  const poller = createPoller({ env, store, voyagerClient, sessionManager, webhookEmitter, logger });

  const resolveOwnProviderId = async (): Promise<void> => {
    const response = await voyagerClient.getOrThrow(VOYAGER_ENDPOINTS.me());
    const ownProviderId = mapMeToProviderId(response);

    if (ownProviderId === null) {
      throw new Error('Could not resolve the own provider id from /voyager/api/me');
    }

    store.meta.set(META_KEYS.ownProviderId, ownProviderId);
    logger.info('Resolved own LinkedIn provider id', { ownProviderId });
  };

  sessionManager.onDeath((reason) => {
    poller.stop();
    void webhookEmitter.emit(buildAccountStatusPayload({ accountId: env.ACCOUNT_ID, message: 'CREDENTIALS' }));
    logger.warn('Poller stopped; rotate the cookie through POST /admin/session', { reason });
  });

  const app = createApp({
    env,
    store,
    profileLookup,
    session: {
      getState: sessionManager.getState,
      getDiedReason: sessionManager.getDiedReason,
      rotate: async (credentials) => {
        const alive = await sessionManager.rotate(credentials);

        if (alive) {
          await resolveOwnProviderId();
        }

        return alive;
      },
    },
    poller,
    voyager: { queueLength: voyagerClient.queueLength, rateLimitedUntil: voyagerClient.rateLimitedUntil },
    logger,
  });

  // Railway private networking is IPv6-only, so bind to every address family.
  const server = serve({ fetch: app.fetch, port: env.PORT, hostname: '::' }, (info) => {
    logger.info('HTTP server listening', { port: info.port });
  });

  const shutdown = async (signal: string) => {
    logger.info('Shutting down', { signal });
    poller.stop();
    server.close();
    await sessionManager.stop();
    store.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  try {
    await sessionManager.start();

    if (sessionManager.getState() === 'ALIVE') {
      await resolveOwnProviderId();
      poller.start();
    }
  } catch (error) {
    logger.error('Session bootstrap failed; serving snapshot only', {
      error: error instanceof Error ? error.stack : String(error),
    });
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
