import { type CoreApiClient } from 'twenty-client-sdk/core';
import { kv } from 'twenty-sdk/logic-function';

import { type LinkedinStatus } from 'src/constants/linkedin-status-order';
import { buildLinkedinMessagesKvKey } from 'src/constants/kv-keys';
import { advanceLinkedinStatus } from 'src/logic-functions/domain/advance-linkedin-status';
import { buildConversationMarkdown } from 'src/logic-functions/domain/build-conversation-markdown';
import { mergeLinkedinMessages } from 'src/logic-functions/domain/merge-linkedin-messages';
import { applyLinkedinPersonPatch } from 'src/logic-functions/data/linkedin-working-set.util';
import { upsertLinkedinConversationNote } from 'src/logic-functions/data/upsert-linkedin-conversation-note.util';
import { type LinkedinWorkingPerson } from 'src/logic-functions/types/linkedin-person-record.type';
import { type StoredLinkedinMessage } from 'src/logic-functions/types/stored-linkedin-message.type';

// Shared by the reconcile message step and the message_received webhook:
// merges new messages into the person's kv history, recomputes the message
// fields and status, and rebuilds the LinkedIn conversation Note.
export const applyLinkedinMessagesToPerson = async ({
  client,
  working,
  chatId,
  messages,
}: {
  client: CoreApiClient;
  working: LinkedinWorkingPerson;
  chatId: string;
  messages: StoredLinkedinMessage[];
}): Promise<void> => {
  const storeKey = buildLinkedinMessagesKvKey(working.id);
  const existing = (await kv.get<StoredLinkedinMessage[]>(storeKey)) ?? [];
  const merged = mergeLinkedinMessages(existing, messages);

  await kv.set(storeKey, merged);

  const sentCount = merged.filter(
    (message) => message.direction === 'SENT',
  ).length;
  const receivedCount = merged.filter(
    (message) => message.direction === 'RECEIVED',
  ).length;
  const latest = merged[merged.length - 1] as StoredLinkedinMessage | undefined;

  const patch: Record<string, unknown> = {
    linkedinChatId: chatId,
    linkedinMessagesSent: sentCount,
    linkedinMessagesReceived: receivedCount,
  };

  if (latest !== undefined) {
    patch.linkedinLastMessageAt = latest.at;
    patch.linkedinLastMessageDirection = latest.direction;
  }

  const candidateStatus: LinkedinStatus | null =
    receivedCount > 0
      ? 'CONVERSATION'
      : sentCount > 0
        ? 'MESSAGE_SENT'
        : null;

  if (candidateStatus !== null) {
    patch.linkedinStatus = advanceLinkedinStatus(
      working.linkedinStatus,
      candidateStatus,
    );
  }

  applyLinkedinPersonPatch(working, patch);

  await upsertLinkedinConversationNote({
    client,
    personId: working.id,
    markdown: buildConversationMarkdown(merged),
  });
};
