import { isNonEmptyString } from '@sniptt/guards';

import { advanceLinkedinStatus } from 'src/logic-functions/domain/advance-linkedin-status';
import { normalizeLinkedinIdentifier } from 'src/logic-functions/domain/normalize-linkedin-identifier';
import { toIsoTimestamp } from 'src/logic-functions/domain/to-iso-timestamp';
import { applyLinkedinPersonPatch } from 'src/logic-functions/data/linkedin-working-set.util';
import { listUnipileRelations } from 'src/logic-functions/unipile-api/list-relations';
import { type UnipileConfig } from 'src/logic-functions/unipile-api/get-unipile-config.util';
import { type LinkedinWorkingPerson } from 'src/logic-functions/types/linkedin-person-record.type';

export type SyncLinkedinRelationsResult = { matched: number };

// GET /users/relations lists first-degree connections; a match means the
// invitation is accepted, so the relationship is at least ACCEPTED.
export const syncLinkedinRelations = async ({
  config,
  memberIdIndex,
  identifierIndex,
}: {
  config: UnipileConfig;
  memberIdIndex: Map<string, LinkedinWorkingPerson>;
  identifierIndex: Map<string, LinkedinWorkingPerson>;
}): Promise<SyncLinkedinRelationsResult> => {
  let cursor: string | undefined;
  let matched = 0;

  do {
    const page = await listUnipileRelations(config, cursor);

    for (const relation of page.items) {
      const working =
        memberIdIndex.get(relation.member_id) ??
        (isNonEmptyString(relation.public_identifier)
          ? identifierIndex.get(
              normalizeLinkedinIdentifier(relation.public_identifier),
            )
          : undefined) ??
        (isNonEmptyString(relation.public_profile_url)
          ? identifierIndex.get(
              normalizeLinkedinIdentifier(relation.public_profile_url),
            )
          : undefined);

      if (working === undefined) {
        continue;
      }

      const connectedAt = toIsoTimestamp(relation.created_at);

      applyLinkedinPersonPatch(working, {
        linkedinConnection: 'CONNECTED',
        ...(connectedAt !== null ? { linkedinConnectedAt: connectedAt } : {}),
        linkedinMemberId: relation.member_id,
        linkedinStatus: advanceLinkedinStatus(working.linkedinStatus, 'ACCEPTED'),
      });

      memberIdIndex.set(relation.member_id, working);
      matched += 1;
    }

    cursor = page.cursor ?? undefined;
  } while (isNonEmptyString(cursor));

  return { matched };
};
