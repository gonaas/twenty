import { type Browser, type BrowserContextOptions, type LaunchOptions } from 'playwright';

import { type Env } from 'src/config/env';

export const buildLaunchOptions = (env: Env, { headless }: { headless: boolean }): LaunchOptions => ({
  headless,
  // The full Chromium in new headless mode is closer to a real Chrome than the
  // headless shell; Chromium advertises automation unless told not to.
  channel: 'chromium',
  args: ['--disable-blink-features=AutomationControlled'],
  ...(env.PROXY_SERVER === undefined
    ? {}
    : {
        proxy: {
          server: env.PROXY_SERVER,
          username: env.PROXY_USERNAME,
          password: env.PROXY_PASSWORD,
        },
      }),
});

// Headless Chromium reports "HeadlessChrome" in its user agent; keeping the
// browser's own version and platform while dropping that marker is the only
// override that stays consistent with the rest of the fingerprint.
export const resolveUserAgent = async (browser: Browser, override: string | undefined): Promise<string> => {
  if (override !== undefined) {
    return override;
  }

  const probeContext = await browser.newContext();

  try {
    const probePage = await probeContext.newPage();
    const userAgent = await probePage.evaluate(() => navigator.userAgent);

    return userAgent.replace('HeadlessChrome', 'Chrome');
  } finally {
    await probeContext.close();
  }
};

export const buildContextOptions = (env: Env, { userAgent }: { userAgent: string }): BrowserContextOptions => ({
  locale: env.BROWSER_LOCALE,
  timezoneId: env.BROWSER_TIMEZONE,
  userAgent,
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});

export const buildLinkedinCookies = ({
  liAt,
  jsessionid,
}: {
  liAt: string;
  jsessionid: string | null;
}) => [
  {
    name: 'li_at',
    value: liAt,
    domain: '.www.linkedin.com',
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'None' as const,
  },
  ...(jsessionid === null
    ? []
    : [
        {
          name: 'JSESSIONID',
          value: `"${jsessionid.replace(/^"|"$/g, '')}"`,
          domain: '.www.linkedin.com',
          path: '/',
          httpOnly: false,
          secure: true,
          sameSite: 'None' as const,
        },
      ]),
];
