import { isNonEmptyString } from '@sniptt/guards';
import { type CoreApiClient } from 'twenty-client-sdk/core';

import { type LinkedinPersonRecord } from 'src/logic-functions/types/linkedin-person-record.type';

const PEOPLE_PAGE_SIZE = 200;

type LinkedinPersonNode = {
  id: string;
  linkedinLink: { primaryLinkUrl: string | null } | null;
  linkedinMemberId: string | null;
  linkedinChatId: string | null;
  linkedinConnection: string | null;
  linkedinConnectedAt: string | null;
  linkedinInvitationSentAt: string | null;
  linkedinLastMessageAt: string | null;
  linkedinLastMessageDirection: string | null;
  linkedinMessagesSent: number | null;
  linkedinMessagesReceived: number | null;
  linkedinSyncedAt: string | null;
  linkedinStatus: string | null;
};

type LinkedinPeopleConnection = {
  edges: Array<{ node: LinkedinPersonNode }>;
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
};

// The generated client is typed against the standard schema, which does not
// know about this app's fields (or the hand-created linkedinStatus /
// linkedinMessagesSent fields). This is the one place that selection gets
// cast; every other file gets the typed LinkedinPersonRecord shape below.
const LINKEDIN_PERSON_SELECTION: Record<string, unknown> = {
  id: true,
  linkedinLink: { primaryLinkUrl: true },
  linkedinMemberId: true,
  linkedinChatId: true,
  linkedinConnection: true,
  linkedinConnectedAt: true,
  linkedinInvitationSentAt: true,
  linkedinLastMessageAt: true,
  linkedinLastMessageDirection: true,
  linkedinMessagesSent: true,
  linkedinMessagesReceived: true,
  linkedinSyncedAt: true,
  linkedinStatus: true,
};

const toLinkedinPersonRecord = (
  node: LinkedinPersonNode,
): LinkedinPersonRecord => ({
  id: node.id,
  linkedinLinkUrl: node.linkedinLink?.primaryLinkUrl ?? null,
  linkedinMemberId: node.linkedinMemberId,
  linkedinChatId: node.linkedinChatId,
  linkedinConnection:
    node.linkedinConnection as LinkedinPersonRecord['linkedinConnection'],
  linkedinConnectedAt: node.linkedinConnectedAt,
  linkedinInvitationSentAt: node.linkedinInvitationSentAt,
  linkedinLastMessageAt: node.linkedinLastMessageAt,
  linkedinLastMessageDirection:
    node.linkedinLastMessageDirection as LinkedinPersonRecord['linkedinLastMessageDirection'],
  linkedinMessagesSent: node.linkedinMessagesSent,
  linkedinMessagesReceived: node.linkedinMessagesReceived,
  linkedinSyncedAt: node.linkedinSyncedAt,
  linkedinStatus: node.linkedinStatus as LinkedinPersonRecord['linkedinStatus'],
});

const hasLinkedinPresence = (record: LinkedinPersonRecord): boolean =>
  isNonEmptyString(record.linkedinLinkUrl) ||
  isNonEmptyString(record.linkedinMemberId);

// Loads every person that has either a LinkedIn profile link or an already
// resolved LinkedIn member id; the dataset is small enough (tens to low
// hundreds of people) to hold in memory for one reconcile run.
export const fetchLinkedinPeople = async (
  client: CoreApiClient,
): Promise<LinkedinPersonRecord[]> => {
  const records: LinkedinPersonRecord[] = [];
  let after: string | undefined;
  let hasNextPage = true;

  while (hasNextPage) {
    const result = await client.query({
      people: {
        __args: { first: PEOPLE_PAGE_SIZE, after },
        edges: { node: LINKEDIN_PERSON_SELECTION },
        pageInfo: { hasNextPage: true, endCursor: true },
      },
    });

    // The generated client is typed against whichever workspace it was built
    // from, so the custom LinkedIn fields are narrowed here in one place.
    const connection = result.people as unknown as LinkedinPeopleConnection;

    for (const edge of connection.edges) {
      records.push(toLinkedinPersonRecord(edge.node));
    }

    hasNextPage = connection.pageInfo.hasNextPage === true;
    after = connection.pageInfo.endCursor ?? undefined;
  }

  return records.filter(hasLinkedinPresence);
};
