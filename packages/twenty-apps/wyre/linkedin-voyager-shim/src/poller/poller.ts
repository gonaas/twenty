import { type Env } from 'src/config/env';
import { RateLimitedError, SessionNotAliveError } from 'src/linkedin/errors';
import { type SessionManager } from 'src/linkedin/session-manager';
import { type VoyagerClient } from 'src/linkedin/voyager-client';
import { type Logger } from 'src/logger';
import { type RefreshSummary, refreshSnapshot } from 'src/poller/refresh-snapshot';
import { type WebhookEmitter } from 'src/poller/webhook-emitter';
import { type Store } from 'src/store/create-store';

export type Poller = {
  start: () => void;
  stop: () => void;
  triggerNow: () => Promise<RefreshSummary | null>;
  isRunning: () => boolean;
};

export const createPoller = ({
  env,
  store,
  voyagerClient,
  sessionManager,
  webhookEmitter,
  logger,
}: {
  env: Env;
  store: Store;
  voyagerClient: VoyagerClient;
  sessionManager: SessionManager;
  webhookEmitter: WebhookEmitter;
  logger: Logger;
}): Poller => {
  let timer: NodeJS.Timeout | null = null;
  let keepAliveTimer: NodeJS.Timeout | null = null;
  let stopped = true;
  let inFlight: Promise<RefreshSummary | null> | null = null;

  const nextDelayMs = () =>
    (env.POLL_INTERVAL_MINUTES + Math.random() * env.POLL_JITTER_MINUTES) * 60_000;

  const runOnce = async (): Promise<RefreshSummary | null> => {
    if (sessionManager.getState() !== 'ALIVE') {
      logger.warn('Skipping refresh: session not alive', { state: sessionManager.getState() });

      return null;
    }

    try {
      return await refreshSnapshot({ env, store, voyagerClient, webhookEmitter, logger });
    } catch (error) {
      if (error instanceof RateLimitedError) {
        logger.warn('Refresh aborted by rate limit', { retryAt: error.retryAt.toISOString() });
      } else if (error instanceof SessionNotAliveError) {
        logger.warn('Refresh aborted: session died mid-run');
      } else {
        logger.error('Refresh failed', { error: error instanceof Error ? error.stack : String(error) });
      }

      return null;
    }
  };

  const triggerNow = (): Promise<RefreshSummary | null> => {
    if (inFlight === null) {
      inFlight = runOnce().finally(() => {
        inFlight = null;
      });
    }

    return inFlight;
  };

  const schedule = () => {
    if (stopped) {
      return;
    }

    timer = setTimeout(async () => {
      await triggerNow();
      schedule();
    }, nextDelayMs());
  };

  return {
    start: () => {
      if (!stopped) {
        return;
      }

      stopped = false;
      void triggerNow().then(schedule);
      keepAliveTimer = setInterval(() => {
        void sessionManager.keepAlive();
      }, env.KEEPALIVE_MINUTES * 60_000);
    },
    stop: () => {
      stopped = true;

      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }

      if (keepAliveTimer !== null) {
        clearInterval(keepAliveTimer);
        keepAliveTimer = null;
      }
    },
    triggerNow,
    isRunning: () => !stopped,
  };
};
