import { describe, expect, it } from 'vitest';

import { mapProfileToConnection } from 'src/logic-functions/domain/map-profile-to-connection';

describe('mapProfileToConnection', () => {
  it('maps FIRST_DEGREE to CONNECTED regardless of invitation', () => {
    expect(
      mapProfileToConnection({ networkDistance: 'FIRST_DEGREE', invitation: null }),
    ).toBe('CONNECTED');
  });

  it('maps a pending sent invitation to INVITATION_SENT', () => {
    expect(
      mapProfileToConnection({
        networkDistance: 'SECOND_DEGREE',
        invitation: { type: 'SENT', status: 'PENDING' },
      }),
    ).toBe('INVITATION_SENT');
  });

  it('maps a pending received invitation to INVITATION_RECEIVED', () => {
    expect(
      mapProfileToConnection({
        networkDistance: 'OUT_OF_NETWORK',
        invitation: { type: 'RECEIVED', status: 'PENDING' },
      }),
    ).toBe('INVITATION_RECEIVED');
  });

  it('maps a withdrawn sent invitation to NOT_CONNECTED', () => {
    expect(
      mapProfileToConnection({
        networkDistance: 'THIRD_DEGREE',
        invitation: { type: 'SENT', status: 'WITHDRAWN' },
      }),
    ).toBe('NOT_CONNECTED');
  });

  it('maps no invitation to NOT_CONNECTED', () => {
    expect(
      mapProfileToConnection({ networkDistance: 'THIRD_DEGREE', invitation: null }),
    ).toBe('NOT_CONNECTED');
  });
});
