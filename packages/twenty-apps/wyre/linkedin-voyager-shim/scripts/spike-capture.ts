import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { type Page, type Response, chromium } from 'playwright';

import { parseEnv } from 'src/config/env';
import {
  buildContextOptions,
  buildLaunchOptions,
  buildLinkedinCookies,
  resolveUserAgent,
} from 'src/linkedin/browser-options.util';

const FIXTURES_DIR = resolve('test/fixtures/voyager');
const DOCS_DIR = resolve('docs');
const SETTLE_MS = 4_000;
const SCROLL_STEPS = 4;
const CAPTURED_RESOURCE_TYPES = new Set(['fetch', 'xhr', 'document']);
const IGNORED_HOST_PATTERN = /licdn\.com|ads\.linkedin\.com|linkedin\.com\/li\/track|\/realtime\/|\/sensorCollect|\/platform-telemetry|\/lite\/|\.js$|\.css$/;
const LIST_PANE = { x: 300, y: 500 };
const THREAD_PANE = { x: 780, y: 450 };

type CapturedRequest = {
  index: number;
  page: string;
  method: string;
  resourceType: string;
  url: string;
  status: number;
  file: string | null;
};

const sanitizeForFilename = (url: string): string => {
  const { pathname, searchParams } = new URL(url);
  const queryId = searchParams.get('queryId') ?? searchParams.get('q') ?? '';

  return `${pathname.replace('/voyager/api/', '').replace(/[^a-zA-Z0-9]+/g, '-')}${queryId === '' ? '' : `-${queryId}`}`
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
};

const safeJson = (body: string): unknown => {
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
};

const settle = (page: Page) => page.waitForTimeout(SETTLE_MS);

const wheelAt = async (page: Page, point: { x: number; y: number }, deltaY: number, steps = SCROLL_STEPS) => {
  await page.mouse.move(point.x, point.y);

  for (let step = 0; step < steps; step += 1) {
    await page.mouse.wheel(0, deltaY);
    await page.waitForTimeout(SETTLE_MS / 2);
  }
};

