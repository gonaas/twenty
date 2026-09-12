import { isNonEmptyString } from '@sniptt/guards';
import { definePostInstallLogicFunction } from 'twenty-sdk/define';
import { enqueueJobs, kv } from 'twenty-sdk/logic-function';

import {
  LINKEDIN_MESSAGES_AFTER_KV_KEY,
  buildUnipileAccountClaimKvKey,
} from 'src/constants/kv-keys';
import {
  LINKEDIN_BACKFILL_WINDOW_DAYS,
  UNIPILE_ACCOUNT_ID_ENV_VAR_NAME,
} from 'src/constants/server-variables';
import {
  POST_INSTALL_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  RECONCILE_LINKEDIN_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { getCurrentWorkspaceId } from 'src/logic-functions/data/get-current-workspace-id.util';
import { buildRetryableStepFailure } from 'src/logic-functions/utils/build-step-failure.util';

const ENQUEUED_JOB_RETRY_LIMIT = 2;

type PostInstallResult = { reconcileEnqueued: true };

// The five server variables are set by the admin after install, so the
// account claim may not be writable yet; reconcile-linkedin refreshes it on
// every run once UNIPILE_ACCOUNT_ID is configured.
export const postInstallHandler = async (): Promise<PostInstallResult> => {
  try {
    const workspaceId = getCurrentWorkspaceId();
    const accountId = process.env[UNIPILE_ACCOUNT_ID_ENV_VAR_NAME]?.trim();

    if (isNonEmptyString(workspaceId) && isNonEmptyString(accountId)) {
      await kv.set(buildUnipileAccountClaimKvKey(accountId), workspaceId, {
        scope: 'SERVER',
      });
    }

    const backfillWindowMs =
      LINKEDIN_BACKFILL_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    const messagesAfter = new Date(Date.now() - backfillWindowMs);

    await kv.set(LINKEDIN_MESSAGES_AFTER_KV_KEY, messagesAfter.toISOString());

    await enqueueJobs({
      logicFunctionUniversalIdentifier:
        RECONCILE_LINKEDIN_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
      payloads: [{ fullBackfill: true }],
      retryLimit: ENQUEUED_JOB_RETRY_LIMIT,
    });
  } catch (error) {
    throw buildRetryableStepFailure('LinkedIn (Unipile) post-install', error);
  }

  return { reconcileEnqueued: true };
};

export default definePostInstallLogicFunction({
  universalIdentifier: POST_INSTALL_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'post-install',
  description:
    'Claims the Unipile account for this workspace, seeds the message backfill cursor, and enqueues the first reconcile.',
  timeoutSeconds: 30,
  handler: postInstallHandler,
});
