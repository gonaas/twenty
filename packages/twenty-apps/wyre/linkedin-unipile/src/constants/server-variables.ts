export const UNIPILE_DSN_ENV_VAR_NAME = 'UNIPILE_DSN';
export const UNIPILE_API_KEY_ENV_VAR_NAME = 'UNIPILE_API_KEY';
export const UNIPILE_ACCOUNT_ID_ENV_VAR_NAME = 'UNIPILE_ACCOUNT_ID';
export const UNIPILE_WEBHOOK_SECRET_ENV_VAR_NAME = 'UNIPILE_WEBHOOK_SECRET';
export const LINKEDIN_PROFILE_LOOKUPS_PER_RUN_ENV_VAR_NAME =
  'LINKEDIN_PROFILE_LOOKUPS_PER_RUN';

export const DEFAULT_LINKEDIN_PROFILE_LOOKUPS_PER_RUN = 25;

// How far back the first reconcile after install looks for messages.
export const LINKEDIN_BACKFILL_WINDOW_DAYS = 90;

// Bump when a deployed fix needs every workspace to re-scan the backfill
// window; the next cron tick then runs a full backfill regardless of jitter.
export const LINKEDIN_BACKFILL_VERSION = 2;

// Skip re-attempting a failed profile lookup (for example a 404) for this long.
export const LINKEDIN_LOOKUP_RETRY_AFTER_HOURS = 24;

// Stored messages per person are capped at the most recent of this many.
export const LINKEDIN_MESSAGE_HISTORY_LIMIT = 500;
