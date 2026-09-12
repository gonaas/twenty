import { type UnipileWebhookAttendee } from 'src/logic-functions/unipile-api/types/unipile-webhook-attendee.type';

export type UnipileMessageReceivedWebhookPayload = {
  event: 'message_received';
  account_id: string;
  account_type: string;
  chat_id: string;
  message_id: string;
  message: string | null;
  timestamp: string;
  sender: UnipileWebhookAttendee;
  attendees: UnipileWebhookAttendee[];
  account_info: { user_id: string };
};
