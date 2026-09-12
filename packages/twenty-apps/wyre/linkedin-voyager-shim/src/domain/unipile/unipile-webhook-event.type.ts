import { type UnipileAccountStatusWebhookPayload } from 'src/domain/unipile/unipile-account-status-webhook.type';
import { type UnipileMessageReceivedWebhookPayload } from 'src/domain/unipile/unipile-message-received-webhook.type';
import { type UnipileNewRelationWebhookPayload } from 'src/domain/unipile/unipile-new-relation-webhook.type';

export type UnipileWebhookEventPayload =
  | UnipileMessageReceivedWebhookPayload
  | UnipileNewRelationWebhookPayload
  | UnipileAccountStatusWebhookPayload;
