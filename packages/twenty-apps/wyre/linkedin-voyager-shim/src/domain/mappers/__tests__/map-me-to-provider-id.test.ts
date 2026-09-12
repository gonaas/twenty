import { mapMeToProviderId } from 'src/domain/mappers/map-me-to-provider-id.util';
import { loadVoyagerFixture } from 'src/test-support/load-fixture.util';

describe('mapMeToProviderId', () => {
  it('reads the owner provider id from the mini profile reference', () => {
    expect(mapMeToProviderId(loadVoyagerFixture('me'))).toBe('ACoAAAAAAAME');
  });

  it('falls back to an inline mini profile URN', () => {
    expect(
      mapMeToProviderId({ data: { miniProfile: 'urn:li:fs_miniProfile:ACoAAInline' }, included: [] }),
    ).toBe('ACoAAInline');
  });
});
