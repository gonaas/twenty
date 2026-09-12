import { type SelectOptionMeta } from 'src/types/select-option-meta';

export type LinkedinConnection =
  | 'NOT_CONNECTED'
  | 'INVITATION_SENT'
  | 'INVITATION_RECEIVED'
  | 'CONNECTED';

export const LINKEDIN_CONNECTION_OPTIONS: readonly SelectOptionMeta[] = [
  {
    key: 'notConnected',
    value: 'NOT_CONNECTED',
    label: 'Not connected',
    color: 'gray',
    position: 0,
  },
  {
    key: 'invitationSent',
    value: 'INVITATION_SENT',
    label: 'Invitation sent',
    color: 'yellow',
    position: 1,
  },
  {
    key: 'invitationReceived',
    value: 'INVITATION_RECEIVED',
    label: 'Invitation received',
    color: 'blue',
    position: 2,
  },
  {
    key: 'connected',
    value: 'CONNECTED',
    label: 'Connected',
    color: 'green',
    position: 3,
  },
];
