import { type MessageDirection } from 'src/constants/message-direction-options';

// Direction for a message returned by GET /api/v1/messages: is_sender is 1
// when the connected LinkedIn account sent it.
export const deriveDirectionFromListedMessage = (message: {
  is_sender: 0 | 1;
}): MessageDirection => (message.is_sender === 1 ? 'SENT' : 'RECEIVED');
