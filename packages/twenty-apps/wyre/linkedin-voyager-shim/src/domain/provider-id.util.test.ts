import { extractProviderId, extractUrnTail } from 'src/domain/provider-id.util';

describe('extractProviderId', () => {
  it('extracts the id from the URN flavours LinkedIn uses for members', () => {
    expect(extractProviderId('urn:li:fsd_profile:ACoAAAKT9JQBsH7LwKaE9Myay9WcX8OVGuDq9Uw')).toBe(
      'ACoAAAKT9JQBsH7LwKaE9Myay9WcX8OVGuDq9Uw',
    );
    expect(extractProviderId('urn:li:fs_miniProfile:ACoAAAKT9JQ')).toBe('ACoAAAKT9JQ');
    expect(extractProviderId('urn:li:member:12345')).toBe('12345');
  });

  it('returns null for other URNs and non-strings', () => {
    expect(extractProviderId('urn:li:fsd_company:1337')).toBeNull();
    expect(extractProviderId(null)).toBeNull();
    expect(extractProviderId(undefined)).toBeNull();
  });
});

describe('extractUrnTail', () => {
  it('returns the last URN segment', () => {
    expect(extractUrnTail('urn:li:fsd_conversation:2-abc==')).toBe('2-abc==');
    expect(extractUrnTail('urn:li:x:')).toBeNull();
    expect(extractUrnTail('plain')).toBeNull();
  });
});
