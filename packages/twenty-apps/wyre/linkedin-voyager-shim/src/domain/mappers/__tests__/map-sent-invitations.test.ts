import { mapSentInvitations } from 'src/domain/mappers/map-sent-invitations.util';
import { loadVoyagerFixture } from 'src/test-support/load-fixture.util';

describe('mapSentInvitations', () => {
  it('maps invitation views to Unipile sent invitations with an ISO parsed_datetime', () => {
    expect(mapSentInvitations(loadVoyagerFixture('sent-invitations'))).toEqual([
      {
        id: '7001',
        invited_user: 'Carol Invited',
        invited_user_id: 'ACoAAAAAAA3',
        invited_user_public_id: 'carol-invited',
        date: '2025-09-09T06:40:00.000Z',
        parsed_datetime: '2025-09-09T06:40:00.000Z',
        invitation_text: "Hi Carol, let's connect.",
      },
    ]);
  });
});
