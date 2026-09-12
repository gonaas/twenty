import { isNonEmptyString } from '@sniptt/guards';

import { type StoredLinkedinMessage } from 'src/logic-functions/types/stored-linkedin-message.type';

const pad = (value: number): string => String(value).padStart(2, '0');

const formatTimestamp = (at: string): string => {
  const date = new Date(at);

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// Chronological, one paragraph per message; a message with no text (an
// attachment on LinkedIn) still gets a line, with a placeholder instead of
// being dropped.
export const buildConversationMarkdown = (
  messages: StoredLinkedinMessage[],
): string =>
  [...messages]
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
    .map((message) => {
      const speaker = message.direction === 'SENT' ? 'You' : 'Them';
      const text = isNonEmptyString(message.text)
        ? message.text
        : '(attachment)';

      return `**${speaker}** (${formatTimestamp(message.at)})\n${text}`;
    })
    .join('\n\n');
