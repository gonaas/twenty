import { type CoreApiClient } from 'twenty-client-sdk/core';

import { normalizeLinkedinIdentifier } from 'src/logic-functions/domain/normalize-linkedin-identifier';
import { fetchLinkedinPeople } from 'src/logic-functions/data/fetch-linkedin-people.util';

// Fallback match for a webhook that only carries a public identifier and no
// LinkedIn member id yet: the dataset is small, so a linear scan over the
// already-loaded people is simpler than inventing a server-side filter for a
// value the server stores unnormalized.
export const findPersonIdByNormalizedIdentifier = async (
  client: CoreApiClient,
  identifier: string,
): Promise<string | null> => {
  const normalizedTarget = normalizeLinkedinIdentifier(identifier);
  const people = await fetchLinkedinPeople(client);

  const match = people.find(
    (person) =>
      person.linkedinLinkUrl !== null &&
      normalizeLinkedinIdentifier(person.linkedinLinkUrl) === normalizedTarget,
  );

  return match?.id ?? null;
};
