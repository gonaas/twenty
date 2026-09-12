import { type DatabaseSync } from 'node:sqlite';

export const META_KEYS = {
  firstSnapshotDone: 'first_snapshot_done',
  lastFullRefreshAt: 'last_full_refresh_at',
  ownProviderId: 'own_provider_id',
  rateLimitedUntil: 'rate_limited_until',
} as const;

export const createMetaRepository = (database: DatabaseSync) => {
  const getStatement = database.prepare('SELECT value FROM meta WHERE key = ?');
  const setStatement = database.prepare(`
    INSERT INTO meta (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);
  const deleteStatement = database.prepare('DELETE FROM meta WHERE key = ?');

  return {
    get: (key: string): string | null => {
      const row = getStatement.get(key) as { value: string } | undefined;

      return row?.value ?? null;
    },
    set: (key: string, value: string): void => {
      setStatement.run(key, value);
    },
    delete: (key: string): void => {
      deleteStatement.run(key);
    },
  };
};

export type MetaRepository = ReturnType<typeof createMetaRepository>;
