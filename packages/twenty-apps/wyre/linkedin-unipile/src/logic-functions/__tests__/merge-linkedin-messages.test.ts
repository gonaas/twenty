import { describe, expect, it } from 'vitest';

import { mergeLinkedinMessages } from 'src/logic-functions/domain/merge-linkedin-messages';
import { type StoredLinkedinMessage } from 'src/logic-functions/types/stored-linkedin-message.type';

describe('mergeLinkedinMessages', () => {
  it('dedupes by id', () => {
    const existing: StoredLinkedinMessage[] = [
      { id: '1', at: '2026-09-10T09:00:00.000Z', direction: 'SENT', text: 'Hello' },
    ];
    const incoming: StoredLinkedinMessage[] = [
      { id: '1', at: '2026-09-10T09:00:00.000Z', direction: 'SENT', text: 'Hello (edited)' },
      { id: '2', at: '2026-09-11T09:00:00.000Z', direction: 'RECEIVED', text: 'Hi' },
    ];

    const merged = mergeLinkedinMessages(existing, incoming);

    expect(merged).toHaveLength(2);
    expect(merged.find((message) => message.id === '1')?.text).toBe(
      'Hello (edited)',
    );
  });

  it('sorts chronologically', () => {
    const merged = mergeLinkedinMessages(
      [],
      [
        { id: '2', at: '2026-09-11T09:00:00.000Z', direction: 'RECEIVED', text: 'Second' },
        { id: '1', at: '2026-09-10T09:00:00.000Z', direction: 'SENT', text: 'First' },
      ],
    );

    expect(merged.map((message) => message.id)).toEqual(['1', '2']);
  });

  it('caps the result at the most recent 500 messages', () => {
    const existing: StoredLinkedinMessage[] = Array.from(
      { length: 500 },
      (_, index) => ({
        id: `existing-${index}`,
        at: new Date(Date.UTC(2020, 0, 1) + index * 60_000).toISOString(),
        direction: 'SENT' as const,
        text: 'message',
      }),
    );

    const merged = mergeLinkedinMessages(existing, [
      {
        id: 'newest',
        at: new Date(Date.UTC(2026, 0, 1)).toISOString(),
        direction: 'RECEIVED',
        text: 'newest message',
      },
    ]);

    expect(merged).toHaveLength(500);
    expect(merged[merged.length - 1].id).toBe('newest');
    expect(merged.find((message) => message.id === 'existing-0')).toBeUndefined();
  });
});
