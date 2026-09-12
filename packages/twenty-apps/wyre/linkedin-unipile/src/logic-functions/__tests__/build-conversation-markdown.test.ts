import { describe, expect, it } from 'vitest';

import { buildConversationMarkdown } from 'src/logic-functions/domain/build-conversation-markdown';

describe('buildConversationMarkdown', () => {
  it('renders messages chronologically regardless of input order', () => {
    const markdown = buildConversationMarkdown([
      { id: '2', at: '2026-09-11T14:03:00.000Z', direction: 'RECEIVED', text: 'Hi there' },
      { id: '1', at: '2026-09-10T09:00:00.000Z', direction: 'SENT', text: 'Hello' },
    ]);

    const firstIndex = markdown.indexOf('Hello');
    const secondIndex = markdown.indexOf('Hi there');

    expect(firstIndex).toBeGreaterThanOrEqual(0);
    expect(secondIndex).toBeGreaterThan(firstIndex);
  });

  it('labels the connected account as You and the other party as Them', () => {
    const markdown = buildConversationMarkdown([
      { id: '1', at: '2026-09-10T09:00:00.000Z', direction: 'SENT', text: 'Hello' },
      { id: '2', at: '2026-09-11T14:03:00.000Z', direction: 'RECEIVED', text: 'Hi there' },
    ]);

    expect(markdown).toContain('**You**');
    expect(markdown).toContain('**Them**');
  });

  it('keeps a placeholder for messages with no text instead of dropping them', () => {
    const markdown = buildConversationMarkdown([
      { id: '1', at: '2026-09-10T09:00:00.000Z', direction: 'SENT', text: null },
    ]);

    expect(markdown).toContain('(attachment)');
  });
});
