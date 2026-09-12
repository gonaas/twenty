import { LINKEDIN_MESSAGE_HISTORY_LIMIT } from 'src/constants/server-variables';
import { type StoredLinkedinMessage } from 'src/logic-functions/types/stored-linkedin-message.type';

// Dedupes by id (an incoming message wins over a stored one with the same
// id), sorts chronologically, and caps at the most recent
// LINKEDIN_MESSAGE_HISTORY_LIMIT entries.
export const mergeLinkedinMessages = (
  existing: StoredLinkedinMessage[],
  incoming: StoredLinkedinMessage[],
): StoredLinkedinMessage[] => {
  const byId = new Map<string, StoredLinkedinMessage>();

  for (const message of [...existing, ...incoming]) {
    byId.set(message.id, message);
  }

  return Array.from(byId.values())
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
    .slice(-LINKEDIN_MESSAGE_HISTORY_LIMIT);
};
