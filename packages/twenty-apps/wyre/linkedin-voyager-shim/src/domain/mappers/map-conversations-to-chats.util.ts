import { extractParticipantProviderId, extractScopedUrnTail } from 'src/domain/messenger-urn.util';
import {
  type MessengerConversation,
  type MessengerConversationsResponse,
  type MessengerParticipant,
  readMessengerElements,
} from 'src/linkedin/types/messenger.type';

export type ChatAttendee = {
  providerId: string;
  name: string | null;
  publicIdentifier: string | null;
  profileUrl: string | null;
};

export type ChatSnapshot = {
  id: string;
  name: string | null;
  isGroup: boolean;
  lastActivityAt: string | null;
  attendees: ChatAttendee[];
};

const buildFullName = (participant: MessengerParticipant): string | null => {
  const member = participant.participantType?.member;
  const fullName = [member?.firstName?.text, member?.lastName?.text]
    .filter((part): part is string => typeof part === 'string' && part.trim() !== '')
    .join(' ');

  return fullName === '' ? null : fullName;
};

// Organizations (sponsored InMail senders) are not members; leaving them out
// makes those chats look unattributable, which is what the CRM expects.
export const mapParticipantsToAttendees = ({
  participants,
  ownProviderId,
}: {
  participants: MessengerParticipant[];
  ownProviderId: string;
}): ChatAttendee[] =>
  participants.flatMap((participant) => {
    const providerId = extractParticipantProviderId(participant.hostIdentityUrn);

    if (providerId === null || providerId === ownProviderId || !participant.participantType?.member) {
      return [];
    }

    return [
      {
        providerId,
        name: buildFullName(participant),
        publicIdentifier: null,
        profileUrl: participant.participantType.member.profileUrl ?? null,
      },
    ];
  });

export const mapConversationToChat = ({
  conversation,
  ownProviderId,
}: {
  conversation: MessengerConversation;
  ownProviderId: string;
}): ChatSnapshot | null => {
  const id = extractScopedUrnTail(conversation.entityUrn);

  if (id === null) {
    return null;
  }

  const attendees = mapParticipantsToAttendees({
    participants: conversation.conversationParticipants ?? [],
    ownProviderId,
  });
  const lastActivityAt = conversation.lastActivityAt;

  return {
    id,
    name: typeof conversation.title === 'string' && conversation.title !== '' ? conversation.title : null,
    isGroup: conversation.groupChat ?? attendees.length > 1,
    lastActivityAt: typeof lastActivityAt === 'number' ? new Date(lastActivityAt).toISOString() : null,
    attendees,
  };
};

export const mapConversationsToChats = ({
  response,
  ownProviderId,
}: {
  response: MessengerConversationsResponse;
  ownProviderId: string;
}): ChatSnapshot[] =>
  readMessengerElements(response).flatMap((conversation) => {
    const chat = mapConversationToChat({ conversation, ownProviderId });

    return chat === null ? [] : [chat];
  });
