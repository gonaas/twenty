import { type CoreApiClient } from 'twenty-client-sdk/core';

import { updateLinkedinPerson } from 'src/logic-functions/data/update-linkedin-person.util';
import { type LinkedinWorkingPerson } from 'src/logic-functions/types/linkedin-person-record.type';

export type PersistTouchedLinkedinPeopleResult = { updated: number };

// One updatePerson mutation per touched person, sequential, combining
// whatever every earlier step accumulated on it.
export const persistTouchedLinkedinPeople = async ({
  client,
  workingSet,
  now,
}: {
  client: CoreApiClient;
  workingSet: Map<string, LinkedinWorkingPerson>;
  now: Date;
}): Promise<PersistTouchedLinkedinPeopleResult> => {
  let updated = 0;

  for (const working of workingSet.values()) {
    if (Object.keys(working.pendingUpdate).length === 0) {
      continue;
    }

    await updateLinkedinPerson({
      client,
      personId: working.id,
      data: { ...working.pendingUpdate, linkedinSyncedAt: now.toISOString() },
    });

    updated += 1;
  }

  return { updated };
};
