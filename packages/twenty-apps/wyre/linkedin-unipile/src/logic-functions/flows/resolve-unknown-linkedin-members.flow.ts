import { isNonEmptyString } from '@sniptt/guards';
import { kv } from 'twenty-sdk/logic-function';

import { LINKEDIN_LOOKUP_RETRY_AFTER_HOURS } from 'src/constants/server-variables';
import { buildLinkedinLookupFailedKvKey } from 'src/constants/kv-keys';
import { advanceLinkedinStatus } from 'src/logic-functions/domain/advance-linkedin-status';
import { mapProfileToConnection } from 'src/logic-functions/domain/map-profile-to-connection';
import { normalizeLinkedinIdentifier } from 'src/logic-functions/domain/normalize-linkedin-identifier';
import { applyLinkedinPersonPatch } from 'src/logic-functions/data/linkedin-working-set.util';
import { getUnipileUser } from 'src/logic-functions/unipile-api/get-user';
import { type UnipileConfig } from 'src/logic-functions/unipile-api/get-unipile-config.util';
import { type LinkedinWorkingPerson } from 'src/logic-functions/types/linkedin-person-record.type';

export type ResolveUnknownLinkedinMembersResult = {
  attempted: number;
  resolved: number;
  failed: number;
};

type LookupFailure = { retryAfter: string };

const isStillBackingOff = (failure: LookupFailure | null, now: Date): boolean =>
  failure !== null && new Date(failure.retryAfter) > now;

export const resolveUnknownLinkedinMembers = async ({
  config,
  workingSet,
  memberIdIndex,
  now,
  limit,
}: {
  config: UnipileConfig;
  workingSet: Map<string, LinkedinWorkingPerson>;
  memberIdIndex: Map<string, LinkedinWorkingPerson>;
  now: Date;
  limit: number;
}): Promise<ResolveUnknownLinkedinMembersResult> => {
  const candidates = Array.from(workingSet.values()).filter(
    (person) =>
      !isNonEmptyString(person.linkedinMemberId) &&
      isNonEmptyString(person.linkedinLinkUrl),
  );

  let attempted = 0;
  let resolved = 0;
  let failed = 0;

  for (const person of candidates) {
    if (attempted >= limit) {
      break;
    }

    const lookupFailedKey = buildLinkedinLookupFailedKvKey(person.id);
    const failure = await kv.get<LookupFailure>(lookupFailedKey);

    if (isStillBackingOff(failure, now)) {
      continue;
    }

    attempted += 1;

    try {
      const identifier = normalizeLinkedinIdentifier(person.linkedinLinkUrl as string);
      const profile = await getUnipileUser(config, identifier);
      const connection = mapProfileToConnection({
        networkDistance: profile.network_distance,
        invitation: profile.invitation,
      });

      const patch: Record<string, unknown> = {
        linkedinMemberId: profile.provider_id,
        linkedinConnection: connection,
      };

      if (connection === 'CONNECTED') {
        patch.linkedinConnectedAt = person.linkedinConnectedAt ?? now.toISOString();
        patch.linkedinStatus = advanceLinkedinStatus(person.linkedinStatus, 'ACCEPTED');
      } else if (connection === 'INVITATION_SENT') {
        patch.linkedinStatus = advanceLinkedinStatus(person.linkedinStatus, 'CONNECTED');
      }

      applyLinkedinPersonPatch(person, patch);
      memberIdIndex.set(profile.provider_id, person);
      await kv.delete(lookupFailedKey);
      resolved += 1;
    } catch {
      failed += 1;

      const retryAfter = new Date(
        now.getTime() + LINKEDIN_LOOKUP_RETRY_AFTER_HOURS * 60 * 60 * 1000,
      );

      await kv.set(lookupFailedKey, { retryAfter: retryAfter.toISOString() });
    }
  }

  return { attempted, resolved, failed };
};
