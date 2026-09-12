import { type ChatAttendee } from 'src/domain/mappers/map-conversations-to-chats.util';
import { type UnipileAccountStatusWebhookPayload } from 'src/domain/unipile/unipile-account-status-webhook.type';
import { type UnipileListedMessage } from 'src/domain/unipile/unipile-listed-message.type';
import { type UnipileMessageReceivedWebhookPayload } from 'src/domain/unipile/unipile-message-received-webhook.type';
import { type UnipileNewRelationWebhookPayload } from 'src/domain/unipile/unipile-new-relation-webhook.type';
import { type UnipileRelation } from 'src/domain/unipile/unipile-relation.type';
import { type UnipileWebhookAttendee } from 'src/domain/unipile/unipile-webhook-attendee.type';

const toWebhookAttendee = (attendee: ChatAttendee): UnipileWebhookAttendee => ({
  attendee_id: attendee.providerId,
  attendee_name: attendee.name,
  attendee_provider_id: attendee.providerId,
  attendee_profile_url:
    attendee.profileUrl ??
    (attendee.publicIdentifier === null ? null : `https://www.linkedin.com/in/${attendee.publicIdentifier}/`),
});

export const buildMessageReceivedPayload = ({
  accountId,
  ownProviderId,
  message,
  attendees,
}: {
  accountId: string;
  ownProviderId: string;
  message: UnipileListedMessage;
  attendees: ChatAttendee[];
}): UnipileMessageReceivedWebhookPayload => {
  const webhookAttendees = attendees.map(toWebhookAttendee);
  const senderProviderId = message.sender_attendee_id ?? message.sender_id ?? '';
  const sender = webhookAttendees.find(
    (attendee) => attendee.attendee_provider_id === senderProviderId,
  ) ?? {
    attendee_id: senderProviderId,
    attendee_name: null,
    attendee_provider_id: senderProviderId,
    attendee_profile_url: null,
  };

  return {
    event: 'message_received',
    account_id: accountId,
    account_type: 'LINKEDIN',
    chat_id: message.chat_id,
    message_id: message.id,
    message: message.text,
    timestamp: message.timestamp,
    sender,
    attendees: webhookAttendees,
    account_info: { user_id: ownProviderId },
  };
};

export const buildNewRelationPayload = ({
  accountId,
  relation,
}: {
  accountId: string;
  relation: UnipileRelation;
}): UnipileNewRelationWebhookPayload => {
  const fullName = [relation.first_name, relation.last_name].filter((part) => part !== null).join(' ');

  return {
    event: 'new_relation',
    account_id: accountId,
    user_full_name: fullName === '' ? null : fullName,
    user_provider_id: relation.member_id,
    user_public_identifier: relation.public_identifier,
  };
};

export const buildAccountStatusPayload = ({
  accountId,
  message,
}: {
  accountId: string;
  message: string;
}): UnipileAccountStatusWebhookPayload => ({
  account_id: accountId,
  message,
});
