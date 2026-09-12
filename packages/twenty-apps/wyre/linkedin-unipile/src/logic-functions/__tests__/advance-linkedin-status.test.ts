import { describe, expect, it } from 'vitest';

import { advanceLinkedinStatus } from 'src/logic-functions/domain/advance-linkedin-status';

describe('advanceLinkedinStatus', () => {
  it('returns the candidate when there is no current status', () => {
    expect(advanceLinkedinStatus(null, 'MESSAGE_SENT')).toBe('MESSAGE_SENT');
  });

  it('advances to a higher status', () => {
    expect(advanceLinkedinStatus('CONNECTED', 'ACCEPTED')).toBe('ACCEPTED');
    expect(advanceLinkedinStatus('ACCEPTED', 'CONVERSATION')).toBe(
      'CONVERSATION',
    );
  });

  it('never lowers the status', () => {
    expect(advanceLinkedinStatus('CONVERSATION', 'MESSAGE_SENT')).toBe(
      'CONVERSATION',
    );
    expect(advanceLinkedinStatus('MEETING', 'CONNECTED')).toBe('MEETING');
  });

  it('keeps the same status when the candidate is equal', () => {
    expect(advanceLinkedinStatus('ACCEPTED', 'ACCEPTED')).toBe('ACCEPTED');
  });

  it('MEETING always sticks', () => {
    expect(advanceLinkedinStatus('MEETING', 'CONVERSATION')).toBe('MEETING');
  });
});
