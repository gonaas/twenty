import { describe, expect, it } from 'vitest';

import {
  addPersonToIndex,
  buildExistingPersonIndex,
  resolveExistingPerson,
} from 'src/logic-functions/domain/resolve-existing-person';
import { type LushaPersonRecord } from 'src/logic-functions/types/lusha-person-record.type';

const buildPerson = (
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

describe('resolveExistingPerson', () => {
  it('matches by lushaContactId', () => {
    const person = buildPerson({ id: 'person-1', lushaContactId: 'lusha-1' });
    const index = buildExistingPersonIndex([person]);

    expect(
      resolveExistingPerson({
        index,
        lushaContactId: 'lusha-1',
        normalizedLinkedinIdentifier: 'someone-else',
      }),
    ).toEqual({ person, matchedBy: 'lushaContactId' });
  });

  it('matches by normalized LinkedIn slug when the Lusha id is unknown', () => {
    const person = buildPerson({
      id: 'person-2',
      linkedinLinkUrl: 'https://www.linkedin.com/in/John-Doe/',
    });
    const index = buildExistingPersonIndex([person]);

    expect(
      resolveExistingPerson({
        index,
        lushaContactId: null,
        normalizedLinkedinIdentifier: 'john-doe',
      }),
    ).toEqual({ person, matchedBy: 'linkedinIdentifier' });
  });

  it('matches a non-ASCII slug stored in a different representation', () => {
    const person = buildPerson({
      id: 'person-3',
      linkedinLinkUrl:
        'https://linkedin.com/in/Oscar-Herr%C3%A1ez-S%C3%A1nchez-58820617?trk=public',
    });
    const index = buildExistingPersonIndex([person]);

    expect(
      resolveExistingPerson({
        index,
        lushaContactId: null,
        normalizedLinkedinIdentifier: 'oscar-herráez-sánchez-58820617',
      }),
    ).toEqual({ person, matchedBy: 'linkedinIdentifier' });
  });

  it('prefers the lushaContactId match over the slug match', () => {
    const byContactId = buildPerson({
      id: 'person-by-contact-id',
      lushaContactId: 'lusha-1',
    });
    const bySlug = buildPerson({
      id: 'person-by-slug',
      linkedinLinkUrl: 'https://www.linkedin.com/in/john-doe',
    });
    const index = buildExistingPersonIndex([byContactId, bySlug]);

    expect(
      resolveExistingPerson({
        index,
        lushaContactId: 'lusha-1',
        normalizedLinkedinIdentifier: 'john-doe',
      }),
    ).toEqual({ person: byContactId, matchedBy: 'lushaContactId' });
  });

  it('returns null when neither key matches', () => {
    const index = buildExistingPersonIndex([
      buildPerson({
        id: 'person-1',
        lushaContactId: 'lusha-1',
        linkedinLinkUrl: 'https://www.linkedin.com/in/john-doe',
      }),
    ]);

    expect(
      resolveExistingPerson({
        index,
        lushaContactId: 'lusha-999',
        normalizedLinkedinIdentifier: 'nobody-here',
      }),
    ).toBeNull();
  });

  it('returns null against an empty index', () => {
    expect(
      resolveExistingPerson({
        index: buildExistingPersonIndex([]),
        lushaContactId: 'lusha-1',
        normalizedLinkedinIdentifier: 'john-doe',
      }),
    ).toBeNull();
  });

  it('ignores people that carry neither key', () => {
    const index = buildExistingPersonIndex([
      buildPerson({ id: 'person-blank' }),
    ]);

    expect(index.byLushaContactId.size).toBe(0);
    expect(index.byNormalizedLinkedinIdentifier.size).toBe(0);
  });

  it('matches a person added to the index during the run', () => {
    const index = buildExistingPersonIndex([]);
    const created = buildPerson({
      id: 'person-created',
      lushaContactId: 'lusha-new',
      linkedinLinkUrl: 'https://www.linkedin.com/in/jane-smith',
    });

    addPersonToIndex(index, created);

    expect(
      resolveExistingPerson({
        index,
        lushaContactId: 'lusha-new',
        normalizedLinkedinIdentifier: 'jane-smith',
      }),
    ).toEqual({ person: created, matchedBy: 'lushaContactId' });
    expect(
      resolveExistingPerson({
        index,
        lushaContactId: null,
        normalizedLinkedinIdentifier: 'jane-smith',
      }),
    ).toEqual({ person: created, matchedBy: 'linkedinIdentifier' });
  });
});
