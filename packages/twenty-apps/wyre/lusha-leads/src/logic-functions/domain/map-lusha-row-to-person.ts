import { isNonEmptyString } from '@sniptt/guards';

import { normalizeLinkedinIdentifier } from 'src/logic-functions/domain/normalize-linkedin-identifier';
import { selectUnmaskedDatapoints } from 'src/logic-functions/domain/select-unmasked-datapoints';
import {
  type LushaPhoneDatapoint,
  type LushaTableEntity,
} from 'src/logic-functions/lusha-api/types/lusha-table-entity.type';

export const LUSHA_LINKEDIN_COLUMN_NAME = 'contact_linkedin';
export const LUSHA_JOB_TITLE_COLUMN_NAME = 'contact_jobTitle';
export const LUSHA_COMPANY_NAME_COLUMN_NAME = 'company_name';

const LUSHA_SUCCESS_COLUMN_STATUS = 'success';

export type MappedLushaPerson = {
  lushaContactId: string | null;
  linkedinUrl: string;
  normalizedLinkedinIdentifier: string;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
  companyName: string | null;
  primaryEmail: string | null;
  additionalEmails: string[];
  primaryPhoneNumber: string | null;
  primaryPhoneCallingCode: string | null;
};

export type MapLushaRowResult =
  | { status: 'mapped'; person: MappedLushaPerson }
  | { status: 'skipped'; reason: 'missing-linkedin-url' };

// A cell keeps whatever its last run left behind, so a column whose status is
// failed, no_data, processing or not_run can still carry a placeholder such as
// "Not found". Only a successful run is a value.
const readColumnValue = (
  row: LushaTableEntity,
  columnName: string,
): string | null => {
  const column = (row.columns ?? []).find(
    (candidate) => candidate.name === columnName,
  );

  if (column?.status !== LUSHA_SUCCESS_COLUMN_STATUS) {
    return null;
  }

  return typeof column.value === 'string' &&
    isNonEmptyString(column.value.trim())
    ? column.value.trim()
    : null;
};

const readTrimmedString = (value: string | null | undefined): string | null =>
  isNonEmptyString(value?.trim()) ? value.trim() : null;

// normalizeLinkedinIdentifier falls back to the last path segment, so any
// string at all yields a slug: "Not found" becomes "not found", and every row
// whose LinkedIn lookup failed would collapse onto that one dedupe key and
// merge unrelated contacts into a single Person. It is a byte-for-byte copy of
// linkedin-unipile's and both apps must keep agreeing on the slug, so the
// shape is checked here instead, before normalizing. /company/ URLs are
// rejected for the same reason: they normalize to the company slug.
const LINKEDIN_PROFILE_URL_PATTERN =
  /^(?:https?:\/\/)?(?:[\w-]+\.)*linkedin\.com\/in\/[^/?#]+/i;
const LINKEDIN_BARE_SLUG_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N}_-]*$/u;

const readLinkedinProfileReference = (
  value: string | null | undefined,
): string | null => {
  const trimmed = readTrimmedString(value);

  if (trimmed === null) {
    return null;
  }

  return LINKEDIN_PROFILE_URL_PATTERN.test(trimmed) ||
    LINKEDIN_BARE_SLUG_PATTERN.test(trimmed)
    ? trimmed
    : null;
};

// Lusha reports the calling code as a bare number (34), while Twenty stores
// it with the plus sign and keeps it out of the number itself.
const splitPhoneDatapoint = (
  phone: LushaPhoneDatapoint | undefined,
): { number: string | null; callingCode: string | null } => {
  const rawValue = readTrimmedString(phone?.value);

  if (rawValue === null) {
    return { number: null, callingCode: null };
  }

  const callingCode =
    typeof phone?.countryCode === 'number' && phone.countryCode > 0
      ? `+${phone.countryCode}`
      : null;
  const withoutSpaces = rawValue.replace(/[\s()-]/g, '');
  const withoutCallingCode =
    callingCode !== null && withoutSpaces.startsWith(callingCode)
      ? withoutSpaces.slice(callingCode.length)
      : withoutSpaces;

  return {
    number: isNonEmptyString(withoutCallingCode) ? withoutCallingCode : null,
    callingCode,
  };
};

// The row is only useful once we can find the person on LinkedIn, because the
// LinkedIn (Unipile) app keys its whole relationship sync off that URL. A row
// without one is counted and dropped rather than turned into a Person nobody
// can act on.
export const mapLushaRowToPerson = (
  row: LushaTableEntity,
): MapLushaRowResult => {
  const linkedinUrl =
    readLinkedinProfileReference(row.socialLinks?.linkedin) ??
    readLinkedinProfileReference(
      readColumnValue(row, LUSHA_LINKEDIN_COLUMN_NAME),
    );

  if (linkedinUrl === null) {
    return { status: 'skipped', reason: 'missing-linkedin-url' };
  }

  const unmaskedEmails = selectUnmaskedDatapoints({
    datapoints: row.datapoints?.emails,
    rowType: row.type,
  }).map((email) => (email.value ?? '').trim());
  const unmaskedPhone = selectUnmaskedDatapoints({
    datapoints: row.datapoints?.phones,
    rowType: row.type,
  })[0];
  const { number: primaryPhoneNumber, callingCode: primaryPhoneCallingCode } =
    splitPhoneDatapoint(unmaskedPhone);

  return {
    status: 'mapped',
    person: {
      lushaContactId: readTrimmedString(row.tableContactId),
      linkedinUrl,
      normalizedLinkedinIdentifier: normalizeLinkedinIdentifier(linkedinUrl),
      // The separate name fields are authoritative: splitting fullName would
      // guess wrong on the compound surnames this table is full of.
      firstName: readTrimmedString(row.firstName) ?? '',
      lastName: readTrimmedString(row.lastName) ?? '',
      jobTitle:
        readTrimmedString(row.job?.title) ??
        readColumnValue(row, LUSHA_JOB_TITLE_COLUMN_NAME),
      companyName: readColumnValue(row, LUSHA_COMPANY_NAME_COLUMN_NAME),
      primaryEmail: unmaskedEmails[0] ?? null,
      additionalEmails: unmaskedEmails.slice(1),
      primaryPhoneNumber,
      primaryPhoneCallingCode,
    },
  };
};
