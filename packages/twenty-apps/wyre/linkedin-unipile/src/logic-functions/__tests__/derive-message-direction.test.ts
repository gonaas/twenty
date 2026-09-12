import { describe, expect, it } from 'vitest';

import { deriveMessageDirection } from 'src/logic-functions/domain/derive-message-direction';

describe('deriveMessageDirection', () => {
  it('is SENT when the sender is the connected account', () => {
    expect(
      deriveMessageDirection({
        sender: { attendee_provider_id: 'me' },
        accountInfo: { user_id: 'me' },
      }),
    ).toBe('SENT');
  });

  it('is RECEIVED when the sender is the other party', () => {
    expect(
      deriveMessageDirection({
        sender: { attendee_provider_id: 'them' },
        accountInfo: { user_id: 'me' },
      }),
    ).toBe('RECEIVED');
  });

  it('is RECEIVED when the sender id is missing', () => {
    expect(
      deriveMessageDirection({
        sender: {},
        accountInfo: { user_id: 'me' },
      }),
    ).toBe('RECEIVED');
  });
});
