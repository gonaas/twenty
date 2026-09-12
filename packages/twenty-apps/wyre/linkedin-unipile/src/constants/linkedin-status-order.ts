export type LinkedinStatus =
  | 'CONNECTED'
  | 'ACCEPTED'
  | 'MESSAGE_SENT'
  | 'CONVERSATION'
  | 'MEETING';

// Existing hand-created workspace field; this app only ever advances it.
export const LINKEDIN_STATUS_ORDER: Record<LinkedinStatus, number> = {
  CONNECTED: 0,
  ACCEPTED: 1,
  MESSAGE_SENT: 2,
  CONVERSATION: 3,
  MEETING: 4,
};
