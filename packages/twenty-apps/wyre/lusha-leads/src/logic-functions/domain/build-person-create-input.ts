import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-sdk/utils';

import { type MappedLushaPerson } from 'src/logic-functions/domain/map-lusha-row-to-person';

// Twenty's Person LinkedIn field is the LINKS composite `linkedinLink`, whose
// URL lives under primaryLinkUrl. Writing a bare `linkedinLinkUrl` string
// silently lands nowhere the CRM reads.
export const buildPersonCreateInput = ({
  person,
  companyId,
}: {
  person: MappedLushaPerson;
  companyId: string | undefined;
}): Record<string, unknown> => {
  const input: Record<string, unknown> = {
    name: { firstName: person.firstName, lastName: person.lastName },
    linkedinLink: { primaryLinkUrl: person.linkedinUrl },
  };

  if (isNonEmptyString(person.lushaContactId)) {
    input.lushaContactId = person.lushaContactId;
  }

  if (isNonEmptyString(person.jobTitle)) {
    input.jobTitle = person.jobTitle;
  }

  if (isNonEmptyString(person.primaryEmail)) {
    input.emails = {
      primaryEmail: person.primaryEmail,
      additionalEmails: person.additionalEmails,
    };
  }

  if (isNonEmptyString(person.primaryPhoneNumber)) {
    input.phones = {
      primaryPhoneNumber: person.primaryPhoneNumber,
      primaryPhoneCallingCode: person.primaryPhoneCallingCode ?? '',
    };
  }

  if (isDefined(companyId)) {
    input.companyId = companyId;
  }

  return input;
};
