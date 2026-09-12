import { isNonEmptyString } from '@sniptt/guards';
import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction } from 'twenty-sdk/define';
import { kv } from 'twenty-sdk/logic-function';

import {
  LINKEDIN_BACKFILL_VERSION_KV_KEY,
  LINKEDIN_MESSAGES_AFTER_KV_KEY,
  LINKEDIN_NEXT_RECONCILE_AT_KV_KEY,
  buildUnipileAccountClaimKvKey,
} from 'src/constants/kv-keys';
import {
  DEFAULT_LINKEDIN_PROFILE_LOOKUPS_PER_RUN,
  LINKEDIN_BACKFILL_VERSION,
  LINKEDIN_BACKFILL_WINDOW_DAYS,
  LINKEDIN_PROFILE_LOOKUPS_PER_RUN_ENV_VAR_NAME,
} from 'src/constants/server-variables';
import { RECONCILE_LINKEDIN_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { computeReconcileJitter } from 'src/logic-functions/domain/compute-reconcile-jitter';
import { fetchLinkedinPeople } from 'src/logic-functions/data/fetch-linkedin-people.util';
import { getCurrentWorkspaceId } from 'src/logic-functions/data/get-current-workspace-id.util';
import {
  buildLinkedinWorkingIndexes,
  buildLinkedinWorkingSet,
} from 'src/logic-functions/data/linkedin-working-set.util';
import { persistTouchedLinkedinPeople } from 'src/logic-functions/flows/persist-touched-linkedin-people.flow';
import { resolveUnknownLinkedinMembers } from 'src/logic-functions/flows/resolve-unknown-linkedin-members.flow';
import { syncLinkedinMessages } from 'src/logic-functions/flows/sync-linkedin-messages.flow';
import { syncLinkedinRelations } from 'src/logic-functions/flows/sync-linkedin-relations.flow';
import { syncLinkedinSentInvitations } from 'src/logic-functions/flows/sync-linkedin-sent-invitations.flow';
import { getUnipileConfig } from 'src/logic-functions/unipile-api/get-unipile-config.util';
import { buildStepFailure, type StepFailure } from 'src/logic-functions/utils/build-step-failure.util';

type ReconcileLinkedinPayload = { fullBackfill?: boolean };

type ReconcileLinkedinSummary =
  | { skipped: true; reason: string }
  | {
      peopleLoaded: number;
      relations: Awaited<ReturnType<typeof syncLinkedinRelations>> | StepFailure;
      sentInvitations:
        | Awaited<ReturnType<typeof syncLinkedinSentInvitations>>
        | StepFailure;
      messages: Awaited<ReturnType<typeof syncLinkedinMessages>> | StepFailure;
      unknownMemberLookups:
        | Awaited<ReturnType<typeof resolveUnknownLinkedinMembers>>
        | StepFailure;
      persisted:
        | Awaited<ReturnType<typeof persistTouchedLinkedinPeople>>
        | StepFailure;
    };

const runStep = async <TResult>(
  label: string,
  step: () => Promise<TResult>,
): Promise<TResult | StepFailure> => {
  try {
    return await step();
  } catch (error) {
    return buildStepFailure(label, error);
  }
};

// Zero is a valid setting: it disables profile lookups entirely, which is what
// a workspace full of placeholder LinkedIn URLs needs.
const getLinkedinProfileLookupsPerRun = (): number => {
  const rawValue = process.env[LINKEDIN_PROFILE_LOOKUPS_PER_RUN_ENV_VAR_NAME];

  if (rawValue === undefined || rawValue.trim() === '') {
    return DEFAULT_LINKEDIN_PROFILE_LOOKUPS_PER_RUN;
  }

  const parsedValue = Number(rawValue);

  return Number.isInteger(parsedValue) && parsedValue >= 0
    ? parsedValue
    : DEFAULT_LINKEDIN_PROFILE_LOOKUPS_PER_RUN;
};

export const reconcileLinkedinHandler = async (
  payload: ReconcileLinkedinPayload = {},
): Promise<ReconcileLinkedinSummary> => {
  const now = new Date();
  const nextReconcileAt = await kv.get<string>(LINKEDIN_NEXT_RECONCILE_AT_KV_KEY);
  const appliedBackfillVersion = await kv.get<number>(
    LINKEDIN_BACKFILL_VERSION_KV_KEY,
  );
  const fullBackfill =
    payload.fullBackfill === true ||
    appliedBackfillVersion !== LINKEDIN_BACKFILL_VERSION;

  if (
    !fullBackfill &&
    isNonEmptyString(nextReconcileAt) &&
    new Date(nextReconcileAt) > now
  ) {
    return { skipped: true, reason: 'not due yet' };
  }

  // A full backfill rewinds the message cursor so people added after the
  // first run still get their history; message ids are deduped, so it is safe.
  if (fullBackfill) {
    const backfillWindowMs = LINKEDIN_BACKFILL_WINDOW_DAYS * 24 * 60 * 60 * 1000;

    await kv.set(
      LINKEDIN_MESSAGES_AFTER_KV_KEY,
      new Date(now.getTime() - backfillWindowMs).toISOString(),
    );
  }

  const client = new CoreApiClient();
  const config = getUnipileConfig();

  // Best effort: refreshes the SERVER-scope claim once the admin has
  // configured server variables, in case post-install ran before that.
  const workspaceId = getCurrentWorkspaceId();

  if (isNonEmptyString(workspaceId)) {
    await kv.set(buildUnipileAccountClaimKvKey(config.accountId), workspaceId, {
      scope: 'SERVER',
    });
  }

  const people = await fetchLinkedinPeople(client);
  const workingSet = buildLinkedinWorkingSet(people);
  const { memberIdIndex, identifierIndex, chatIdIndex } =
    buildLinkedinWorkingIndexes(workingSet);

  const relations = await runStep('sync relations', () =>
    syncLinkedinRelations({ config, memberIdIndex, identifierIndex }),
  );
  const sentInvitations = await runStep('sync sent invitations', () =>
    syncLinkedinSentInvitations({ config, memberIdIndex, identifierIndex }),
  );
  // Lookups run before messages so chats of people resolved in this run can
  // be attributed before the message cursor moves past them.
  const unknownMemberLookups = await runStep('resolve unknown members', () =>
    resolveUnknownLinkedinMembers({
      config,
      workingSet,
      memberIdIndex,
      now,
      limit: getLinkedinProfileLookupsPerRun(),
    }),
  );
  const messages = await runStep('sync messages', () =>
    syncLinkedinMessages({
      client,
      config,
      workingSet,
      chatIdIndex,
      memberIdIndex,
    }),
  );
  const persisted = await runStep('persist touched people', () =>
    persistTouchedLinkedinPeople({ client, workingSet, now }),
  );

  await kv.set(
    LINKEDIN_NEXT_RECONCILE_AT_KV_KEY,
    computeReconcileJitter(now).toISOString(),
  );
  await kv.set(LINKEDIN_BACKFILL_VERSION_KV_KEY, LINKEDIN_BACKFILL_VERSION);

  return {
    peopleLoaded: people.length,
    relations,
    sentInvitations,
    messages,
    unknownMemberLookups,
    persisted,
  };
};

export default defineLogicFunction({
  universalIdentifier: RECONCILE_LINKEDIN_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'reconcile-linkedin',
  description:
    'Syncs LinkedIn connections, invitations, and messages from Unipile onto People, advancing Linkedin Status.',
  timeoutSeconds: 600,
  handler: reconcileLinkedinHandler,
  cronTriggerSettings: {
    pattern: '*/30 * * * *',
  },
});
