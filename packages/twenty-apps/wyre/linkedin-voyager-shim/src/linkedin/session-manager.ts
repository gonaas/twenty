import { type Browser, type BrowserContext, type Page, chromium } from 'playwright';

import { type Env } from 'src/config/env';
import {
  buildContextOptions,
  buildLaunchOptions,
  buildLinkedinCookies,
  resolveUserAgent,
} from 'src/linkedin/browser-options.util';
import { VOYAGER_REFERERS } from 'src/linkedin/endpoints';
import { type SessionDeathReason, detectSessionDeath } from 'src/linkedin/session-death.util';
import { type Logger } from 'src/logger';
import { type SessionRepository, type SessionState } from 'src/store/session.repository';

const FEED_NAVIGATION_TIMEOUT_MS = 60_000;

export type SessionCredentials = { liAt: string; jsessionid: string | null };

export type SessionManager = {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  rotate: (credentials: SessionCredentials) => Promise<boolean>;
  verifyAlive: () => Promise<boolean>;
  keepAlive: () => Promise<void>;
  markDead: (reason: SessionDeathReason) => void;
  getState: () => SessionState;
  getDiedReason: () => string | null;
  getPage: () => Page;
  getCsrfToken: () => string;
  onDeath: (listener: (reason: SessionDeathReason) => void) => void;
};

export const createSessionManager = ({
  env,
  sessionRepository,
  logger,
}: {
  env: Env;
  sessionRepository: SessionRepository;
  logger: Logger;
}): SessionManager => {
  let browser: Browser | null = null;
  let userAgent: string | null = null;
  let context: BrowserContext | null = null;
  let page: Page | null = null;
  let state: SessionState = 'STARTING';
  let diedReason: string | null = null;
  let csrfToken = '';
  let credentials: SessionCredentials | null = null;
  const deathListeners: ((reason: SessionDeathReason) => void)[] = [];

  const persist = () => {
    sessionRepository.save({
      liAt: credentials?.liAt ?? null,
      jsessionid: credentials?.jsessionid ?? null,
      state,
      lastAliveAt: state === 'ALIVE' ? new Date().toISOString() : (sessionRepository.find()?.lastAliveAt ?? null),
      diedReason,
    });
  };

  const markDead = (reason: SessionDeathReason) => {
    if (state === 'DEAD') {
      return;
    }

    state = 'DEAD';
    diedReason = reason;
    persist();
    logger.error('LinkedIn session died', { reason });

    for (const listener of deathListeners) {
      listener(reason);
    }
  };

  const resolveCredentials = (): SessionCredentials | null => {
    const stored = sessionRepository.find();

    if (stored?.liAt) {
      return { liAt: stored.liAt, jsessionid: stored.jsessionid };
    }

    if (env.LINKEDIN_LI_AT !== undefined) {
      return { liAt: env.LINKEDIN_LI_AT, jsessionid: env.LINKEDIN_JSESSIONID ?? null };
    }

    return null;
  };

  const readCsrfToken = async (): Promise<string | null> => {
    if (context === null) {
      return null;
    }

    const cookies = await context.cookies('https://www.linkedin.com');
    const jsessionid = cookies.find((cookie) => cookie.name === 'JSESSIONID')?.value;

    return jsessionid === undefined ? null : jsessionid.replace(/^"|"$/g, '');
  };

  const ensureBrowser = async (): Promise<Page> => {
    if (browser === null) {
      browser = await chromium.launch(buildLaunchOptions(env, { headless: env.BROWSER_HEADLESS }));
      userAgent = await resolveUserAgent(browser, env.BROWSER_USER_AGENT);
      logger.info('Browser launched', { version: browser.version(), userAgent });
    }

    if (context === null) {
      context = await browser.newContext(buildContextOptions(env, { userAgent: userAgent ?? '' }));
      page = await context.newPage();

      page.on('response', (response) => {
        const setCookie = response.headers()['set-cookie'] ?? null;
        const reason = detectSessionDeath({ setCookieHeader: setCookie });

        if (reason !== null) {
          markDead(reason);
        }
      });
    }

    if (page === null) {
      throw new Error('Browser page was not created');
    }

    return page;
  };

  const resetContext = async () => {
    if (context !== null) {
      await context.close().catch(() => undefined);
      context = null;
      page = null;
    }
  };

  const openFeedAndCheck = async (): Promise<boolean> => {
    const currentPage = await ensureBrowser();
    const response = await currentPage.goto(VOYAGER_REFERERS.feed, {
      waitUntil: 'domcontentloaded',
      timeout: FEED_NAVIGATION_TIMEOUT_MS,
    });
    const reason = detectSessionDeath({
      url: currentPage.url(),
      status: response?.status() ?? null,
    });

    if (reason !== null) {
      markDead(reason);

      return false;
    }

    const token = await readCsrfToken();

    if (token === null) {
      markDead('UNAUTHORIZED');

      return false;
    }

    csrfToken = token;
    state = 'ALIVE';
    diedReason = null;
    persist();

    return true;
  };

  const applyCredentials = async (nextCredentials: SessionCredentials): Promise<boolean> => {
    await resetContext();
    credentials = nextCredentials;
    state = 'STARTING';
    diedReason = null;

    const currentPage = await ensureBrowser();

    await currentPage.context().addCookies(buildLinkedinCookies(nextCredentials));

    const alive = await openFeedAndCheck();

    if (alive) {
      logger.info('LinkedIn session is alive');
    }

    return alive;
  };

  return {
    start: async () => {
      const initialCredentials = resolveCredentials();

      if (initialCredentials === null) {
        state = 'DEAD';
        diedReason = 'NO_COOKIE';
        persist();
        logger.warn('No LinkedIn cookie configured; waiting for POST /admin/session');

        return;
      }

      await applyCredentials(initialCredentials);
    },
    stop: async () => {
      await resetContext();

      if (browser !== null) {
        await browser.close().catch(() => undefined);
        browser = null;
      }
    },
    rotate: async (nextCredentials) => applyCredentials(nextCredentials),
    verifyAlive: async () => {
      if (state !== 'ALIVE') {
        return false;
      }

      try {
        return await openFeedAndCheck();
      } catch (error) {
        logger.warn('Liveness navigation failed', { error: String(error) });

        return state === 'ALIVE';
      }
    },
    keepAlive: async () => {
      if (state !== 'ALIVE') {
        return;
      }

      try {
        await openFeedAndCheck();
      } catch (error) {
        logger.warn('Keep-alive navigation failed', { error: String(error) });
      }
    },
    markDead,
    getState: () => state,
    getDiedReason: () => diedReason,
    getPage: () => {
      if (page === null) {
        throw new Error('Browser page is not available');
      }

      return page;
    },
    getCsrfToken: () => csrfToken,
    onDeath: (listener) => {
      deathListeners.push(listener);
    },
  };
};
