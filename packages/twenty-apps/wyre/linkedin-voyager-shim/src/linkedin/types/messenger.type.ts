// Shapes returned by /voyagerMessagingGraphQL/graphql with accept: application/graphql.
// Unlike the normalized REST payloads these are plain nested trees.
export type MessengerAttributedText = { text?: string | null } | null;

export type MessengerMember = {
  firstName?: MessengerAttributedText;
  lastName?: MessengerAttributedText;
  headline?: MessengerAttributedText;
  profileUrl?: string | null;
  distance?: string | null;
};

export type MessengerParticipant = {
  hostIdentityUrn?: string | null;
  participantType?: {
    member?: MessengerMember | null;
    organization?: Record<string, unknown> | null;
  } | null;
};

export type MessengerMessage = {
  entityUrn?: string;
  deliveredAt?: number | null;
  body?: MessengerAttributedText;
  subject?: string | null;
  sender?: MessengerParticipant | null;
  conversation?: { entityUrn?: string } | null;
};

export type MessengerConversation = {
  entityUrn?: string;
  lastActivityAt?: number | null;
  groupChat?: boolean | null;
  title?: string | null;
  categories?: string[] | null;
  conversationParticipants?: MessengerParticipant[] | null;
  messages?: { elements?: MessengerMessage[] | null } | null;
};

export type MessengerCollection<TElement> = {
  elements?: TElement[] | null;
  metadata?: { nextCursor?: string | null; prevCursor?: string | null; newSyncToken?: string | null } | null;
};

// Every resolver names its collection differently (…BySyncToken, …ByCategory,
// …ByAnchorTimestamp); the shape inside is the same.
export type MessengerGraphqlResponse<TElement> = {
  data?: Record<string, MessengerCollection<TElement> | string | null | undefined> | null;
  errors?: { message?: string }[];
};

export type MessengerConversationsResponse = MessengerGraphqlResponse<MessengerConversation>;

export type MessengerMessagesResponse = MessengerGraphqlResponse<MessengerMessage>;

export const readMessengerElements = <TElement>(response: MessengerGraphqlResponse<TElement>): TElement[] => {
  for (const value of Object.values(response.data ?? {})) {
    if (typeof value === 'object' && value !== null && Array.isArray(value.elements)) {
      return value.elements;
    }
  }

  return [];
};
