import { mapConnectionsToRelations } from 'src/domain/mappers/map-connections-to-relations.util';
import { loadVoyagerFixture } from 'src/test-support/load-fixture.util';

describe('mapConnectionsToRelations', () => {
  it('maps dash connections to Unipile relations with epoch-ms created_at', () => {
    const relations = mapConnectionsToRelations(loadVoyagerFixture('connections'));

    expect(relations).toEqual([
      {
        member_id: 'ACoAAAAAAA1',
        public_identifier: 'alice-example',
        public_profile_url: 'https://www.linkedin.com/in/alice-example/',
        first_name: 'Alice',
        last_name: 'Example',
        headline: 'CTO at Example',
        created_at: 1789115449000,
      },
      {
        member_id: 'ACoAAAAAAA2',
        public_identifier: null,
        public_profile_url: null,
        first_name: 'Bob',
        last_name: 'Hidden',
        headline: null,
        created_at: 1788500000000,
      },
      {
        member_id: 'ACoAAAAAAA3',
        public_identifier: null,
        public_profile_url: null,
        first_name: null,
        last_name: null,
        headline: null,
        created_at: 1788400000000,
      },
    ]);
  });

  it('returns an empty list when the page has no elements', () => {
    expect(mapConnectionsToRelations({ data: { '*elements': [] }, included: [] })).toEqual([]);
  });
});
