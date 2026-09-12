import { randomUUID } from 'node:crypto';

import { type Env } from 'src/config/env';
import { RateLimitedError, SessionNotAliveError, VoyagerRequestError } from 'src/linkedin/errors';
import { VOYAGER_ACCEPT } from 'src/linkedin/endpoints';
import { detectSessionDeath } from 'src/linkedin/session-death.util';
import { type SessionManager } from 'src/linkedin/session-manager';
import { type VoyagerNormalizedResponse } from 'src/linkedin/types/voyager-response.type';
import { type Logger } from 'src/logger';

const RATE_LIMIT_STATUSES = new Set([429, 999]);

export type VoyagerRequestOptions = {
  referer?: string;
  pageInstancePrefix?: string;
  accept?: string;
};

export type VoyagerResult = {
  status: number;
  json: unknown;
};

export type VoyagerClient = {
  get: (path: string, options?: VoyagerRequestOptions) => Promise<VoyagerResult>;
  getOrThrow: <TResponse = VoyagerNormalizedResponse>(
    path: string,
    options?: VoyagerRequestOptions,
  ) => Promise<TResponse>;
  queueLength: () => number;
  rateLimitedUntil: () => Date | null;
};

type InPageFetchResult = { status: number; body: string };

const buildTrackingHeader = (env: Env): string =>
  JSON.stringify({
    clientVersion: '1.13.40000',
    mpVersion: '1.13.40000',
    osName: 'web',
    timezoneOffset: 2,
    timezone: env.BROWSER_TIMEZONE,
    deviceFormFactor: 'DESKTOP',
    mpName: 'voyager-web',
    displayDensity: 2,
    displayWidth: 2880,
    displayHeight: 1800,
  });

const sleep = (milliseconds: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });

export const createVoyagerClient = ({
  env,
  sessionManager,
  logger,
}: {
  env: Env;
  sessionManager: SessionManager;
  logger: Logger;
}): VoyagerClient => {
  const trackingHeader = buildTrackingHeader(env);
  let queueTail: Promise<unknown> = Promise.resolve();
  let pendingCount = 0;
  let lastRequestAt = 0;
  let rateLimitedUntil: Date | null = null;

  const executeInPage = async (
    path: string,
    options: VoyagerRequestOptions,
  ): Promise<VoyagerResult> => {
    if (sessionManager.getState() !== 'ALIVE') {
      throw new SessionNotAliveError(sessionManager.getState());
    }

    if (rateLimitedUntil !== null && rateLimitedUntil.getTime() > Date.now()) {
      throw new RateLimitedError(429, rateLimitedUntil);
    }

    const waitFor =
      lastRequestAt + env.MIN_REQUEST_INTERVAL_MS + Math.random() * env.REQUEST_JITTER_MS - Date.now();

    if (waitFor > 0) {
      await sleep(waitFor);
    }

    lastRequestAt = Date.now();

    const headers: Record<string, string> = {
      accept: options.accept ?? VOYAGER_ACCEPT.normalized,
      'csrf-token': sessionManager.getCsrfToken(),
      'x-restli-protocol-version': '2.0.0',
      'x-li-lang': env.BROWSER_LOCALE.replace('-', '_'),
      'x-li-track': trackingHeader,
      'x-li-page-instance': `urn:li:page:${options.pageInstancePrefix ?? 'd_flagship3_feed'};${randomUUID()}`,
    };

    const page = sessionManager.getPage();
    const result = await page.evaluate<InPageFetchResult, { path: string; headers: Record<string, string> }>(
      async ({ path: requestPath, headers: requestHeaders }) => {
        const response = await fetch(requestPath, {
          method: 'GET',
          credentials: 'include',
          headers: requestHeaders,
        });

        return { status: response.status, body: await response.text() };
      },
      { path, headers },
    );

    logger.debug('Voyager request', { path, status: result.status });

    // A 401/403 can be resource-level (a profile that refuses lookups) rather
    // than a dead session, so the feed decides before anything is torn down.
    if (detectSessionDeath({ status: result.status }) !== null) {
      const stillAlive = await sessionManager.verifyAlive();

      if (!stillAlive) {
        throw new SessionNotAliveError('DEAD');
      }

      logger.warn('Voyager refused a resource while the session is alive', { path, status: result.status });
    }

    if (RATE_LIMIT_STATUSES.has(result.status)) {
      rateLimitedUntil = new Date(Date.now() + env.RATE_LIMIT_BACKOFF_MINUTES * 60_000);
      logger.warn('LinkedIn rate limited the session', { status: result.status, until: rateLimitedUntil });
      throw new RateLimitedError(result.status, rateLimitedUntil);
    }

    let json: unknown = null;

    try {
      json = result.body === '' ? null : JSON.parse(result.body);
    } catch {
      json = null;
    }

    return { status: result.status, json };
  };

  const enqueue = <TResult>(work: () => Promise<TResult>): Promise<TResult> => {
    pendingCount += 1;

    const run = queueTail.then(work, work).finally(() => {
      pendingCount -= 1;
    });

    queueTail = run.catch(() => undefined);

    return run;
  };

  const get = (path: string, options: VoyagerRequestOptions = {}) =>
    enqueue(() => executeInPage(path, options));

  return {
    get,
    getOrThrow: async <TResponse,>(path: string, options: VoyagerRequestOptions = {}) => {
      const result = await get(path, options);

      if (result.status < 200 || result.status >= 300 || result.json === null) {
        throw new VoyagerRequestError(path, result.status, result.json);
      }

      return result.json as TResponse;
    },
    queueLength: () => pendingCount,
    rateLimitedUntil: () => rateLimitedUntil,
  };
};
