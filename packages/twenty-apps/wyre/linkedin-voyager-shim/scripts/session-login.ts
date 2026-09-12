import { chromium } from 'playwright';

import { parseEnv } from 'src/config/env';
import { buildContextOptions, buildLaunchOptions, resolveUserAgent } from 'src/linkedin/browser-options.util';

const LOGIN_URL = 'https://www.linkedin.com/login';
const FEED_URL_PREFIX = 'https://www.linkedin.com/feed';
const LOGIN_TIMEOUT_MS = 10 * 60 * 1000;
const POLL_INTERVAL_MS = 1_000;

// Minting the cookie through the same proxy the shim uses means the session
// is born on the IP it will live on, which is the strongest signal we can give
// LinkedIn that the cookie is not being replayed from somewhere else.
const main = async () => {
  const env = parseEnv({
    ...process.env,
    API_KEY: process.env.API_KEY ?? 'session-login-placeholder-key',
    ACCOUNT_ID: process.env.ACCOUNT_ID ?? 'session-login',
  });
  const browser = await chromium.launch(buildLaunchOptions(env, { headless: false }));
  const userAgent = await resolveUserAgent(browser, env.BROWSER_USER_AGENT);
  const context = await browser.newContext(buildContextOptions(env, { userAgent }));
  const page = await context.newPage();

  console.error(`Opening ${LOGIN_URL}; log in manually (2FA and challenges included).`);
  await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded' });

  const deadline = Date.now() + LOGIN_TIMEOUT_MS;

  while (Date.now() < deadline) {
    if (page.url().startsWith(FEED_URL_PREFIX)) {
      break;
    }

    await page.waitForTimeout(POLL_INTERVAL_MS);
  }

  if (!page.url().startsWith(FEED_URL_PREFIX)) {
    console.error('Timed out waiting for the feed; no cookie exported.');
    await browser.close();
    process.exit(1);
  }

  const cookies = await context.cookies('https://www.linkedin.com');
  const liAt = cookies.find((cookie) => cookie.name === 'li_at')?.value;
  const jsessionid = cookies.find((cookie) => cookie.name === 'JSESSIONID')?.value.replace(/^"|"$/g, '');

  await browser.close();

  if (liAt === undefined) {
    console.error('Logged in but li_at was not found in the cookie jar.');
    process.exit(1);
  }

  console.log(`LINKEDIN_LI_AT=${liAt}`);

  if (jsessionid !== undefined) {
    console.log(`LINKEDIN_JSESSIONID=${jsessionid}`);
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
