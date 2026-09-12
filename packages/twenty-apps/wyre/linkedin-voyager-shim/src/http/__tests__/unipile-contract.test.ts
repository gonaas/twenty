import { createApp } from 'src/http/app';
import { type AppDependencies } from 'src/http/app-dependencies.type';
import { type ProfileLookupOutcome } from 'src/linkedin/profile-lookup.service';
import { createLogger } from 'src/logger';
import { createStore } from 'src/store/create-store';
import { META_KEYS } from 'src/store/meta.repository';

const API_KEY = 'contract-test-api-key-0123';
const ACCOUNT_ID = 'wyre-linkedin';
const AUTH_HEADERS = { 'x-api-key': API_KEY };

const buildDependencies = ({
  lookupOutcome,
}: {
  lookupOutcome: ProfileLookupOutcome;
}): { dependencies: AppDependencies; lookups: string[] } => {
  const store = createStore(':memory:');
  const lookups: string[] = [];
  const seenAt = '2025-09-12T10:00:00.000Z';

  store.meta.set(META_KEYS.ownProviderId, 'ME');
  store.relations.upsertMany(
    Array.from({ length: 1205 }, (_, index) => ({
      member_id: `ACoAA${String(index).padStart(5, '0')}`,
      public_identifier: `person-${index}`,
      public_profile_url: `https://www.linkedin.com/in/person-${index}/`,
      first_name: 'Person',
      last_name: String(index),
      headline: null,
      created_at: 1_757_000_000_000 + index * 1000,
    })),
    seenAt,
  );
  store.sentInvitations.replaceAll(
    [
      {
        id: 'inv-1',
        invited_user: 'Carol Invited',
        invited_user_id: 'ACoAACAROL',
        invited_user_public_id: 'carol',
        date: '2025-09-09T06:40:00.000Z',
        parsed_datetime: '2025-09-09T06:40:00.000Z',
        invitation_text: null,
      },
    ],
    seenAt,
  );
  store.chats.upsertMany([
    {
      id: 'chat-1',
      name: null,
      isGroup: false,
      lastActivityAt: '2025-09-12T09:00:00.000Z',
      attendees: [{ providerId: 'ACoAA00001', name: 'Person 1', publicIdentifier: 'person-1', profileUrl: null }],
    },
    {
      id: 'chat-group',
      name: 'Founders',
      isGroup: true,
      lastActivityAt: '2025-09-12T09:00:00.000Z',
      attendees: [
        { providerId: 'ACoAA00001', name: 'Person 1', publicIdentifier: 'person-1', profileUrl: null },
        { providerId: 'ACoAA00002', name: 'Person 2', publicIdentifier: 'person-2', profileUrl: null },
      ],
    },
  ]);
  store.messages.upsertMany([
    { id: 'm1', chat_id: 'chat-1', text: 'old', timestamp: '2025-09-01T00:00:00.000Z', is_sender: 1, sender_id: 'ME', sender_attendee_id: 'ME' },
    { id: 'm2', chat_id: 'chat-1', text: 'new', timestamp: '2025-09-12T09:00:00.000Z', is_sender: 0, sender_id: 'ACoAA00001', sender_attendee_id: 'ACoAA00001' },
  ]);

  const dependencies: AppDependencies = {
    env: { API_KEY, ACCOUNT_ID },
    store,
    profileLookup: {
      lookup: async (identifier) => {
        lookups.push(identifier);

        return lookupOutcome;
      },
      lookupsToday: () => lookups.length,
    },
    session: {
      getState: () => 'ALIVE',
      getDiedReason: () => null,
      rotate: async () => true,
    },
    poller: {
      triggerNow: async () => null,
      isRunning: () => true,
      start: () => undefined,
    },
    voyager: {
      queueLength: () => 0,
      rateLimitedUntil: () => null,
    },
    logger: createLogger('error'),
  };

  return { dependencies, lookups };
};

const listAllPages = async <TItem>(
  app: ReturnType<typeof createApp>,
  path: string,
  limit: number,
): Promise<TItem[]> => {
  const items: TItem[] = [];
  let cursor: string | null = null;
  let pages = 0;

  do {
    const url = `${path}?account_id=${ACCOUNT_ID}&limit=${limit}${cursor === null ? '' : `&cursor=${cursor}`}`;
    const response = await app.request(url, { headers: AUTH_HEADERS });

    expect(response.status).toBe(200);

    const body = (await response.json()) as { items: TItem[]; cursor: string | null };

    items.push(...body.items);
    cursor = body.cursor;
    pages += 1;
  } while (cursor !== null && pages < 50);

  return items;
};

