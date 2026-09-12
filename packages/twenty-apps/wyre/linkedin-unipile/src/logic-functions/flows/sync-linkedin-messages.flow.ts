import { isNonEmptyString } from '@sniptt/guards';
import { type CoreApiClient } from 'twenty-client-sdk/core';
import { kv } from 'twenty-sdk/logic-function';

import { LINKEDIN_MESSAGES_AFTER_KV_KEY } from 'src/constants/kv-keys';
import { deriveDirectionFromListedMessage } from 'src/logic-functions/domain/derive-direction-from-listed-message';
import { applyLinkedinMessagesToPerson } from 'src/logic-functions/flows/apply-linkedin-messages-to-person.util';
import { resolveLinkedinChatPersonId } from 'src/logic-functions/flows/resolve-linkedin-chat-person-id.util';
import { applyLinkedinPersonPatch } from 'src/logic-functions/data/linkedin-working-set.util';
import { listUnipileMessages } from 'src/logic-functions/unipile-api/list-messages';
import { type UnipileConfig } from 'src/logic-functions/unipile-api/get-unipile-config.util';
import { type UnipileListedMessage } from 'src/logic-functions/unipile-api/types/unipile-listed-message.type';
import { type LinkedinWorkingPerson } from 'src/logic-functions/types/linkedin-person-record.type';
import { type StoredLinkedinMessage } from 'src/logic-functions/types/stored-linkedin-message.type';

export type SyncLinkedinMessagesResult = {
  messagesFetched: number;
  peopleUpdated: number;
};

const fetchAllUnipileMessages = async (
  config: UnipileConfig,
  after: string | undefined,
): Promise<UnipileListedMessage[]> => {
  const messages: UnipileListedMessage[] = [];
  let cursor: string | undefined;

  do {
    const page = await listUnipileMessages(config, { after, cursor });

    messages.push(...page.items);
    cursor = page.cursor ?? undefined;
  } while (isNonEmptyString(cursor));

  return messages;
};

const groupByChatId = (
  messages: UnipileListedMessage[],
): Map<string, UnipileListedMessage[]> => {
  const groups = new Map<string, UnipileListedMessage[]>();

  for (const message of messages) {
    const group = groups.get(message.chat_id);

    if (group === undefined) {
      groups.set(message.chat_id, [message]);
    } else {
      group.push(message);
    }
  }

  return groups;
};

const toStoredMessages = (
  messages: UnipileListedMessage[],
): StoredLinkedinMessage[] =>
  messages.map((message) => ({
    id: message.id,
    at: message.timestamp,
    direction: deriveDirectionFromListedMessage(message),
    text: message.text,
  }));

export const syncLinkedinMessages = async ({
  client,
  config,
  workingSet,
  chatIdIndex,
  memberIdIndex,
}: {
  client: CoreApiClient;
  config: UnipileConfig;
  workingSet: Map<string, LinkedinWorkingPerson>;
  chatIdIndex: Map<string, LinkedinWorkingPerson>;
  memberIdIndex: Map<string, LinkedinWorkingPerson>;
}): Promise<SyncLinkedinMessagesResult> => {
  const after = (await kv.get<string>(LINKEDIN_MESSAGES_AFTER_KV_KEY)) ?? undefined;
  const messages = await fetchAllUnipileMessages(config, after);

  if (messages.length === 0) {
    return { messagesFetched: 0, peopleUpdated: 0 };
  }

  const messagesByChatId = groupByChatId(messages);
  const touchedPersonIds = new Set<string>();

  for (const [chatId, chatMessages] of messagesByChatId) {
    const personId = await resolveLinkedinChatPersonId({
      client,
      config,
      chatId,
      chatIdIndex,
      memberIdIndex,
    });

    if (personId === null) {
      continue;
    }

    const working = workingSet.get(personId);

    if (working === undefined) {
      continue;
    }

    if (working.linkedinChatId !== chatId) {
      applyLinkedinPersonPatch(working, { linkedinChatId: chatId });
      chatIdIndex.set(chatId, working);
    }

    await applyLinkedinMessagesToPerson({
      client,
      working,
      chatId,
      messages: toStoredMessages(chatMessages),
    });

    touchedPersonIds.add(personId);
  }

  const newestTimestamp = messages.reduce<string | undefined>(
    (latest, message) =>
      latest === undefined || message.timestamp > latest
        ? message.timestamp
        : latest,
    undefined,
  );

  if (newestTimestamp !== undefined) {
    await kv.set(LINKEDIN_MESSAGES_AFTER_KV_KEY, newestTimestamp);
  }

  return {
    messagesFetched: messages.length,
    peopleUpdated: touchedPersonIds.size,
  };
};
