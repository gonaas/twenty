import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { type Page, chromium } from 'playwright';

import { parseEnv } from 'src/config/env';
import { mapConversationsToChats } from 'src/domain/mappers/map-conversations-to-chats.util';
import { mapMeToProviderId } from 'src/domain/mappers/map-me-to-provider-id.util';
import { buildConversationUrn } from 'src/domain/messenger-urn.util';
import {
  buildContextOptions,
  buildLaunchOptions,
  buildLinkedinCookies,
  resolveUserAgent,
} from 'src/linkedin/browser-options.util';
import { VOYAGER_ACCEPT, VOYAGER_BASE_PATH, VOYAGER_ENDPOINTS } from 'src/linkedin/endpoints';
import { type RestliVariableValue, buildGraphqlVariables, restliList } from 'src/linkedin/restli.util';
import { type MessengerConversationsResponse } from 'src/linkedin/types/messenger.type';
import { type VoyagerNormalizedResponse } from 'src/linkedin/types/voyager-response.type';

const FIXTURES_DIR = resolve('test/fixtures/voyager');
const DOCS_DIR = resolve('docs');
const PROBE_SPACING_MS = 4_000;

// Query ids declared by the messaging bundles on 2026-09-12; the variable each
// one requires was read from the GraphQL validation errors of the previous probe.
const CONVERSATIONS_BY_CATEGORY_IDS = [
  'messengerConversations.0e6384758dbe98769dd964f463fcdbeb',
  'messengerConversations.db23ac94a546670956b37f89cf64a070',
];
const CONVERSATIONS_BY_CATEGORIES_ID = 'messengerConversations.33c5bfbf15b112da638fee15f77f5e33';
const CONVERSATIONS_BY_RECIPIENTS_IDS = [
  'messengerConversations.395d9022591a61de801254af1334a059',
  'messengerConversations.9c3ab648b616451570c715e4a184465e',
];
const MESSAGES_BY_CONVERSATION_ID = 'messengerMessages.1561582483b8a511147478d8c099b03d';
const MESSAGES_BY_ANCHOR_ID = 'messengerMessages.d8ea76885a52fd5dc5c317078ab7c977';

type Probe = { name: string; path: string; accept?: string };
type ProbeResult = { name: string; status: number; summary: string; path: string; file: string };
type InPageFetchResult = { status: number; body: string };
type Collection = { elements: Record<string, unknown>[]; metadata?: Record<string, unknown> };

const collectionOf = (body: unknown): Collection | null => {
  const data = (body as { data?: Record<string, unknown> } | null)?.data ?? null;

  if (data === null || typeof data !== 'object') {
    return null;
  }

  return (
    Object.values(data).find(
      (value): value is Collection =>
        typeof value === 'object' && value !== null && Array.isArray((value as { elements?: unknown }).elements),
    ) ?? null
  );
};

const describeBody = (body: unknown): string => {
  const errors = (body as { errors?: { message?: string }[] } | null)?.errors;

  if (Array.isArray(errors) && errors.length > 0) {
    return `error=${errors.map((error) => error.message ?? '').join(' | ').slice(0, 160)}`;
  }

  const collection = collectionOf(body);

  if (collection === null) {
    return typeof body === 'object' && body !== null ? `keys=${Object.keys(body).join(',')}` : String(body);
  }

  const timestamps = collection.elements
    .map((element) => element.deliveredAt ?? element.lastActivityAt)
    .filter((value): value is number => typeof value === 'number');

  return `elements=${collection.elements.length} newest=${Math.max(...timestamps, 0)} oldest=${Math.min(...timestamps, Number.MAX_SAFE_INTEGER)} cursors=${JSON.stringify({
    next: collection.metadata?.nextCursor !== undefined,
    prev: collection.metadata?.prevCursor !== undefined,
    syncToken: collection.metadata?.newSyncToken !== undefined,
  })}`;
};

const safeJson = (body: string): unknown => {
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
};

