import { describe, expect, it } from 'vitest';

import { toIsoTimestamp } from 'src/logic-functions/domain/to-iso-timestamp';

describe('toIsoTimestamp', () => {
  it('keeps ISO strings, normalised', () => {
    expect(toIsoTimestamp('2026-09-11T12:31:16.484Z')).toBe(
      '2026-09-11T12:31:16.484Z',
    );
    expect(toIsoTimestamp('2026-09-11T14:31:16+02:00')).toBe(
      '2026-09-11T12:31:16.000Z',
    );
  });

  it('converts epoch milliseconds, as returned by the relations endpoint', () => {
    expect(toIsoTimestamp(1789115449000)).toBe('2026-09-11T08:30:49.000Z');
    expect(toIsoTimestamp('1789115449000')).toBe('2026-09-11T08:30:49.000Z');
  });

  it('converts epoch seconds', () => {
    expect(toIsoTimestamp(1789115449)).toBe('2026-09-11T08:30:49.000Z');
  });

  it('returns null for labels, blanks and missing values', () => {
    expect(toIsoTimestamp('2 weeks ago')).toBeNull();
    expect(toIsoTimestamp('')).toBeNull();
    expect(toIsoTimestamp('   ')).toBeNull();
    expect(toIsoTimestamp(null)).toBeNull();
    expect(toIsoTimestamp(undefined)).toBeNull();
  });
});
