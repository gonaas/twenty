// One item of GET /api/v1/messages.
export type UnipileListedMessage = {
  id: string;
  chat_id: string;
  text: string | null;
  timestamp: string;
  is_sender: 0 | 1;
  sender_id: string | null;
  sender_attendee_id: string | null;
};
