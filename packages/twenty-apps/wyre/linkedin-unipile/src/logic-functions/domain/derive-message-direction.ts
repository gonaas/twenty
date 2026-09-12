import { type MessageDirection } from 'src/constants/message-direction-options';

export type UnipileMessageReceivedSender = {
  attendee_provider_id?: string | null;
};

export type UnipileMessageReceivedAccountInfo = {
  user_id: string;
};

// Direction for the message_received webhook: the sender is either the
// connected LinkedIn account (a message you sent) or the other party.
export const deriveMessageDirection = ({
  sender,
  accountInfo,
}: {
  sender: UnipileMessageReceivedSender;
  accountInfo: UnipileMessageReceivedAccountInfo;
}): MessageDirection =>
  sender.attendee_provider_id === accountInfo.user_id ? 'SENT' : 'RECEIVED';