const visit = async (page: Page, label: string, url: string) => {
  console.error(`[spike] ${label}: ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await settle(page);
};

const collectInboxProfileIds = (captured: CapturedRequest[], bodies: Map<number, unknown>): string[] => {
  const byDistance = new Map<string, string>();

  for (const entry of captured) {
    if (!entry.url.includes('messengerConversations')) {
      continue;
    }

    const body = bodies.get(entry.index) as {
      data?: { messengerConversationsBySyncToken?: { elements?: unknown[] } };
    };
    const elements = body?.data?.messengerConversationsBySyncToken?.elements ?? [];

    for (const element of elements as { conversationParticipants?: unknown[] }[]) {
      for (const participant of (element.conversationParticipants ?? []) as {
        hostIdentityUrn?: string;
        participantType?: { member?: { distance?: string } };
      }[]) {
        const distance = participant.participantType?.member?.distance;
        const id = participant.hostIdentityUrn?.split(':').pop();

        if (distance && id && distance !== 'SELF' && !byDistance.has(distance)) {
          byDistance.set(distance, id);
        }
      }
    }
  }

  return [...byDistance.values()];
};

const main = async () => {
  const env = parseEnv({
    ...process.env,
    API_KEY: process.env.API_KEY ?? 'spike-placeholder-api-key',
    ACCOUNT_ID: process.env.ACCOUNT_ID ?? 'spike',
  });

  if (env.LINKEDIN_LI_AT === undefined) {
    console.error('LINKEDIN_LI_AT is required (run yarn session:login first).');
    process.exit(1);
  }

  const explicitSlugs = (process.env.SPIKE_PROFILE_SLUGS ?? '')
    .split(',')
    .map((slug) => slug.trim())
    .filter((slug) => slug !== '');

  mkdirSync(FIXTURES_DIR, { recursive: true });
  mkdirSync(DOCS_DIR, { recursive: true });

  const browser = await chromium.launch(buildLaunchOptions(env, { headless: env.BROWSER_HEADLESS }));
  const userAgent = await resolveUserAgent(browser, env.BROWSER_USER_AGENT);
  const context = await browser.newContext(buildContextOptions(env, { userAgent }));

  await context.addCookies(
    buildLinkedinCookies({ liAt: env.LINKEDIN_LI_AT, jsessionid: env.LINKEDIN_JSESSIONID ?? null }),
  );

  const page = await context.newPage();
  const captured: CapturedRequest[] = [];
  const bodies = new Map<number, unknown>();
  let currentLabel = 'feed';

  const record = async (response: Response) => {
    const request = response.request();
    const url = response.url();

    if (!CAPTURED_RESOURCE_TYPES.has(request.resourceType()) || IGNORED_HOST_PATTERN.test(url)) {
      return;
    }

    const index = captured.length + 1;
    const requestHeaders = Object.fromEntries(
      Object.entries(request.headers()).filter(([name]) => name.toLowerCase() !== 'cookie'),
    );
    let file: string | null = null;

    try {
      const contentType = response.headers()['content-type'] ?? '';
      const body = await response.text();
      const parsed = contentType.includes('json') || url.includes('/voyager/api/') ? safeJson(body) : body.slice(0, 200_000);

      bodies.set(index, parsed);
      file = `${String(index).padStart(3, '0')}-${sanitizeForFilename(url)}.raw.json`;
      writeFileSync(
        resolve(FIXTURES_DIR, file),
        JSON.stringify(
          {
            url,
            method: request.method(),
            resourceType: request.resourceType(),
            status: response.status(),
            requestHeaders,
            postData: request.postData(),
            responseHeaders: response.headers(),
            body: parsed,
          },
          null,
          2,
        ),
      );
    } catch {
      file = null;
    }

    captured.push({
      index,
      page: currentLabel,
      method: request.method(),
      resourceType: request.resourceType(),
      url,
      status: response.status(),
      file,
    });
  };

  page.on('response', (response) => {
    void record(response);
  });

  await visit(page, currentLabel, 'https://www.linkedin.com/feed/');

  if (page.url().includes('/login') || page.url().includes('/checkpoint/')) {
    console.error(`Session is not alive (landed on ${page.url()}).`);
    await browser.close();
    process.exit(1);
  }

  currentLabel = 'connections';
  await visit(page, currentLabel, 'https://www.linkedin.com/mynetwork/invite-connect/connections/');
  await wheelAt(page, { x: 720, y: 600 }, 2_500, 6);

  currentLabel = 'sent-invitations';
  await visit(page, currentLabel, 'https://www.linkedin.com/mynetwork/invitation-manager/sent/');
  await wheelAt(page, { x: 720, y: 600 }, 2_500, 4);

  currentLabel = 'messaging';
  await visit(page, currentLabel, 'https://www.linkedin.com/messaging/');
  await wheelAt(page, LIST_PANE, 3_000, 6);

  const conversationLinks = page.locator('a.msg-conversation-listitem__link');
  const linkCount = await conversationLinks.count();

  for (const position of [1, 2, 3]) {
    currentLabel = `messaging:thread-${position}`;

    if (linkCount > position) {
      await conversationLinks.nth(position).click();
    } else {
      await page.mouse.click(LIST_PANE.x, 180 + position * 90);
    }

    await settle(page);
    await wheelAt(page, THREAD_PANE, -2_500, 5);
  }

  const derivedSlugs = collectInboxProfileIds(captured, bodies);

  for (const slug of [...explicitSlugs, ...derivedSlugs]) {
    currentLabel = `profile:${slug.slice(0, 12)}`;
    await visit(page, currentLabel, `https://www.linkedin.com/in/${slug}/`);
    await wheelAt(page, { x: 720, y: 600 }, 2_000, 3);
  }

  await settle(page);
  await browser.close();

  const date = new Date().toISOString().slice(0, 10);
  const indexLines = [
    `# Capture ${date}`,
    '',
    'Raw bodies live in `test/fixtures/voyager/*.raw.json` (gitignored). Sanitize what you keep.',
    '',
    '| # | Page | Type | Method | Status | URL | File |',
    '|---|---|---|---|---|---|---|',
    ...captured.map(
      (entry) =>
        `| ${entry.index} | ${entry.page} | ${entry.resourceType} | ${entry.method} | ${entry.status} | \`${entry.url}\` | ${entry.file ?? '-'} |`,
    ),
  ];

  writeFileSync(resolve(DOCS_DIR, `spike-capture-${date}.md`), `${indexLines.join('\n')}\n`);
  console.error(`[spike] captured ${captured.length} responses; index at docs/spike-capture-${date}.md`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