describe('Unipile-compatible contract', () => {
  it('rejects a wrong api key and an unknown account_id', async () => {
    const { dependencies } = buildDependencies({ lookupOutcome: { kind: 'not_found' } });
    const app = createApp(dependencies);

    const unauthorized = await app.request(`/api/v1/users/relations?account_id=${ACCOUNT_ID}&limit=1000`, {
      headers: { 'x-api-key': 'wrong' },
    });
    const unknownAccount = await app.request('/api/v1/users/relations?account_id=other&limit=1000', {
      headers: AUTH_HEADERS,
    });

    expect(unauthorized.status).toBe(401);
    expect(unknownAccount.status).toBe(404);
  });

  it('pages relations with limit=1000 until cursor is null, newest first', async () => {
    const { dependencies } = buildDependencies({ lookupOutcome: { kind: 'not_found' } });
    const app = createApp(dependencies);

    const relations = await listAllPages<{ member_id: string; created_at: number }>(
      app,
      '/api/v1/users/relations',
      1000,
    );

    expect(relations).toHaveLength(1205);
    expect(relations[0]?.member_id).toBe('ACoAA01204');
    expect(typeof relations[0]?.created_at).toBe('number');
    expect(new Set(relations.map((relation) => relation.member_id)).size).toBe(1205);
  });

  it('serves sent invitations with limit=100', async () => {
    const { dependencies } = buildDependencies({ lookupOutcome: { kind: 'not_found' } });
    const app = createApp(dependencies);

    const invitations = await listAllPages<{ invited_user_id: string; parsed_datetime: string }>(
      app,
      '/api/v1/users/invite/sent',
      100,
    );

    expect(invitations).toEqual([
      expect.objectContaining({ invited_user_id: 'ACoAACAROL', parsed_datetime: '2025-09-09T06:40:00.000Z' }),
    ]);
  });

  it('filters messages by after and keeps is_sender as 0/1', async () => {
    const { dependencies } = buildDependencies({ lookupOutcome: { kind: 'not_found' } });
    const app = createApp(dependencies);

    const all = await listAllPages<{ id: string; is_sender: number }>(app, '/api/v1/messages', 250);
    const response = await app.request(
      `/api/v1/messages?account_id=${ACCOUNT_ID}&limit=250&after=2025-09-10T00:00:00.000Z`,
      { headers: AUTH_HEADERS },
    );
    const body = (await response.json()) as { items: { id: string; is_sender: number }[]; cursor: string | null };

    expect(all.map((message) => message.id)).toEqual(['m1', 'm2']);
    expect(all.map((message) => message.is_sender)).toEqual([1, 0]);
    expect(body.items.map((message) => message.id)).toEqual(['m2']);
    expect(body.cursor).toBeNull();
  });

  it('resolves 1:1 chats and returns null attendee for group chats', async () => {
    const { dependencies } = buildDependencies({ lookupOutcome: { kind: 'not_found' } });
    const app = createApp(dependencies);

    const direct = await app.request(`/api/v1/chats/chat-1?account_id=${ACCOUNT_ID}`, { headers: AUTH_HEADERS });
    const group = await app.request(`/api/v1/chats/chat-group?account_id=${ACCOUNT_ID}`, { headers: AUTH_HEADERS });
    const missing = await app.request(`/api/v1/chats/nope?account_id=${ACCOUNT_ID}`, { headers: AUTH_HEADERS });

    expect(await direct.json()).toEqual(expect.objectContaining({ id: 'chat-1', attendee_provider_id: 'ACoAA00001' }));
    expect(await group.json()).toEqual(expect.objectContaining({ id: 'chat-group', attendee_provider_id: null, name: 'Founders' }));
    expect(missing.status).toBe(404);
  });

  it('returns 422 for an unknown identifier and the profile when found', async () => {
    const notFound = buildDependencies({ lookupOutcome: { kind: 'not_found' } });
    const found = buildDependencies({
      lookupOutcome: {
        kind: 'found',
        profile: {
          provider_id: 'ACoAA00001',
          public_identifier: 'person-1',
          network_distance: 'FIRST_DEGREE',
          is_relationship: true,
          invitation: null,
        },
      },
    });

    const unknown = await createApp(notFound.dependencies).request(
      `/api/v1/users/does-not-exist-xyz?account_id=${ACCOUNT_ID}`,
      { headers: AUTH_HEADERS },
    );
    const known = await createApp(found.dependencies).request(`/api/v1/users/person-1?account_id=${ACCOUNT_ID}`, {
      headers: AUTH_HEADERS,
    });

    expect(unknown.status).toBe(422);
    expect(notFound.lookups).toEqual(['does-not-exist-xyz']);
    expect(known.status).toBe(200);
    expect(await known.json()).toEqual(
      expect.objectContaining({ provider_id: 'ACoAA00001', network_distance: 'FIRST_DEGREE', invitation: null }),
    );
  });

  it('exposes health without an api key', async () => {
    const { dependencies } = buildDependencies({ lookupOutcome: { kind: 'not_found' } });
    const response = await createApp(dependencies).request('/health');

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(expect.objectContaining({ session: 'ALIVE', relations: 1205 }));
  });
});
