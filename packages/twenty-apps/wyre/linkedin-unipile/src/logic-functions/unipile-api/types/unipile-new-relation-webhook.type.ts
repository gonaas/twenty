export type UnipileNewRelationWebhookPayload = {
  event: 'new_relation';
  account_id: string;
  user_full_name: string | null;
  user_provider_id: string;
  user_public_identifier: string | null;
};
