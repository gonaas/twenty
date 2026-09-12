// The first snapshot after install would otherwise replay the whole network
// history as "new" events into the CRM.
export const shouldEmitWebhooks = ({
  firstSnapshotDone,
  webhooksConfigured,
}: {
  firstSnapshotDone: boolean;
  webhooksConfigured: boolean;
}): boolean => firstSnapshotDone && webhooksConfigured;
