import { extractProviderId } from 'src/domain/provider-id.util';

// urn:li:msg_conversation:(urn:li:fsd_profile:<owner>,<threadId>)
// urn:li:msg_message:(urn:li:fsd_profile:<owner>,<messageId>)
const SCOPED_URN_PATTERN = /^urn:li:msg_(?:conversation|message):\(urn:li:fsd_profile:[A-Za-z0-9_-]+,(.+)\)$/;

export const extractScopedUrnTail = (urn: string | null | undefined): string | null => {
  if (typeof urn !== 'string') {
    return null;
  }

  return SCOPED_URN_PATTERN.exec(urn)?.[1] ?? null;
};

export const buildConversationUrn = ({
  ownProviderId,
  chatId,
}: {
  ownProviderId: string;
  chatId: string;
}): string => `urn:li:msg_conversation:(urn:li:fsd_profile:${ownProviderId},${chatId})`;

export const extractParticipantProviderId = (hostIdentityUrn: string | null | undefined): string | null =>
  extractProviderId(hostIdentityUrn);
