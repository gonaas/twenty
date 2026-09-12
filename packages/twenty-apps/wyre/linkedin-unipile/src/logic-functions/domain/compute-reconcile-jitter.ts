const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
const NINETY_MINUTES_MS = 90 * 60 * 1000;

// Unipile asks that automated reads not run at fixed times; each run
// schedules the next one 4h-5h30 out.
export const computeReconcileJitter = (
  now: Date,
  random: () => number = Math.random,
): Date => new Date(now.getTime() + FOUR_HOURS_MS + random() * NINETY_MINUTES_MS);
