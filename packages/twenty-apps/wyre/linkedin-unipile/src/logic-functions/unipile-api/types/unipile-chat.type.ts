// GET /api/v1/chats/{chat_id}. attendee_provider_id is the other party's
// provider id in a 1:1 chat; it is missing on a group chat.
export type UnipileChat = {
  id: string;
  attendee_provider_id: string | null;
  name: string | null;
};
