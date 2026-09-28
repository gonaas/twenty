import { describe, expect, it } from 'vitest';

import { buildPersonCreateInput } from 'src/logic-functions/domain/build-person-create-input';
import {
  applyPersonUpdateInput,
  buildPersonUpdateInput,
} from 'src/logic-functions/domain/build-person-update-input';
import { type MappedLushaPerson } from 'src/logic-functions/domain/map-lusha-row-to-person';
import { type LushaPersonRecord } from 'src/logic-functions/types/lusha-person-record.type';

const LINKEDIN_URL =
  'https://www.linkedin.com/in/oscar-herráez-sánchez-58820617';

const buildMappedPerson = (
  overrides: Partial<MappedLushaPerson> = {},
): MappedLushaPerson => ({
  lushaContactId: 'lusha-1',
  linkedinUrl: LINKEDIN_URL,
  normalizedLinkedinIdentifier: 'oscar-herráez-sánchez-58820617',
  firstName: 'Oscar',
  lastName: 'Herráez Sánchez',
  jobTitle: 'Chief Financial Officer',
  companyName: 'Kronos Real Estate Group',
  primaryEmail: null,
  additionalEmails: [],
  primaryPhoneNumber: null,
  primaryPhoneCallingCode: null,
  ...overrides,
});

const buildExistingPerson = (
  overrides: Partial<LushaPersonRecord> = {},
): LushaPersonRecord => ({
  id: 'person-1',
  lushaContactId: null,
  linkedinLinkUrl: null,
  firstName: null,
  lastName: null,
  jobTitle: null,
  primaryEmail: null,
  primaryPhoneNumber: null,
  companyId: null,
  ...overrides,
});

describe('buildPersonCreateInput', () => {
  it('writes the LinkedIn URL into the linkedinLink composite', () => {
    const input = buildPersonCreateInput({
      person: buildMappedPerson(),
      companyId: undefined,
    });

    expect(input.linkedinLink).toEqual({ primaryLinkUrl: LINKEDIN_URL });
    expect(input).not.toHaveProperty('linkedinLinkUrl');
  });

  it('writes the name as a FULL_NAME composite', () => {
    const input = buildPersonCreateInput({
      person: buildMappedPerson(),
      companyId: undefined,
    });

    expect(input.name).toEqual({
      firstName: 'Oscar',
      lastName: 'Herráez Sánchez',
    });
  });

  it('omits the company link when no company was resolved', () => {
    const input = buildPersonCreateInput({
      person: buildMappedPerson(),
      companyId: undefined,
    });

    expect(input).not.toHaveProperty('companyId');
  });

  it('links the company when one was resolved', () => {
    const input = buildPersonCreateInput({
      person: buildMappedPerson(),
      companyId: 'company-1',
    });

    expect(input.companyId).toBe('company-1');
  });

  it('omits emails and phones when every datapoint was masked', () => {
    const input = buildPersonCreateInput({
      person: buildMappedPerson(),
      companyId: undefined,
    });

    expect(input).not.toHaveProperty('emails');
    expect(input).not.toHaveProperty('phones');
  });

  it('writes unmasked emails and phones', () => {
    const input = buildPersonCreateInput({
      person: buildMappedPerson({
        primaryEmail: 'oscar@kronosig.com',
        additionalEmails: ['oscar.h@example.com'],
        primaryPhoneNumber: '671234567',
        primaryPhoneCallingCode: '+34',
      }),
      companyId: undefined,
    });

    expect(input.emails).toEqual({
      primaryEmail: 'oscar@kronosig.com',
      additionalEmails: ['oscar.h@example.com'],
    });
    expect(input.phones).toEqual({
      primaryPhoneNumber: '671234567',
      primaryPhoneCallingCode: '+34',
    });
  });
});

