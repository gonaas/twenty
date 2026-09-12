import { describe, expect, it } from 'vitest';

import { computeReconcileJitter } from 'src/logic-functions/domain/compute-reconcile-jitter';

describe('computeReconcileJitter', () => {
  it('adds 4 hours plus the random slice of 90 minutes', () => {
    const now = new Date('2026-09-11T00:00:00.000Z');

    const withZeroRandom = computeReconcileJitter(now, () => 0);
    expect(withZeroRandom.toISOString()).toBe('2026-09-11T04:00:00.000Z');

    const withMaxRandom = computeReconcileJitter(now, () => 1);
    expect(withMaxRandom.toISOString()).toBe('2026-09-11T05:30:00.000Z');
  });

  it('always schedules the next run after now', () => {
    const now = new Date();
    const next = computeReconcileJitter(now);

    expect(next.getTime()).toBeGreaterThan(now.getTime());
  });
});
