import { extractParticipantProviderId, extractScopedUrnTail } from 'src/domain/messenger-urn.util';
import { type UnipileListedMessage } from 'src/domain/unipile/unipile-listed-message.type';
import {
  type MessengerConversationsResponse,
  type MessengerMessage,
  type MessengerMessagesResponse,
  readMessengerElements,
} from 'src/linkedin/types/messenger.type';

export const mapMessengerMessage = ({
  message,
  chatId,
  ownProviderId,
}: {
  message: MessengerMessage;
  chatId: string;
  ownProviderId: string;
}): UnipileListedMessage | null => {
  const id = extractScopedUrnTail(message.entityUrn);
  const deliveredAt = message.deliveredAt;

  if (id === null || typeof deliveredAt !== 'number') {
    return null;
  }

  const senderProviderId = extractParticipantProviderId(message.sender?.hostIdentityUrn);
  const text = message.body?.text;

  return {
    id,
    chat_id: chatId,
    text: typeof text === 'string' && text !== '' ? text : null,
    timestamp: new Date(deliveredAt).toISOString(),
    is_sender: senderProviderId === ownProviderId ? 1 : 0,
    sender_id: senderProviderId,
    sender_attendee_id: senderProviderId,
  };
};

export const mapMessengerMessages = ({
  response,
  chatId,
  ownProviderId,
}: {
  response: MessengerMessagesResponse;
  chatId: string;
  ownProviderId: string;
}): UnipileListedMessage[] =>
  readMessengerElements(response).flatMap((message) => {
    const mapped = mapMessengerMessage({ message, chatId, ownProviderId });

    return mapped === null ? [] : [mapped];
  });

// The conversation list embeds the latest message of each thread, which is
// enough to notice activity without fetching every thread.
export const mapEmbeddedMessages = ({
  response,
  ownProviderId,
}: {
  response: MessengerConversationsResponse;
  ownProviderId: string;
}): UnipileListedMessage[] =>
  readMessengerElements(response).flatMap((conversation) => {
    const chatId = extractScopedUrnTail(conversation.entityUrn);

    if (chatId === null) {
      return [];
    }

    return (conversation.messages?.elements ?? []).flatMap((message) => {
      const mapped = mapMessengerMessage({ message, chatId, ownProviderId });

      return mapped === null ? [] : [mapped];
    });
  });
