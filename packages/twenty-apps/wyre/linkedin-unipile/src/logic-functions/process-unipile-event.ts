import { isNonEmptyString } from '@sniptt/guards';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction } from 'twenty-sdk/define';
import { kv } from 'twenty-sdk/logic-function';

import { UNIPILE_ACCOUNT_STATUS_KV_KEY } from 'src/constants/kv-keys';
import { PROCESS_UNIPILE_EVENT_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { advanceLinkedinStatus } from 'src/logic-functions/domain/advance-linkedin-status';
import { deriveMessageDirection } from 'src/logic-functions/domain/derive-message-direction';
import { normalizeLinkedinIdentifier } from 'src/logic-functions/domain/normalize-linkedin-identifier';
import { fetchLinkedinPersonById } from 'src/logic-functions/data/fetch-linkedin-person-by-id.util';
import { findPersonIdByLinkedinMemberId } from 'src/logic-functions/data/find-person-id-by-linkedin-member-id.util';
import { findPersonIdByNormalizedIdentifier } from 'src/logic-functions/data/find-person-id-by-normalized-identifier.util';
import { toLinkedinWorkingPerson } from 'src/logic-functions/data/linkedin-working-set.util';
import { updateLinkedinPerson } from 'src/logic-functions/data/update-linkedin-person.util';
import { applyLinkedinMessagesToPerson } from 'src/logic-functions/flows/apply-linkedin-messages-to-person.util';
import { resolveLinkedinChatPersonId } from 'src/logic-functions/flows/resolve-linkedin-chat-person-id.util';
import { getUnipileConfig } from 'src/logic-functions/unipile-api/get-unipile-config.util';
import { type UnipileAccountStatusWebhookPayload } from 'src/logic-functions/unipile-api/types/unipile-account-status-webhook.type';
import { type UnipileMessageReceivedWebhookPayload } from 'src/logic-functions/unipile-api/types/unipile-message-received-webhook.type';
import { type UnipileNewRelationWebhookPayload } from 'src/logic-functions/unipile-api/types/unipile-new-relation-webhook.type';
import { type UnipileWebhookEventPayload } from 'src/logic-functions/unipile-api/types/unipile-webhook-event.type';

type ProcessUnipileEventResult =
  | { updatedPersonId: string }
  | { ignored: true; reason: string }
  | { accountStatus: string };

const handleMessageReceived = async (
  payload: UnipileMessageReceivedWebhookPayload,
): Promise<ProcessUnipileEventResult> => {
  const client = new CoreApiClient();
  const config = getUnipileConfig();
  const direction = deriveMessageDirection({
    sender: payload.sender,
    accountInfo: payload.account_info,
  });

  const personId = await resolveLinkedinChatPersonId({
    client,
    config,
    chatId: payload.chat_id,
  });

  if (personId === null) {
    return { ignored: true, reason: 'unresolved chat' };
  }

  const person = await fetchLinkedinPersonById(client, personId);

  if (person === null) {
    return { ignored: true, reason: 'person not found' };
  }

  const working = toLinkedinWorkingPerson(person);

  await applyLinkedinMessagesToPerson({
    client,
    working,
    chatId: payload.chat_id,
    messages: [
      {
        id: payload.message_id,
        at: payload.timestamp,
        direction,
        text: payload.message,
      },
    ],
  });

  await updateLinkedinPerson({
    client,
    personId,
    data: { ...working.pendingUpdate, linkedinSyncedAt: new Date().toISOString() },
  });

  return { updatedPersonId: personId };
};

const handleNewRelation = async (
  payload: UnipileNewRelationWebhookPayload,
): Promise<ProcessUnipileEventResult> => {
  const client = new CoreApiClient();
  const now = new Date();

  const personId =
    (await findPersonIdByLinkedinMemberId(client, payload.user_provider_id)) ??
    (isNonEmptyString(payload.user_public_identifier)
      ? await findPersonIdByNormalizedIdentifier(
          client,
          normalizeLinkedinIdentifier(payload.user_public_identifier),
        )
      : null);

  if (personId === null) {
    return { ignored: true, reason: 'unmatched relation' };
  }

  const person = await fetchLinkedinPersonById(client, personId);

  if (person === null) {
    return { ignored: true, reason: 'person not found' };
  }

  await updateLinkedinPerson({
    client,
    personId,
    data: {
      linkedinConnection: 'CONNECTED',
      linkedinConnectedAt: now.toISOString(),
      linkedinMemberId: payload.user_provider_id,
      linkedinStatus: advanceLinkedinStatus(person.linkedinStatus, 'ACCEPTED'),
      linkedinSyncedAt: now.toISOString(),
    },
  });

  return { updatedPersonId: personId };
};

const handleAccountStatus = async (
  payload: UnipileAccountStatusWebhookPayload,
): Promise<ProcessUnipileEventResult> => {
  await kv.set(UNIPILE_ACCOUNT_STATUS_KV_KEY, {
    accountId: payload.account_id,
    message: payload.message,
    receivedAt: new Date().toISOString(),
  });

  if (process.env.NODE_ENV !== 'test') {
    console.warn(`[linkedin-unipile] Unipile account status: ${payload.message}`);
  }

  return { accountStatus: payload.message };
};

export const processUnipileEventHandler = async (
  payload: UnipileWebhookEventPayload,
): Promise<ProcessUnipileEventResult> => {
  if (payload.event === 'message_received') {
    return handleMessageReceived(payload);
  }

  if (payload.event === 'new_relation') {
    return handleNewRelation(payload);
  }

  if (isNonEmptyString(payload.message)) {
    return handleAccountStatus(payload);
  }

  return { ignored: true, reason: 'unrecognized event' };
};

export default defineLogicFunction({
  universalIdentifier: PROCESS_UNIPILE_EVENT_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'process-unipile-event',
  description:
    'Applies one Unipile webhook event (a message, a new relation, or an account status change) to the matching person.',
  timeoutSeconds: 120,
  handler: processUnipileEventHandler,
});
