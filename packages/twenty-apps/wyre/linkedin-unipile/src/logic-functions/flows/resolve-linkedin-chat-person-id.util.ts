import { isNonEmptyString } from '@sniptt/guards';
import { type CoreApiClient } from 'twenty-client-sdk/core';
import { kv } from 'twenty-sdk/logic-function';

import { buildLinkedinChatKvKey } from 'src/constants/kv-keys';
import { findPersonIdByLinkedinMemberId } from 'src/logic-functions/data/find-person-id-by-linkedin-member-id.util';
import { getUnipileChat } from 'src/logic-functions/unipile-api/get-chat';
import { type UnipileConfig } from 'src/logic-functions/unipile-api/get-unipile-config.util';
import { type LinkedinWorkingPerson } from 'src/logic-functions/types/linkedin-person-record.type';

// Resolves which person a chat belongs to, checking (in order) the
// already-loaded working set's linkedinChatId, the kv cache from a previous
// run, and finally the Unipile chats API (whose result gets cached in kv).
// The attendee is matched against the in-memory member index before the
// database because member ids assigned earlier in the same run are not
// persisted yet. Returns null for a chat this app cannot or should not
// attribute, such as a group chat (missing attendee_provider_id).
export const resolveLinkedinChatPersonId = async ({
  client,
  config,
  chatId,
  chatIdIndex,
  memberIdIndex,
}: {
  client: CoreApiClient;
  config: UnipileConfig;
  chatId: string;
  chatIdIndex?: Map<string, LinkedinWorkingPerson>;
  memberIdIndex?: Map<string, LinkedinWorkingPerson>;
}): Promise<string | null> => {
  const byWorkingSetField = chatIdIndex?.get(chatId);

  if (byWorkingSetField !== undefined) {
    return byWorkingSetField.id;
  }

  const cachedPersonId = await kv.get<string>(buildLinkedinChatKvKey(chatId));

  if (isNonEmptyString(cachedPersonId)) {
    return cachedPersonId;
  }

  const chat = await getUnipileChat(config, chatId);

  if (!isNonEmptyString(chat.attendee_provider_id)) {
    return null;
  }

  const byMemberIndex = memberIdIndex?.get(chat.attendee_provider_id);

  if (byMemberIndex !== undefined) {
    await kv.set(buildLinkedinChatKvKey(chatId), byMemberIndex.id);

    return byMemberIndex.id;
  }

  const personId = await findPersonIdByLinkedinMemberId(
    client,
    chat.attendee_provider_id,
  );

  if (personId === null) {
    return null;
  }

  await kv.set(buildLinkedinChatKvKey(chatId), personId);

  return personId;
};
