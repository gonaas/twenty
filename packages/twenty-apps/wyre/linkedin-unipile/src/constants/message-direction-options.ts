import { type SelectOptionMeta } from 'src/types/select-option-meta';

export type MessageDirection = 'SENT' | 'RECEIVED';

export const MESSAGE_DIRECTION_OPTIONS: readonly SelectOptionMeta[] = [
  { key: 'sent', value: 'SENT', label: 'Sent', color: 'blue', position: 0 },
  {
    key: 'received',
    value: 'RECEIVED',
    label: 'Received',
    color: 'green',
    position: 1,
  },
];
