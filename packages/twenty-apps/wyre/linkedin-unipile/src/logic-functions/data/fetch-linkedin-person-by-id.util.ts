import { type CoreApiClient } from 'twenty-client-sdk/core';

import { type LinkedinPersonRecord } from 'src/logic-functions/types/linkedin-person-record.type';

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

// Same shape as fetch-linkedin-people.util's selection, kept in sync
// manually since only one field is fetched here.
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

export const fetchLinkedinPersonById = async (
  client: CoreApiClient,
  personId: string,
): Promise<LinkedinPersonRecord | null> => {
  const result = await client.query({
    people: {
      __args: { filter: { id: { eq: personId } }, first: 1 },
      edges: { node: LINKEDIN_PERSON_SELECTION },
    },
  });

  const node = result.people?.edges?.[0]?.node as
    | LinkedinPersonNode
    | undefined;

  return node === undefined ? null : toLinkedinPersonRecord(node);
};
