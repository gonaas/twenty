import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-sdk/utils';

import { normalizeLinkedinIdentifier } from 'src/logic-functions/domain/normalize-linkedin-identifier';
import { type LushaPersonRecord } from 'src/logic-functions/types/lusha-person-record.type';

export type ExistingPersonIndex = {
  byLushaContactId: Map<string, LushaPersonRecord>;
  byNormalizedLinkedinIdentifier: Map<string, LushaPersonRecord>;
};

export type ExistingPersonMatch = {
  person: LushaPersonRecord;
  matchedBy: 'lushaContactId' | 'linkedinIdentifier';
};

export const buildExistingPersonIndex = (
  people: LushaPersonRecord[],
): ExistingPersonIndex => {
  const byLushaContactId = new Map<string, LushaPersonRecord>();
  const byNormalizedLinkedinIdentifier = new Map<string, LushaPersonRecord>();

  for (const person of people) {
    if (isNonEmptyString(person.lushaContactId)) {
      byLushaContactId.set(person.lushaContactId, person);
    }

    if (isNonEmptyString(person.linkedinLinkUrl)) {
      byNormalizedLinkedinIdentifier.set(
        normalizeLinkedinIdentifier(person.linkedinLinkUrl),
        person,
      );
    }
  }

  return { byLushaContactId, byNormalizedLinkedinIdentifier };
};

// Two keys, in this order: the Lusha id is the only one that survives a
// person renaming their vanity URL, and the normalized slug catches people a
// human or the LinkedIn (Unipile) app added before this app ever saw them.
export const resolveExistingPerson = ({
  index,
  lushaContactId,
  normalizedLinkedinIdentifier,
}: {
  index: ExistingPersonIndex;
  lushaContactId: string | null;
  normalizedLinkedinIdentifier: string;
}): ExistingPersonMatch | null => {
  const byContactId = isNonEmptyString(lushaContactId)
    ? index.byLushaContactId.get(lushaContactId)
    : undefined;

  if (isDefined(byContactId)) {
    return { person: byContactId, matchedBy: 'lushaContactId' };
  }

  const bySlug = index.byNormalizedLinkedinIdentifier.get(
    normalizedLinkedinIdentifier,
  );

  return isDefined(bySlug)
    ? { person: bySlug, matchedBy: 'linkedinIdentifier' }
    : null;
};

export const addPersonToIndex = (
  index: ExistingPersonIndex,
  person: LushaPersonRecord,
): void => {
  if (isNonEmptyString(person.lushaContactId)) {
    index.byLushaContactId.set(person.lushaContactId, person);
  }

  if (isNonEmptyString(person.linkedinLinkUrl)) {
    index.byNormalizedLinkedinIdentifier.set(
      normalizeLinkedinIdentifier(person.linkedinLinkUrl),
      person,
    );
  }
};
