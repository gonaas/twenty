import { type MessageDirection } from 'src/constants/message-direction-options';

// One entry of the per-person message list kept in kv under
// linkedin:messages:<personId>, used to rebuild the conversation Note
// without re-fetching Unipile.
export type StoredLinkedinMessage = {
  id: string;
  at: string;
  direction: MessageDirection;
  text: string | null;
};
