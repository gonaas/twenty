import { describe, expect, it } from 'vitest';

import { mapLushaRowToPerson } from 'src/logic-functions/domain/map-lusha-row-to-person';
import { type LushaTableEntity } from 'src/logic-functions/lusha-api/types/lusha-table-entity.type';

const LINKEDIN_URL =
  'https://www.linkedin.com/in/oscar-herráez-sánchez-58820617';

const buildRow = (
  overrides: Partial<LushaTableEntity> = {},
): LushaTableEntity => ({
  id: 'v1.dapr-example',
  type: 'UNSHOWN',
  firstName: 'Oscar',
  lastName: 'Herráez Sánchez',
  fullName: 'Oscar Herráez Sánchez',
  tableContactId: '3042bed1-1590-5505-b47d-d901ae660c2b',
  datapoints: {
    emails: [
      {
        value: '...@kronosig.com',
        type: 'work',
        isMasked: true,
        qualityScore: 90,
      },
    ],
    phones: [
      {
        value: '+34 671...',
        countryCode: 34,
        type: 'mobile',
        isMasked: true,
        doNotCall: false,
      },
    ],
  },
  columns: [
    { name: 'contact_linkedin', value: LINKEDIN_URL, status: 'success' },
    {
      name: 'company_name',
      value: 'Kronos Real Estate Group',
      status: 'success',
    },
    {
      name: 'contact_jobTitle',
      value: 'Chief Financial Officer',
      status: 'success',
    },
    {
      name: 'contact_fullName',
      value: 'Oscar Herráez Sánchez',
      status: 'success',
    },
  ],
  job: {
    title: 'Chief Financial Officer',
    seniority: 'C-Suite',
    departments: ['Finance'],
  },
  socialLinks: { linkedin: LINKEDIN_URL },
  ...overrides,
});

