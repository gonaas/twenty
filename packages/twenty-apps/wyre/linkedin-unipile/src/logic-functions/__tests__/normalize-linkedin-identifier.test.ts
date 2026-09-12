import { describe, expect, it } from 'vitest';

import { normalizeLinkedinIdentifier } from 'src/logic-functions/domain/normalize-linkedin-identifier';

describe('normalizeLinkedinIdentifier', () => {
  it('extracts the slug from a full profile URL', () => {
    expect(
      normalizeLinkedinIdentifier('https://www.linkedin.com/in/John-Doe/'),
    ).toBe('john-doe');
  });

  it('handles a URL without www. or a trailing slash', () => {
    expect(
      normalizeLinkedinIdentifier('https://linkedin.com/in/jane-smith'),
    ).toBe('jane-smith');
  });

  it('decodes a percent-encoded URL', () => {
    expect(
      normalizeLinkedinIdentifier(
        'https%3A%2F%2Fwww.linkedin.com%2Fin%2Fjohn-doe%2F',
      ),
    ).toBe('john-doe');
  });

  it('strips a trailing query string', () => {
    expect(
      normalizeLinkedinIdentifier(
        'https://www.linkedin.com/in/john-doe/?trk=public',
      ),
    ).toBe('john-doe');
  });

  it('accepts a bare vanity slug', () => {
    expect(normalizeLinkedinIdentifier('John-Doe')).toBe('john-doe');
  });

  it('is idempotent for an already-normalized slug', () => {
    expect(normalizeLinkedinIdentifier('john-doe')).toBe('john-doe');
  });
});
