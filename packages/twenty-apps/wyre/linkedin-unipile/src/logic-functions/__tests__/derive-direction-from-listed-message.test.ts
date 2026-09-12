import { describe, expect, it } from 'vitest';

import { deriveDirectionFromListedMessage } from 'src/logic-functions/domain/derive-direction-from-listed-message';

describe('deriveDirectionFromListedMessage', () => {
  it('is SENT when is_sender is 1', () => {
    expect(deriveDirectionFromListedMessage({ is_sender: 1 })).toBe('SENT');
  });

  it('is RECEIVED when is_sender is 0', () => {
    expect(deriveDirectionFromListedMessage({ is_sender: 0 })).toBe(
      'RECEIVED',
    );
  });
});