describe('mapLushaRowToPerson', () => {
  it('maps a full row', () => {
    const result = mapLushaRowToPerson(buildRow());

    expect(result).toEqual({
      status: 'mapped',
      person: {
        lushaContactId: '3042bed1-1590-5505-b47d-d901ae660c2b',
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
      },
    });
  });

  it('keeps the separate name fields rather than splitting fullName', () => {
    const result = mapLushaRowToPerson(
      buildRow({
        firstName: 'Oscar',
        lastName: 'Herráez Sánchez',
        fullName: 'Oscar Herráez Sánchez',
      }),
    );

    expect(result).toMatchObject({
      status: 'mapped',
      person: { firstName: 'Oscar', lastName: 'Herráez Sánchez' },
    });
  });

  it('preserves the non-ASCII characters of the LinkedIn URL', () => {
    const result = mapLushaRowToPerson(buildRow());

    expect(result).toMatchObject({
      status: 'mapped',
      person: { linkedinUrl: LINKEDIN_URL },
    });
  });

  it('falls back to the contact_linkedin column when socialLinks is missing', () => {
    const result = mapLushaRowToPerson(buildRow({ socialLinks: null }));

    expect(result).toMatchObject({
      status: 'mapped',
      person: {
        linkedinUrl: LINKEDIN_URL,
        normalizedLinkedinIdentifier: 'oscar-herráez-sánchez-58820617',
      },
    });
  });

  it('accepts a LinkedIn URL with no protocol or www', () => {
    const result = mapLushaRowToPerson(
      buildRow({ socialLinks: { linkedin: 'linkedin.com/in/oscar-herraez' } }),
    );

    expect(result).toMatchObject({
      status: 'mapped',
      person: { normalizedLinkedinIdentifier: 'oscar-herraez' },
    });
  });

  it('accepts a bare vanity slug', () => {
    const result = mapLushaRowToPerson(
      buildRow({ socialLinks: { linkedin: 'oscar-herraez-58820617' } }),
    );

    expect(result).toMatchObject({
      status: 'mapped',
      person: { normalizedLinkedinIdentifier: 'oscar-herraez-58820617' },
    });
  });

  it('falls back to the contact_jobTitle column when job.title is missing', () => {
    const result = mapLushaRowToPerson(buildRow({ job: null }));

    expect(result).toMatchObject({
      status: 'mapped',
      person: { jobTitle: 'Chief Financial Officer' },
    });
  });

  it('ignores a contact_jobTitle cell whose run failed', () => {
    const result = mapLushaRowToPerson(
      buildRow({
        job: null,
        columns: [
          { name: 'contact_linkedin', value: LINKEDIN_URL, status: 'success' },
          { name: 'contact_jobTitle', value: 'Not found', status: 'failed' },
        ],
      }),
    );

    expect(result).toMatchObject({
      status: 'mapped',
      person: { jobTitle: null },
    });
  });

  it('maps a missing company_name column to null', () => {
    const result = mapLushaRowToPerson(
      buildRow({
        columns: [
          { name: 'contact_linkedin', value: LINKEDIN_URL, status: 'success' },
        ],
      }),
    );

    expect(result).toMatchObject({
      status: 'mapped',
      person: { companyName: null },
    });
  });

  it('ignores a company_name cell whose run failed', () => {
    const result = mapLushaRowToPerson(
      buildRow({
        columns: [
          { name: 'contact_linkedin', value: LINKEDIN_URL, status: 'success' },
          { name: 'company_name', value: 'Not found', status: 'failed' },
        ],
      }),
    );

    expect(result).toMatchObject({
      status: 'mapped',
      person: { companyName: null },
    });
  });

  it('skips a row with no usable LinkedIn URL', () => {
    const result = mapLushaRowToPerson(
      buildRow({
        socialLinks: null,
        columns: [
          {
            name: 'company_name',
            value: 'Kronos Real Estate Group',
            status: 'success',
          },
        ],
      }),
    );

    expect(result).toEqual({
      status: 'skipped',
      reason: 'missing-linkedin-url',
    });
  });

  it('skips a row whose contact_linkedin column ran but found nothing', () => {
    const result = mapLushaRowToPerson(
      buildRow({
        socialLinks: { linkedin: null },
        columns: [{ name: 'contact_linkedin', value: null, status: 'no_data' }],
      }),
    );

    expect(result).toEqual({
      status: 'skipped',
      reason: 'missing-linkedin-url',
    });
  });

  it('skips a row whose contact_linkedin cell has not run yet', () => {
    const result = mapLushaRowToPerson(
      buildRow({
        socialLinks: null,
        columns: [
          { name: 'contact_linkedin', value: LINKEDIN_URL, status: 'not_run' },
        ],
      }),
    );

    expect(result).toEqual({
      status: 'skipped',
      reason: 'missing-linkedin-url',
    });
  });

  it('skips a row whose contact_linkedin cell has no status at all', () => {
    const result = mapLushaRowToPerson(
      buildRow({
        socialLinks: null,
        columns: [{ name: 'contact_linkedin', value: LINKEDIN_URL }],
      }),
    );

    expect(result).toEqual({
      status: 'skipped',
      reason: 'missing-linkedin-url',
    });
  });

  it('skips a row whose LinkedIn value is a placeholder rather than a profile', () => {
    const result = mapLushaRowToPerson(
      buildRow({
        socialLinks: { linkedin: 'Not found' },
        columns: [
          { name: 'contact_linkedin', value: 'Not found', status: 'success' },
        ],
      }),
    );

    expect(result).toEqual({
      status: 'skipped',
      reason: 'missing-linkedin-url',
    });
  });

  it('skips a row whose LinkedIn value points at a company rather than a profile', () => {
    const companyUrl = 'https://www.linkedin.com/company/acme';
    const result = mapLushaRowToPerson(
      buildRow({
        socialLinks: { linkedin: companyUrl },
        columns: [
          { name: 'contact_linkedin', value: companyUrl, status: 'success' },
        ],
      }),
    );

    expect(result).toEqual({
      status: 'skipped',
      reason: 'missing-linkedin-url',
    });
  });

  // Two contacts whose LinkedIn lookup failed used to normalize to the same
  // slug ("not found") and dedupe onto a single Person, silently dropping the
  // second one's data.
  it('never gives two contacts with a failed LinkedIn lookup the same identifier', () => {
    const buildFailedRow = (tableContactId: string): LushaTableEntity =>
      buildRow({
        tableContactId,
        socialLinks: null,
        columns: [
          { name: 'contact_linkedin', value: 'Not found', status: 'failed' },
        ],
      });

    expect(mapLushaRowToPerson(buildFailedRow('contact-a'))).toEqual({
      status: 'skipped',
      reason: 'missing-linkedin-url',
    });
    expect(mapLushaRowToPerson(buildFailedRow('contact-b'))).toEqual({
      status: 'skipped',
      reason: 'missing-linkedin-url',
    });
  });

  it('falls back to the contact_linkedin column when socialLinks holds a placeholder', () => {
    const result = mapLushaRowToPerson(
      buildRow({ socialLinks: { linkedin: 'Not found' }, type: 'SHOWN' }),
    );

    expect(result).toMatchObject({
      status: 'mapped',
      person: { linkedinUrl: LINKEDIN_URL },
    });
  });

  it('never maps a masked email or phone onto the person', () => {
    const result = mapLushaRowToPerson(buildRow());

    expect(result).toMatchObject({
      status: 'mapped',
      person: {
        primaryEmail: null,
        additionalEmails: [],
        primaryPhoneNumber: null,
        primaryPhoneCallingCode: null,
      },
    });
  });

  it('never maps a datapoint of a row that was never shown, whatever its flag says', () => {
    const result = mapLushaRowToPerson(
      buildRow({
        type: 'UNSHOWN',
        datapoints: {
          emails: [{ value: 'oscar@kronosig.com', isMasked: false }],
          phones: [
            { value: '+34 671 234 567', countryCode: 34, isMasked: false },
          ],
        },
      }),
    );

    expect(result).toMatchObject({
      status: 'mapped',
      person: {
        primaryEmail: null,
        additionalEmails: [],
        primaryPhoneNumber: null,
      },
    });
  });

  it('never maps a datapoint that carries no isMasked flag', () => {
    const result = mapLushaRowToPerson(
      buildRow({
        type: 'SHOWN',
        datapoints: {
          emails: [{ value: 'oscar@kronosig.com' }],
          phones: [],
        },
      }),
    );

    expect(result).toMatchObject({
      status: 'mapped',
      person: { primaryEmail: null, additionalEmails: [] },
    });
  });

  it('maps unmasked emails of a shown row, keeping the first as primary', () => {
    const result = mapLushaRowToPerson(
      buildRow({
        type: 'SHOWN',
        datapoints: {
          emails: [
            { value: 'oscar@kronosig.com', type: 'work', isMasked: false },
            { value: 'oscar.h@example.com', type: 'personal', isMasked: false },
            { value: '...@masked.com', type: 'work', isMasked: true },
          ],
          phones: [],
        },
      }),
    );

    expect(result).toMatchObject({
      status: 'mapped',
      person: {
        primaryEmail: 'oscar@kronosig.com',
        additionalEmails: ['oscar.h@example.com'],
      },
    });
  });

  it('splits the calling code off an unmasked phone number', () => {
    const result = mapLushaRowToPerson(
      buildRow({
        type: 'SHOWN',
        datapoints: {
          emails: [],
          phones: [
            {
              value: '+34 671 234 567',
              countryCode: 34,
              type: 'mobile',
              isMasked: false,
            },
          ],
        },
      }),
    );

    expect(result).toMatchObject({
      status: 'mapped',
      person: {
        primaryPhoneNumber: '671234567',
        primaryPhoneCallingCode: '+34',
      },
    });
  });

  it('maps a row with no datapoints at all', () => {
    const result = mapLushaRowToPerson(buildRow({ datapoints: null }));

    expect(result).toMatchObject({
      status: 'mapped',
      person: {
        primaryEmail: null,
        additionalEmails: [],
        primaryPhoneNumber: null,
      },
    });
  });

  it('maps a missing tableContactId to null', () => {
    const result = mapLushaRowToPerson(buildRow({ tableContactId: null }));

    expect(result).toMatchObject({
      status: 'mapped',
      person: { lushaContactId: null },
    });
  });

  it('maps missing name fields to empty strings', () => {
    const result = mapLushaRowToPerson(
      buildRow({ firstName: null, lastName: null }),
    );

    expect(result).toMatchObject({
      status: 'mapped',
      person: { firstName: '', lastName: '' },
    });
  });
});
