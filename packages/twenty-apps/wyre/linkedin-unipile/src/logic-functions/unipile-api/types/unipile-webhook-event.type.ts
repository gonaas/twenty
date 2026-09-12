import { type UnipileAccountStatusWebhookPayload } from 'src/logic-functions/unipile-api/types/unipile-account-status-webhook.type';
import { type UnipileMessageReceivedWebhookPayload } from 'src/logic-functions/unipile-api/types/unipile-message-received-webhook.type';
import { type UnipileNewRelationWebhookPayload } from 'src/logic-functions/unipile-api/types/unipile-new-relation-webhook.type';

export type UnipileWebhookEventPayload =
  | UnipileMessageReceivedWebhookPayload
  | UnipileNewRelationWebhookPayload
  | UnipileAccountStatusWebhookPayload;
