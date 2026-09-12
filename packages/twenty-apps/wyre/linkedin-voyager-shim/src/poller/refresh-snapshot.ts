import { type Env } from 'src/config/env';
import { findNewReceivedMessages } from 'src/domain/diff/find-new-received-messages.util';
import { findNewRelations } from 'src/domain/diff/find-new-relations.util';
import { shouldEmitWebhooks } from 'src/domain/diff/should-emit-webhooks.util';
import { mapConnectionsToRelations } from 'src/domain/mappers/map-connections-to-relations.util';
import { mapConversationsToChats } from 'src/domain/mappers/map-conversations-to-chats.util';
import { mapEmbeddedMessages, mapMessengerMessages } from 'src/domain/mappers/map-messenger-messages.util';
import { buildConversationUrn } from 'src/domain/messenger-urn.util';
import { mapSentInvitations } from 'src/domain/mappers/map-sent-invitations.util';
import { type UnipileListedMessage } from 'src/domain/unipile/unipile-listed-message.type';
import { type UnipileRelation } from 'src/domain/unipile/unipile-relation.type';
import { type UnipileSentInvitation } from 'src/domain/unipile/unipile-sent-invitation.type';
import {
  buildMessageReceivedPayload,
  buildNewRelationPayload,
} from 'src/domain/webhooks/build-webhook-payloads.util';
import {
  VOYAGER_ACCEPT,
  VOYAGER_ENDPOINTS,
  VOYAGER_PAGE_INSTANCE_PREFIXES,
  VOYAGER_REFERERS,
} from 'src/linkedin/endpoints';
import {
  type MessengerConversationsResponse,
  type MessengerMessagesResponse,
} from 'src/linkedin/types/messenger.type';
import { type VoyagerClient } from 'src/linkedin/voyager-client';
import { type Logger } from 'src/logger';
import { type WebhookEmitter } from 'src/poller/webhook-emitter';
import { type Store } from 'src/store/create-store';
import { META_KEYS } from 'src/store/meta.repository';

const SENT_INVITATIONS_PAGE_SIZE = 100;
const MAX_PAGES_PER_RESOURCE = 200;
const CONVERSATIONS_PAGE_SIZE = 20;
const THREAD_PAGE_SIZE = 20;

export type RefreshSummary = {
  relations: number;
  newRelations: number;
  sentInvitations: number;
  chatsChecked: number;
  newMessages: number;
  newReceivedMessages: number;
  webhooksEmitted: number;
};

export const refreshSnapshot = async ({
  env,
  store,
  voyagerClient,
  webhookEmitter,
  logger,
}: {
  env: Env;
  store: Store;
  voyagerClient: VoyagerClient;
  webhookEmitter: WebhookEmitter;
  logger: Logger;
}): Promise<RefreshSummary> => {
  const ownProviderId = store.meta.get(META_KEYS.ownProviderId);

  if (ownProviderId === null) {
    throw new Error('Own provider id is unknown; the session bootstrap did not complete');
  }

  const firstSnapshotDone = store.meta.get(META_KEYS.firstSnapshotDone) === 'true';
  const emitWebhooks = shouldEmitWebhooks({
    firstSnapshotDone,
    webhooksConfigured: webhookEmitter.configured,
  });
  const seenAt = new Date().toISOString();
  const summary: RefreshSummary = {
    relations: 0,
    newRelations: 0,
    sentInvitations: 0,
    chatsChecked: 0,
    newMessages: 0,
    newReceivedMessages: 0,
    webhooksEmitted: 0,
  };

  const newRelations = await refreshRelations({
    env,
    store,
    voyagerClient,
    firstSnapshotDone,
    seenAt,
    summary,
  });

  summary.sentInvitations = await refreshSentInvitations({ store, voyagerClient, seenAt });

  const newReceivedMessages = await refreshConversations({
    env,
    store,
    voyagerClient,
    ownProviderId,
    summary,
  });

  if (emitWebhooks) {
    for (const relation of newRelations) {
      if (await webhookEmitter.emit(buildNewRelationPayload({ accountId: env.ACCOUNT_ID, relation }))) {
        summary.webhooksEmitted += 1;
      }
    }

    for (const message of newReceivedMessages) {
      const chat = store.chats.find(message.chat_id);
      const payload = buildMessageReceivedPayload({
        accountId: env.ACCOUNT_ID,
        ownProviderId,
        message,
        attendees: chat?.attendees ?? [],
      });

      if (await webhookEmitter.emit(payload)) {
        summary.webhooksEmitted += 1;
      }
    }
  }

  store.meta.set(META_KEYS.firstSnapshotDone, 'true');
  store.meta.set(META_KEYS.lastFullRefreshAt, new Date().toISOString());
  logger.info('Snapshot refreshed', { ...summary });

  return summary;
};

