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

  it('keeps the accented characters of a non-ASCII slug', () => {
    expect(
      normalizeLinkedinIdentifier(
        'https://www.linkedin.com/in/oscar-herráez-sánchez-58820617',
      ),
    ).toBe('oscar-herráez-sánchez-58820617');
  });

  it('matches a percent-encoded non-ASCII URL to its decoded form', () => {
    expect(
      normalizeLinkedinIdentifier(
        'https://www.linkedin.com/in/oscar-herr%C3%A1ez-s%C3%A1nchez-58820617/',
      ),
    ).toBe(
      normalizeLinkedinIdentifier(
        'https://www.linkedin.com/in/oscar-herráez-sánchez-58820617',
      ),
    );
  });

  it('lowercases a non-ASCII slug', () => {
    expect(normalizeLinkedinIdentifier('Oscar-Herráez-Sánchez')).toBe(
      'oscar-herráez-sánchez',
    );
  });

  it('strips the query string from a non-ASCII URL', () => {
    expect(
      normalizeLinkedinIdentifier(
        'https://www.linkedin.com/in/josé-muñoz-ñandú/?originalSubdomain=es',
      ),
    ).toBe('josé-muñoz-ñandú');
  });
});
