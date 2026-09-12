import { type LinkedinConnection } from 'src/constants/linkedin-connection-options';
import { type LinkedinStatus } from 'src/constants/linkedin-status-order';
import { type MessageDirection } from 'src/constants/message-direction-options';

// Flattened view of the Person fields this app reads and writes.
export type LinkedinPersonRecord = {
  id: string;
  linkedinLinkUrl: string | null;
  linkedinMemberId: string | null;
  linkedinChatId: string | null;
  linkedinConnection: LinkedinConnection | null;
  linkedinConnectedAt: string | null;
  linkedinInvitationSentAt: string | null;
  linkedinLastMessageAt: string | null;
  linkedinLastMessageDirection: MessageDirection | null;
  linkedinMessagesSent: number | null;
  linkedinMessagesReceived: number | null;
  linkedinSyncedAt: string | null;
  linkedinStatus: LinkedinStatus | null;
};

// A person loaded for one reconcile run, plus the fields accumulated to
// persist once at the end of the run.
export type LinkedinWorkingPerson = LinkedinPersonRecord & {
  pendingUpdate: Record<string, unknown>;
};