const refreshRelations = async ({
  env,
  store,
  voyagerClient,
  firstSnapshotDone,
  seenAt,
  summary,
}: {
  env: Env;
  store: Store;
  voyagerClient: VoyagerClient;
  firstSnapshotDone: boolean;
  seenAt: string;
  summary: RefreshSummary;
}): Promise<UnipileRelation[]> => {
  const knownMemberIds = store.relations.memberIds();
  const newRelations: UnipileRelation[] = [];

  for (let pageIndex = 0; pageIndex < MAX_PAGES_PER_RESOURCE; pageIndex += 1) {
    const start = pageIndex * env.CONNECTIONS_PAGE_SIZE;
    const response = await voyagerClient.getOrThrow(
      VOYAGER_ENDPOINTS.connections({ start, count: env.CONNECTIONS_PAGE_SIZE }),
      { referer: VOYAGER_REFERERS.connections, pageInstancePrefix: VOYAGER_PAGE_INSTANCE_PREFIXES.connections },
    );
    const relations = mapConnectionsToRelations(response);

    if (relations.length === 0) {
      break;
    }

    store.relations.upsertMany(relations, seenAt);
    summary.relations += relations.length;

    const unseen = findNewRelations({ knownMemberIds, incoming: relations });

    newRelations.push(...unseen);

    for (const relation of relations) {
      knownMemberIds.add(relation.member_id);
    }

    // Connections come sorted by recency, so once a full page is already known
    // the rest of the list is too; the first snapshot walks everything.
    if ((firstSnapshotDone && unseen.length === 0) || relations.length < env.CONNECTIONS_PAGE_SIZE) {
      break;
    }
  }

  summary.newRelations = newRelations.length;

  return newRelations;
};

const refreshSentInvitations = async ({
  store,
  voyagerClient,
  seenAt,
}: {
  store: Store;
  voyagerClient: VoyagerClient;
  seenAt: string;
}): Promise<number> => {
  const invitations: UnipileSentInvitation[] = [];

  for (let pageIndex = 0; pageIndex < MAX_PAGES_PER_RESOURCE; pageIndex += 1) {
    const response = await voyagerClient.getOrThrow(
      VOYAGER_ENDPOINTS.sentInvitations({
        start: pageIndex * SENT_INVITATIONS_PAGE_SIZE,
        count: SENT_INVITATIONS_PAGE_SIZE,
      }),
      {
        referer: VOYAGER_REFERERS.sentInvitations,
        pageInstancePrefix: VOYAGER_PAGE_INSTANCE_PREFIXES.sentInvitations,
      },
    );
    const page = mapSentInvitations(response);

    invitations.push(...page);

    if (page.length < SENT_INVITATIONS_PAGE_SIZE) {
      break;
    }
  }

  store.sentInvitations.replaceAll(invitations, seenAt);

  return invitations.length;
};

