import { isNonEmptyString } from '@sniptt/guards';

import { normalizeLinkedinIdentifier } from 'src/logic-functions/domain/normalize-linkedin-identifier';
import {
  type LinkedinPersonRecord,
  type LinkedinWorkingPerson,
} from 'src/logic-functions/types/linkedin-person-record.type';

export type LinkedinWorkingIndexes = {
  memberIdIndex: Map<string, LinkedinWorkingPerson>;
  identifierIndex: Map<string, LinkedinWorkingPerson>;
  chatIdIndex: Map<string, LinkedinWorkingPerson>;
};

export const toLinkedinWorkingPerson = (
  person: LinkedinPersonRecord,
): LinkedinWorkingPerson => ({ ...person, pendingUpdate: {} });

export const buildLinkedinWorkingSet = (
  people: LinkedinPersonRecord[],
): Map<string, LinkedinWorkingPerson> =>
  new Map(people.map((person) => [person.id, toLinkedinWorkingPerson(person)]));

export const buildLinkedinWorkingIndexes = (
  workingSet: Map<string, LinkedinWorkingPerson>,
): LinkedinWorkingIndexes => {
  const memberIdIndex = new Map<string, LinkedinWorkingPerson>();
  const identifierIndex = new Map<string, LinkedinWorkingPerson>();
  const chatIdIndex = new Map<string, LinkedinWorkingPerson>();

  for (const person of workingSet.values()) {
    if (isNonEmptyString(person.linkedinMemberId)) {
      memberIdIndex.set(person.linkedinMemberId, person);
    }

    if (isNonEmptyString(person.linkedinLinkUrl)) {
      identifierIndex.set(
        normalizeLinkedinIdentifier(person.linkedinLinkUrl),
        person,
      );
    }

    if (isNonEmptyString(person.linkedinChatId)) {
      chatIdIndex.set(person.linkedinChatId, person);
    }
  }

  return { memberIdIndex, identifierIndex, chatIdIndex };
};

// Mutates the working person in place: subsequent matching in the same run
// sees the new field values, and the diff accumulates for one combined
// updatePerson call at the end of the run.
export const applyLinkedinPersonPatch = (
  working: LinkedinWorkingPerson,
  patch: Record<string, unknown>,
): void => {
  Object.assign(working, patch);
  Object.assign(working.pendingUpdate, patch);
};
