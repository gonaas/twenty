import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-sdk/utils';

import { type MappedLushaPerson } from 'src/logic-functions/domain/map-lusha-row-to-person';
import { type LushaPersonRecord } from 'src/logic-functions/types/lusha-person-record.type';

// Fill-only-the-blanks. A Person matched here has usually been edited by a
// human or written by the LinkedIn (Unipile) app, and Lusha's copy is the
// older one, so every field already holding a value is left untouched. An
// empty result means there is nothing to send and the mutation is skipped.
export const buildPersonUpdateInput = ({
  existing,
  person,
  companyId,
}: {
  existing: LushaPersonRecord;
  person: MappedLushaPerson;
  companyId: string | undefined;
}): Record<string, unknown> => {
  const input: Record<string, unknown> = {};

  if (
    isNonEmptyString(person.lushaContactId) &&
    !isNonEmptyString(existing.lushaContactId)
  ) {
    input.lushaContactId = person.lushaContactId;
  }

  if (!isNonEmptyString(existing.linkedinLinkUrl)) {
    input.linkedinLink = { primaryLinkUrl: person.linkedinUrl };
  }

  // The name composite is written as a whole, so it is only safe to send when
  // both halves are currently empty.
  if (
    !isNonEmptyString(existing.firstName) &&
    !isNonEmptyString(existing.lastName) &&
    (isNonEmptyString(person.firstName) || isNonEmptyString(person.lastName))
  ) {
    input.name = { firstName: person.firstName, lastName: person.lastName };
  }

  if (
    isNonEmptyString(person.jobTitle) &&
    !isNonEmptyString(existing.jobTitle)
  ) {
    input.jobTitle = person.jobTitle;
  }

  if (
    isNonEmptyString(person.primaryEmail) &&
    !isNonEmptyString(existing.primaryEmail)
  ) {
    // additionalEmails is deliberately left out: Twenty writes every sub-key
    // present in a composite, and this app never reads the existing list, so
    // sending it would replace whatever a human collected with Lusha's copy.
    // Only the empty primaryEmail is being filled in.
    input.emails = { primaryEmail: person.primaryEmail };
  }

  if (
    isNonEmptyString(person.primaryPhoneNumber) &&
    !isNonEmptyString(existing.primaryPhoneNumber)
  ) {
    input.phones = {
      primaryPhoneNumber: person.primaryPhoneNumber,
      primaryPhoneCallingCode: person.primaryPhoneCallingCode ?? '',
    };
  }

  if (isDefined(companyId) && !isNonEmptyString(existing.companyId)) {
    input.companyId = companyId;
  }

  return input;
};

// What the record looks like once the update above has landed. The run keeps
// its in-memory index on this, so a profile listed twice in one table is
// compared against what the first row already wrote instead of against the
// state the run started with.
export const applyPersonUpdateInput = ({
  existing,
  person,
  input,
}: {
  existing: LushaPersonRecord;
  person: MappedLushaPerson;
  input: Record<string, unknown>;
}): LushaPersonRecord => ({
  ...existing,
  lushaContactId: isDefined(input.lushaContactId)
    ? person.lushaContactId
    : existing.lushaContactId,
  linkedinLinkUrl: isDefined(input.linkedinLink)
    ? person.linkedinUrl
    : existing.linkedinLinkUrl,
  firstName: isDefined(input.name) ? person.firstName : existing.firstName,
  lastName: isDefined(input.name) ? person.lastName : existing.lastName,
  jobTitle: isDefined(input.jobTitle) ? person.jobTitle : existing.jobTitle,
  primaryEmail: isDefined(input.emails)
    ? person.primaryEmail
    : existing.primaryEmail,
  primaryPhoneNumber: isDefined(input.phones)
    ? person.primaryPhoneNumber
    : existing.primaryPhoneNumber,
  companyId: isDefined(input.companyId)
    ? String(input.companyId)
    : existing.companyId,
});