const oldestTimestamp = (collection: Collection | null, key: 'deliveredAt' | 'lastActivityAt'): number | undefined =>
  collection?.elements
    .map((element) => element[key])
    .filter((value): value is number => typeof value === 'number')
    .sort((left, right) => left - right)[0];

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

  mkdirSync(FIXTURES_DIR, { recursive: true });
  mkdirSync(DOCS_DIR, { recursive: true });

  const browser = await chromium.launch(buildLaunchOptions(env, { headless: env.BROWSER_HEADLESS }));
  const userAgent = await resolveUserAgent(browser, env.BROWSER_USER_AGENT);
  const context = await browser.newContext(buildContextOptions(env, { userAgent }));

  await context.addCookies(
    buildLinkedinCookies({ liAt: env.LINKEDIN_LI_AT, jsessionid: env.LINKEDIN_JSESSIONID ?? null }),
  );

  const page: Page = await context.newPage();

  await page.goto('https://www.linkedin.com/messaging/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(PROBE_SPACING_MS * 2);

  if (page.url().includes('/login') || page.url().includes('/checkpoint/')) {
    console.error(`Session is not alive (landed on ${page.url()}).`);
    await browser.close();
    process.exit(1);
  }

  const cookies = await context.cookies('https://www.linkedin.com');
  const csrfToken = (cookies.find((cookie) => cookie.name === 'JSESSIONID')?.value ?? '').replace(/^"|"$/g, '');

  const fetchInPage = (path: string, accept: string): Promise<InPageFetchResult> =>
    page.evaluate<InPageFetchResult, { path: string; headers: Record<string, string> }>(
      async ({ path: requestPath, headers }) => {
        const response = await fetch(requestPath, { method: 'GET', credentials: 'include', headers });

        return { status: response.status, body: await response.text() };
      },
      {
        path,
        headers: {
          accept,
          'csrf-token': csrfToken,
          'x-restli-protocol-version': '2.0.0',
          'x-li-lang': 'es_ES',
          'x-li-track':
            '{"clientVersion":"1.13.40000","mpVersion":"1.13.40000","osName":"web","timezoneOffset":2,"timezone":"Europe/Madrid","deviceFormFactor":"DESKTOP","mpName":"voyager-web","displayDensity":2,"displayWidth":2880,"displayHeight":1800}',
          'x-li-page-instance': `urn:li:page:d_flagship3_messaging;${crypto.randomUUID()}`,
        },
      },
    );

  const results: ProbeResult[] = [];
  let probeIndex = 0;

  const runProbe = async ({ name, path, accept = VOYAGER_ACCEPT.graphql }: Probe): Promise<unknown> => {
    probeIndex += 1;
    await page.waitForTimeout(PROBE_SPACING_MS);

    const result = await fetchInPage(path, accept);
    const body = safeJson(result.body);
    const file = `probe3-${String(probeIndex).padStart(2, '0')}-${name}.raw.json`;

    writeFileSync(resolve(FIXTURES_DIR, file), JSON.stringify({ name, path, accept, status: result.status, body }, null, 2));
    results.push({ name, status: result.status, summary: describeBody(body), path, file });
    console.error(`[probe] ${name}: ${result.status} ${describeBody(body)}`);

    return body;
  };

  const graphqlPath = (queryId: string, variables: Record<string, RestliVariableValue>) =>
    `${VOYAGER_BASE_PATH}/voyagerMessagingGraphQL/graphql?queryId=${queryId}&variables=${buildGraphqlVariables(variables)}`;

  const me = (await runProbe({
    name: 'me',
    path: VOYAGER_ENDPOINTS.me(),
    accept: VOYAGER_ACCEPT.normalized,
  })) as VoyagerNormalizedResponse;
  const ownProviderId = mapMeToProviderId(me) ?? '';
  const mailboxUrn = `urn:li:fsd_profile:${ownProviderId}`;
  const conversations = (await runProbe({
    name: 'conversations-default',
    path: VOYAGER_ENDPOINTS.conversationsRecent({ ownProviderId }),
  })) as MessengerConversationsResponse;
  const chats = mapConversationsToChats({ response: conversations, ownProviderId });
  const oneToOneChats = chats.filter((chat) => !chat.isGroup && chat.attendees.length === 1).slice(0, 3);
  const oldestListed = oldestTimestamp(collectionOf(conversations), 'lastActivityAt') ?? Date.now();

  for (const queryId of CONVERSATIONS_BY_CATEGORY_IDS) {
    const shortHash = queryId.slice(-6);
    const firstPage = await runProbe({
      name: `category-${shortHash}-inbox`,
      path: graphqlPath(queryId, { mailboxUrn, category: 'INBOX' }),
    });
    const before = oldestTimestamp(collectionOf(firstPage), 'lastActivityAt') ?? oldestListed;

    await runProbe({
      name: `category-${shortHash}-inbox-before`,
      path: graphqlPath(queryId, { mailboxUrn, category: 'INBOX', lastUpdatedBefore: before, count: 20 }),
    });
    await runProbe({
      name: `category-${shortHash}-primary-before`,
      path: graphqlPath(queryId, { mailboxUrn, category: 'PRIMARY_INBOX', lastUpdatedBefore: before, count: 20 }),
    });
  }

  await runProbe({
    name: 'categories-7f5e33-inbox-before',
    path: graphqlPath(CONVERSATIONS_BY_CATEGORIES_ID, {
      mailboxUrn,
      categories: restliList(['INBOX']),
      lastUpdatedBefore: oldestListed,
      count: 20,
    }),
  });

  const firstAttendee = oneToOneChats[0]?.attendees[0]?.providerId;

  if (firstAttendee !== undefined) {
    for (const queryId of CONVERSATIONS_BY_RECIPIENTS_IDS) {
      await runProbe({
        name: `recipients-${queryId.slice(-6)}`,
        path: graphqlPath(queryId, { mailboxUrn, recipients: restliList([`urn:li:fsd_profile:${firstAttendee}`]) }),
      });
    }
  }

  for (const chat of oneToOneChats) {
    const conversationUrn = buildConversationUrn({ ownProviderId, chatId: chat.id });
    const shortId = chat.id.slice(2, 8);
    const page1 = await runProbe({
      name: `messages-${shortId}-page1`,
      path: graphqlPath(MESSAGES_BY_CONVERSATION_ID, { conversationUrn, deliveredAt: Date.now(), count: 20 }),
    });
    const page1Collection = collectionOf(page1);
    const oldestDelivered = oldestTimestamp(page1Collection, 'deliveredAt');

    if ((page1Collection?.elements.length ?? 0) >= 20 && oldestDelivered !== undefined) {
      await runProbe({
        name: `messages-${shortId}-page2`,
        path: graphqlPath(MESSAGES_BY_CONVERSATION_ID, { conversationUrn, deliveredAt: oldestDelivered - 1, count: 20 }),
      });
    }

    await runProbe({
      name: `messages-${shortId}-anchor`,
      path: graphqlPath(MESSAGES_BY_ANCHOR_ID, { conversationUrn, deliveredAt: Date.now(), countBefore: 20, countAfter: 0 }),
    });
  }

  await browser.close();

  const date = new Date().toISOString().slice(0, 10);
  const lines = [
    `# Messaging pagination probe ${date}`,
    '',
    '| Probe | Status | Summary | Path | File |',
    '|---|---|---|---|---|',
    ...results.map(
      (result) =>
        `| ${result.name} | ${result.status} | ${result.summary} | \`${result.path.replace(/ACoAA[A-Za-z0-9_-]+/g, 'ACoAA…').replace(/2-[A-Za-z0-9%=]{12,}/g, '2-…')}\` | ${result.file} |`,
    ),
  ];

  writeFileSync(resolve(DOCS_DIR, `spike-probe-${date}-pagination.md`), `${lines.join('\n')}\n`);
  console.error(`[probe] done; index at docs/spike-probe-${date}-pagination.md`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