describe('buildPersonUpdateInput', () => {
  it('fills every field of an otherwise empty person', () => {
    const input = buildPersonUpdateInput({
      existing: buildExistingPerson(),
      person: buildMappedPerson(),
      companyId: 'company-1',
    });

    expect(input).toEqual({
      lushaContactId: 'lusha-1',
      linkedinLink: { primaryLinkUrl: LINKEDIN_URL },
      name: { firstName: 'Oscar', lastName: 'Herráez Sánchez' },
      jobTitle: 'Chief Financial Officer',
      companyId: 'company-1',
    });
  });

  it('returns nothing to write when every field is already filled', () => {
    const input = buildPersonUpdateInput({
      existing: buildExistingPerson({
        lushaContactId: 'lusha-1',
        linkedinLinkUrl: LINKEDIN_URL,
        firstName: 'Oscar',
        lastName: 'Herráez Sánchez',
        jobTitle: 'Chief Financial Officer',
        companyId: 'company-1',
      }),
      person: buildMappedPerson(),
      companyId: 'company-1',
    });

    expect(input).toEqual({});
  });

  it('never overwrites a job title a human already set', () => {
    const input = buildPersonUpdateInput({
      existing: buildExistingPerson({ jobTitle: 'CFO (verified by hand)' }),
      person: buildMappedPerson(),
      companyId: undefined,
    });

    expect(input).not.toHaveProperty('jobTitle');
  });

  it('never overwrites a LinkedIn URL another app already wrote', () => {
    const input = buildPersonUpdateInput({
      existing: buildExistingPerson({
        linkedinLinkUrl: 'https://www.linkedin.com/in/oscar-herraez',
      }),
      person: buildMappedPerson(),
      companyId: undefined,
    });

    expect(input).not.toHaveProperty('linkedinLink');
  });

  it('leaves the name alone when only one half is filled', () => {
    const input = buildPersonUpdateInput({
      existing: buildExistingPerson({ lastName: 'Herráez' }),
      person: buildMappedPerson(),
      companyId: undefined,
    });

    expect(input).not.toHaveProperty('name');
  });

  it('never overwrites an existing lushaContactId', () => {
    const input = buildPersonUpdateInput({
      existing: buildExistingPerson({ lushaContactId: 'lusha-original' }),
      person: buildMappedPerson({ lushaContactId: 'lusha-1' }),
      companyId: undefined,
    });

    expect(input).not.toHaveProperty('lushaContactId');
  });

  it('never overwrites an existing email or phone', () => {
    const input = buildPersonUpdateInput({
      existing: buildExistingPerson({
        primaryEmail: 'human@kronosig.com',
        primaryPhoneNumber: '600000000',
      }),
      person: buildMappedPerson({
        primaryEmail: 'oscar@kronosig.com',
        primaryPhoneNumber: '671234567',
        primaryPhoneCallingCode: '+34',
      }),
      companyId: undefined,
    });

    expect(input).not.toHaveProperty('emails');
    expect(input).not.toHaveProperty('phones');
  });

  // Twenty writes every sub-key present in a composite, and this app never
  // reads the existing additionalEmails, so sending the key at all would
  // replace a human's list with Lusha's.
  it('fills an empty primaryEmail without sending additionalEmails', () => {
    const input = buildPersonUpdateInput({
      existing: buildExistingPerson(),
      person: buildMappedPerson({
        primaryEmail: 'oscar@kronosig.com',
        additionalEmails: ['oscar.h@example.com'],
      }),
      companyId: undefined,
    });

    expect(input.emails).toEqual({ primaryEmail: 'oscar@kronosig.com' });
    expect(input.emails).not.toHaveProperty('additionalEmails');
  });

  it('never overwrites an existing company link', () => {
    const input = buildPersonUpdateInput({
      existing: buildExistingPerson({ companyId: 'company-chosen-by-hand' }),
      person: buildMappedPerson(),
      companyId: 'company-1',
    });

    expect(input).not.toHaveProperty('companyId');
  });
});

describe('applyPersonUpdateInput', () => {
  it('reflects every field the update filled in', () => {
    const existing = buildExistingPerson();
    const person = buildMappedPerson();
    const input = buildPersonUpdateInput({
      existing,
      person,
      companyId: 'company-1',
    });

    expect(applyPersonUpdateInput({ existing, person, input })).toEqual({
      id: 'person-1',
      lushaContactId: 'lusha-1',
      linkedinLinkUrl: LINKEDIN_URL,
      firstName: 'Oscar',
      lastName: 'Herráez Sánchez',
      jobTitle: 'Chief Financial Officer',
      primaryEmail: null,
      primaryPhoneNumber: null,
      companyId: 'company-1',
    });
  });

  it('leaves the record untouched when the update wrote nothing', () => {
    const existing = buildExistingPerson({
      lushaContactId: 'lusha-1',
      linkedinLinkUrl: LINKEDIN_URL,
      firstName: 'Oscar',
      lastName: 'Herráez Sánchez',
      jobTitle: 'Chief Financial Officer',
      companyId: 'company-1',
    });

    expect(
      applyPersonUpdateInput({
        existing,
        person: buildMappedPerson(),
        input: {},
      }),
    ).toEqual(existing);
  });

  it('keeps the fields the update deliberately skipped', () => {
    const existing = buildExistingPerson({
      jobTitle: 'CFO (verified by hand)',
    });
    const person = buildMappedPerson();
    const input = buildPersonUpdateInput({
      existing,
      person,
      companyId: undefined,
    });

    expect(applyPersonUpdateInput({ existing, person, input })).toMatchObject({
      jobTitle: 'CFO (verified by hand)',
    });
  });

  it('makes a second pass over the same row a no-op', () => {
    const existing = buildExistingPerson();
    const person = buildMappedPerson();
    const firstPass = buildPersonUpdateInput({
      existing,
      person,
      companyId: 'company-1',
    });
    const afterFirstPass = applyPersonUpdateInput({
      existing,
      person,
      input: firstPass,
    });

    expect(
      buildPersonUpdateInput({
        existing: afterFirstPass,
        person,
        companyId: 'company-1',
      }),
    ).toEqual({});
  });
});
