import { buildGraphqlVariables, encodeRestliValue } from 'src/linkedin/restli.util';

// Verified against a live session on 2026-09-12 (see docs/endpoints.md); re-run
// scripts/spike-probe.ts when any of these drifts. The web SPA no longer calls
// the REST entries below, but the API still serves them.
export const VOYAGER_BASE_PATH = '/voyager/api';

const CONNECTIONS_DECORATION_ID =
  'com.linkedin.voyager.dash.deco.web.mynetwork.ConnectionListWithProfile-16';
const INBOX_CATEGORY = 'INBOX';

// GraphQL query ids rotate on LinkedIn front-end deploys. Each one maps to a
// different resolver; the variables it accepts were read from its validation errors.
export const MESSENGER_QUERY_IDS = {
  // messengerConversationsBySyncToken: the 20 most recently updated threads, no paging.
  conversationsRecent: 'messengerConversations.0d5e6781bbee71c3e51c8843c6519f48',
  // messengerConversationsByCategory: newest first, pages through lastUpdatedBefore.
  conversationsByCategory: 'messengerConversations.0e6384758dbe98769dd964f463fcdbeb',
  // messengerMessagesByAnchorTimestamp: the countBefore messages delivered before the anchor, ascending.
  messagesByAnchor: 'messengerMessages.d8ea76885a52fd5dc5c317078ab7c977',
} as const;

const messagingGraphqlPath = (queryId: string, variables: Parameters<typeof buildGraphqlVariables>[0]) =>
  `${VOYAGER_BASE_PATH}/voyagerMessagingGraphQL/graphql?queryId=${queryId}&variables=${buildGraphqlVariables(variables)}`;

export const VOYAGER_ENDPOINTS = {
  me: () => `${VOYAGER_BASE_PATH}/me`,

  connections: ({ start, count }: { start: number; count: number }) =>
    `${VOYAGER_BASE_PATH}/relationships/dash/connections?decorationId=${CONNECTIONS_DECORATION_ID}&count=${count}&q=search&sortType=RECENTLY_ADDED&start=${start}`,

  sentInvitations: ({ start, count }: { start: number; count: number }) =>
    `${VOYAGER_BASE_PATH}/relationships/sentInvitationViewsV2?invitationType=CONNECTION&q=invitationType&start=${start}&count=${count}`,

  conversationsRecent: ({ ownProviderId }: { ownProviderId: string }) =>
    messagingGraphqlPath(MESSENGER_QUERY_IDS.conversationsRecent, {
      mailboxUrn: `urn:li:fsd_profile:${ownProviderId}`,
    }),

  conversationsPage: ({
    ownProviderId,
    lastUpdatedBefore,
    count,
  }: {
    ownProviderId: string;
    lastUpdatedBefore?: number;
    count: number;
  }) =>
    messagingGraphqlPath(MESSENGER_QUERY_IDS.conversationsByCategory, {
      mailboxUrn: `urn:li:fsd_profile:${ownProviderId}`,
      category: INBOX_CATEGORY,
      ...(lastUpdatedBefore === undefined ? {} : { lastUpdatedBefore }),
      count,
    }),

  threadMessages: ({
    conversationUrn,
    before,
    count,
  }: {
    conversationUrn: string;
    before: number;
    count: number;
  }) =>
    messagingGraphqlPath(MESSENGER_QUERY_IDS.messagesByAnchor, {
      conversationUrn,
      deliveredAt: before,
      countBefore: count,
      countAfter: 0,
    }),

  profile: ({ memberIdentity }: { memberIdentity: string }) =>
    `${VOYAGER_BASE_PATH}/identity/dash/profiles?q=memberIdentity&memberIdentity=${encodeRestliValue(memberIdentity)}`,

  memberRelationship: ({ providerId }: { providerId: string }) =>
    `${VOYAGER_BASE_PATH}/voyagerRelationshipsDashMemberRelationships/${encodeRestliValue(`urn:li:fsd_memberRelationship:${providerId}`)}`,
} as const;

export const VOYAGER_ACCEPT = {
  normalized: 'application/vnd.linkedin.normalized+json+2.1',
  graphql: 'application/graphql',
} as const;

export const VOYAGER_PAGE_INSTANCE_PREFIXES = {
  connections: 'd_flagship3_people_connections',
  sentInvitations: 'd_flagship3_people_invitations',
  messaging: 'd_flagship3_messaging',
  profile: 'd_flagship3_profile_view_base',
  feed: 'd_flagship3_feed',
} as const;

export const VOYAGER_REFERERS = {
  connections: 'https://www.linkedin.com/mynetwork/invite-connect/connections/',
  sentInvitations: 'https://www.linkedin.com/mynetwork/invitation-manager/sent/',
  messaging: 'https://www.linkedin.com/messaging/',
  feed: 'https://www.linkedin.com/feed/',
  profile: ({ memberIdentity }: { memberIdentity: string }) =>
    `https://www.linkedin.com/in/${encodeURIComponent(memberIdentity)}/`,
} as const;
