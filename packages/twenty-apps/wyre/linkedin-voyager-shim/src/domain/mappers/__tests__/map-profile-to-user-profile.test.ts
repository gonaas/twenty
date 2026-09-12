import {
  mapMemberRelationship,
  mapProfileIdentity,
} from 'src/domain/mappers/map-profile-to-user-profile.util';
import { loadVoyagerFixture } from 'src/test-support/load-fixture.util';

const OWN_PROVIDER_ID = 'ACoAAAAAAAME';

describe('mapProfileIdentity', () => {
  it('resolves the identifier to a provider id and public identifier', () => {
    expect(mapProfileIdentity(loadVoyagerFixture('profile-identity'))).toEqual({
      providerId: 'ACoAAAAAAA3',
      publicIdentifier: 'carol-invited',
    });
  });

  it('returns null when the identifier resolves to nothing', () => {
    expect(mapProfileIdentity(loadVoyagerFixture('profile-not-found'))).toBeNull();
  });
});

describe('mapMemberRelationship', () => {
  const identity = { providerId: 'ACoAAAAAAA3', publicIdentifier: 'carol-invited' };

  it('maps a connection to FIRST_DEGREE', () => {
    expect(
      mapMemberRelationship({
        identity: { providerId: 'ACoAAAAAAA1', publicIdentifier: 'alice-example' },
        response: loadVoyagerFixture('member-relationship-connected'),
        ownProviderId: OWN_PROVIDER_ID,
      }),
    ).toEqual({
      provider_id: 'ACoAAAAAAA1',
      public_identifier: 'alice-example',
      network_distance: 'FIRST_DEGREE',
      is_relationship: true,
      invitation: null,
    });
  });

  it('treats a *connection reference as FIRST_DEGREE too', () => {
    expect(
      mapMemberRelationship({
        identity: { providerId: 'ACoAAAAAAA1', publicIdentifier: 'alice-example' },
        response: loadVoyagerFixture('member-relationship-connected-reference'),
        ownProviderId: OWN_PROVIDER_ID,
      }),
    ).toEqual(expect.objectContaining({ network_distance: 'FIRST_DEGREE', is_relationship: true }));
  });

  it('maps a second degree without invitation', () => {
    expect(
      mapMemberRelationship({
        identity,
        response: loadVoyagerFixture('member-relationship-second-degree'),
        ownProviderId: OWN_PROVIDER_ID,
      }),
    ).toEqual({
      provider_id: 'ACoAAAAAAA3',
      public_identifier: 'carol-invited',
      network_distance: 'SECOND_DEGREE',
      is_relationship: false,
      invitation: null,
    });
  });

  it('maps a pending invitation sent by the owner', () => {
    expect(
      mapMemberRelationship({
        identity,
        response: loadVoyagerFixture('member-relationship-pending-sent'),
        ownProviderId: OWN_PROVIDER_ID,
      }),
    ).toEqual(
      expect.objectContaining({
        network_distance: 'SECOND_DEGREE',
        invitation: { type: 'SENT', status: 'PENDING' },
      }),
    );
  });

  it('falls back to OUT_OF_NETWORK when the distance is missing', () => {
    expect(
      mapMemberRelationship({
        identity,
        response: { data: { memberRelationshipUnion: { noConnection: {} } }, included: [] },
        ownProviderId: OWN_PROVIDER_ID,
      }).network_distance,
    ).toBe('OUT_OF_NETWORK');
  });
});
