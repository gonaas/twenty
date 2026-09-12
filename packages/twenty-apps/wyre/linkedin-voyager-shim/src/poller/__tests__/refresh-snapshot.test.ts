import { parseEnv } from 'src/config/env';
import { type UnipileWebhookEventPayload } from 'src/domain/unipile/unipile-webhook-event.type';
import { type VoyagerClient } from 'src/linkedin/voyager-client';
import { createLogger } from 'src/logger';
import { refreshSnapshot } from 'src/poller/refresh-snapshot';
import { type WebhookEmitter } from 'src/poller/webhook-emitter';
import { createStore } from 'src/store/create-store';
import { META_KEYS } from 'src/store/meta.repository';
import { loadFixture } from 'src/test-support/load-fixture.util';

const OWN_PROVIDER_ID = 'ACoAAAAAAAME';
const EMPTY_NORMALIZED = { data: { '*elements': [] }, included: [] };

const buildEnv = () =>
  parseEnv({
    API_KEY: 'refresh-test-api-key-0123',
    ACCOUNT_ID: 'wyre-linkedin',
    MESSAGE_BACKFILL_DAYS: '3650',
  });

const buildVoyagerStub = (overrides: Record<string, unknown> = {}) => {
  const calls: string[] = [];
  const respond = (path: string): unknown => {
    calls.push(path);

    const override = Object.entries(overrides).find(([fragment]) => path.includes(fragment));

    if (override !== undefined) {
      return override[1];
    }

    if (path.endsWith('/me')) {
      return loadFixture('me');
    }

    if (path.includes('/relationships/dash/connections')) {
      return path.includes('start=0') ? loadFixture('connections') : EMPTY_NORMALIZED;
    }

    if (path.includes('/relationships/sentInvitationViewsV2')) {
      return loadFixture('sent-invitations');
    }

    if (path.includes('messengerConversations.')) {
      return loadFixture('messenger-conversations');
    }

    if (path.includes('messengerMessages.')) {
      return loadFixture('messenger-messages');
    }

    throw new Error(`Unexpected Voyager path in test: ${path}`);
  };

  const client: VoyagerClient = {
    get: async (path) => ({ status: 200, json: respond(path) }),
    getOrThrow: async <TResponse,>(path: string) => respond(path) as TResponse,
    queueLength: () => 0,
    rateLimitedUntil: () => null,
  };

  return { client, calls };
};

const buildEmitter = (): { emitter: WebhookEmitter; payloads: UnipileWebhookEventPayload[] } => {
  const payloads: UnipileWebhookEventPayload[] = [];

  return {
    payloads,
    emitter: {
      configured: true,
      emit: async (payload) => {
        payloads.push(payload);

        return true;
      },
    },
  };
};

describe('refreshSnapshot', () => {
  it('fills the snapshot on the first run without emitting webhooks', async () => {
    const env = buildEnv();
    const store = createStore(':memory:');
    const { client, calls } = buildVoyagerStub();
    const { emitter, payloads } = buildEmitter();

    store.meta.set(META_KEYS.ownProviderId, OWN_PROVIDER_ID);

    const summary = await refreshSnapshot({ env, store, voyagerClient: client, webhookEmitter: emitter, logger: createLogger('error') });

    expect(summary).toEqual(
      expect.objectContaining({ relations: 3, newRelations: 3, sentInvitations: 1, chatsChecked: 3, webhooksEmitted: 0 }),
    );
    expect(store.relations.count()).toBe(3);
    expect(store.sentInvitations.count()).toBe(1);
    expect(store.chats.find('2-chat-one==')?.attendee_provider_id).toBe('ACoAAAAAAA1');
    expect(store.chats.find('2-chat-group==')?.attendee_provider_id).toBeNull();
    expect(store.messages.count({})).toBe(3);
    expect(store.meta.get(META_KEYS.firstSnapshotDone)).toBe('true');
    expect(payloads).toEqual([]);
    expect(calls.filter((path) => path.includes('messengerMessages.'))).toHaveLength(3);
    expect(calls.filter((path) => path.includes('messengerConversations.'))).toHaveLength(1);
  });

  it('emits webhooks for a new relation and a newly received message on later runs', async () => {
    const env = buildEnv();
    const store = createStore(':memory:');
    const logger = createLogger('error');

    store.meta.set(META_KEYS.ownProviderId, OWN_PROVIDER_ID);

    const first = buildVoyagerStub();

    await refreshSnapshot({ env, store, voyagerClient: first.client, webhookEmitter: buildEmitter().emitter, logger });

    const conversations = loadFixture<{
      data: { messengerConversationsByCategory: { elements: Record<string, unknown>[] } };
    }>('messenger-conversations');
    const [directChat] = conversations.data.messengerConversationsByCategory.elements;

    if (directChat === undefined) {
      throw new Error('fixture missing the direct chat');
    }

    directChat.lastActivityAt = 1789200000000;
    directChat.messages = {
      elements: [
        {
          entityUrn: `urn:li:msg_message:(urn:li:fsd_profile:${OWN_PROVIDER_ID},2-msg-three)`,
          deliveredAt: 1789200000000,
          body: { text: 'Are you free tomorrow?' },
          sender: { hostIdentityUrn: 'urn:li:fsd_profile:ACoAAAAAAA1' },
        },
      ],
    };

    const connections = loadFixture<{ data: { '*elements': string[] }; included: Record<string, unknown>[] }>('connections');

    connections.data['*elements'].unshift('urn:li:fsd_connection:ACoAAAAAAA9');
    connections.included.push(
      {
        createdAt: 1789300000000,
        connectedMember: 'urn:li:fsd_profile:ACoAAAAAAA9',
        entityUrn: 'urn:li:fsd_connection:ACoAAAAAAA9',
        $type: 'com.linkedin.voyager.dash.relationships.Connection',
      },
      {
        entityUrn: 'urn:li:fsd_profile:ACoAAAAAAA9',
        $type: 'com.linkedin.voyager.dash.identity.profile.Profile',
        firstName: 'Nina',
        lastName: 'New',
        publicIdentifier: 'nina-new',
      },
    );

    const second = buildVoyagerStub({ 'messengerConversations.': conversations, 'start=0': connections });
    const { emitter, payloads } = buildEmitter();

    const summary = await refreshSnapshot({ env, store, voyagerClient: second.client, webhookEmitter: emitter, logger });

    expect(summary).toEqual(expect.objectContaining({ newRelations: 1, newReceivedMessages: 1, webhooksEmitted: 2 }));
    expect(payloads.map((payload) => ('event' in payload ? payload.event : 'account_status'))).toEqual([
      'new_relation',
      'message_received',
    ]);
    expect(payloads[1]).toEqual(
      expect.objectContaining({
        chat_id: '2-chat-one==',
        message_id: '2-msg-three',
        sender: expect.objectContaining({ attendee_provider_id: 'ACoAAAAAAA1', attendee_name: 'Alice Example' }),
        account_info: { user_id: OWN_PROVIDER_ID },
      }),
    );
    // The changed thread had history and exactly one unseen embedded message,
    // so no thread request was needed.
    expect(second.calls.filter((path) => path.includes('messengerMessages.'))).toHaveLength(0);
  });
});