const refreshConversations = async ({
  env,
  store,
  voyagerClient,
  ownProviderId,
  summary,
}: {
  env: Env;
  store: Store;
  voyagerClient: VoyagerClient;
  ownProviderId: string;
  summary: RefreshSummary;
}): Promise<UnipileListedMessage[]> => {
  const messagingOptions = {
    referer: VOYAGER_REFERERS.messaging,
    pageInstancePrefix: VOYAGER_PAGE_INSTANCE_PREFIXES.messaging,
    accept: VOYAGER_ACCEPT.graphql,
  };
  const backfillStartMs = Date.now() - env.MESSAGE_BACKFILL_DAYS * 24 * 60 * 60 * 1000;
  const lastRefreshAt = store.meta.get(META_KEYS.lastFullRefreshAt);
  const backfillDone = store.meta.get(META_KEYS.conversationBackfillDone) === 'true';
  // Until the whole window has been listed once, every refresh walks back to
  // the window floor; afterwards older pages only matter when they can still
  // hold threads that changed since the previous refresh.
  const pageFloorMs =
    backfillDone && lastRefreshAt !== null
      ? Math.max(backfillStartMs, Date.parse(lastRefreshAt))
      : backfillStartMs;
  const embeddedMessages: UnipileListedMessage[] = [];
  let lastUpdatedBefore: number | undefined;
  let reachedFloor = false;

  for (let pageIndex = 0; pageIndex < env.CONVERSATION_PAGES_MAX; pageIndex += 1) {
    const response = await voyagerClient.getOrThrow<MessengerConversationsResponse>(
      VOYAGER_ENDPOINTS.conversationsPage({ ownProviderId, lastUpdatedBefore, count: CONVERSATIONS_PAGE_SIZE }),
      messagingOptions,
    );
    const chats = mapConversationsToChats({ response, ownProviderId });

    if (chats.length === 0) {
      reachedFloor = true;
      break;
    }

    store.chats.upsertMany(chats);
    embeddedMessages.push(...mapEmbeddedMessages({ response, ownProviderId }));

    const oldestActivityMs = Math.min(
      ...chats.map((chat) => (chat.lastActivityAt === null ? Number.MAX_SAFE_INTEGER : Date.parse(chat.lastActivityAt))),
    );

    if (chats.length < CONVERSATIONS_PAGE_SIZE || oldestActivityMs < pageFloorMs) {
      reachedFloor = true;
      break;
    }

    lastUpdatedBefore = oldestActivityMs;
  }

  if (!backfillDone && reachedFloor) {
    store.meta.set(META_KEYS.conversationBackfillDone, 'true');
  }

  const newReceivedMessages: UnipileListedMessage[] = [];
  const recordMessages = (chatId: string, messages: UnipileListedMessage[]) => {
    const knownMessageIds = store.messages.idsForChat(chatId);
    const unseen = messages.filter((message) => !knownMessageIds.has(message.id));

    newReceivedMessages.push(...findNewReceivedMessages({ knownMessageIds, incoming: messages }));
    store.messages.upsertMany(messages);
    summary.newMessages += unseen.length;
  };

  for (const chat of store.chats.pendingSync().slice(0, env.CONVERSATIONS_PER_REFRESH)) {
    summary.chatsChecked += 1;

    const knownMessageIds = store.messages.idsForChat(chat.id);
    const embeddedForChat = embeddedMessages.filter((message) => message.chat_id === chat.id);
    const embeddedUnseen = embeddedForChat.filter((message) => !knownMessageIds.has(message.id));

    // The list already carries the latest message of every thread, so a thread
    // whose only news is that message never needs a second request.
    if (knownMessageIds.size > 0 && embeddedUnseen.length <= 1) {
      recordMessages(chat.id, embeddedForChat);
    } else {
      recordMessages(chat.id, [
        ...(await fetchThreadHistory({
          env,
          voyagerClient,
          ownProviderId,
          chatId: chat.id,
          knownMessageIds,
          backfillStartMs,
          messagingOptions,
        })),
        ...embeddedForChat,
      ]);
    }

    if (chat.lastActivityAt !== null) {
      store.chats.markSynced(chat.id, chat.lastActivityAt);
    }
  }

  summary.newReceivedMessages = newReceivedMessages.length;

  return newReceivedMessages;
};

// Walks a thread backwards from now, one anchor page at a time, until it
// reaches a message already stored, the backfill window, or the page cap.
const fetchThreadHistory = async ({
  env,
  voyagerClient,
  ownProviderId,
  chatId,
  knownMessageIds,
  backfillStartMs,
  messagingOptions,
}: {
  env: Env;
  voyagerClient: VoyagerClient;
  ownProviderId: string;
  chatId: string;
  knownMessageIds: ReadonlySet<string>;
  backfillStartMs: number;
  messagingOptions: { referer: string; pageInstancePrefix: string; accept: string };
}): Promise<UnipileListedMessage[]> => {
  const conversationUrn = buildConversationUrn({ ownProviderId, chatId });
  const collected: UnipileListedMessage[] = [];
  let before = Date.now();

  for (let pageIndex = 0; pageIndex < env.THREAD_PAGES_MAX; pageIndex += 1) {
    const response = await voyagerClient.getOrThrow<MessengerMessagesResponse>(
      VOYAGER_ENDPOINTS.threadMessages({ conversationUrn, before, count: THREAD_PAGE_SIZE }),
      messagingOptions,
    );
    const messages = mapMessengerMessages({ response, chatId, ownProviderId });

    if (messages.length === 0) {
      break;
    }

    collected.push(...messages);

    const oldestDeliveredMs = Math.min(...messages.map((message) => Date.parse(message.timestamp)));
    const reachedKnownHistory = messages.some((message) => knownMessageIds.has(message.id));

    if (messages.length < THREAD_PAGE_SIZE || reachedKnownHistory || oldestDeliveredMs < backfillStartMs) {
      break;
    }

    before = oldestDeliveredMs - 1;
  }

  return collected;
};
