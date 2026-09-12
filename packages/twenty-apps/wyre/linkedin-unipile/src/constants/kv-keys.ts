// SERVER scope: shared across every workspace, keyed by the external Unipile
// account id so the webhook resolver can find the owning workspace.
export const buildUnipileAccountClaimKvKey = (accountId: string): string =>
  `unipile:account-claim:${accountId}`;

export const UNIPILE_ACCOUNT_STATUS_KV_KEY = 'unipile:account-status';

// WORKSPACE scope from here down.
export const LINKEDIN_NEXT_RECONCILE_AT_KV_KEY = 'linkedin:next-reconcile-at';
export const LINKEDIN_MESSAGES_AFTER_KV_KEY = 'linkedin:messages-after';
export const LINKEDIN_BACKFILL_VERSION_KV_KEY = 'linkedin:backfill-version';

export const buildLinkedinMessagesKvKey = (personId: string): string =>
  `linkedin:messages:${personId}`;

export const buildLinkedinChatKvKey = (chatId: string): string =>
  `linkedin:chat:${chatId}`;

export const buildLinkedinLookupFailedKvKey = (personId: string): string =>
  `linkedin:lookup-failed:${personId}`;
