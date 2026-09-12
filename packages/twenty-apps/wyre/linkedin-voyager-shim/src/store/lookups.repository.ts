import { type DatabaseSync } from 'node:sqlite';

import { type UnipileUserProfile } from 'src/domain/unipile/unipile-user-profile.type';

export type CachedLookup = {
  status: number;
  profile: UnipileUserProfile | null;
  fetchedAt: string;
};

type LookupRow = {
  identifier: string;
  status: number;
  payload_json: string | null;
  fetched_at: string;
};

export const createLookupsRepository = (database: DatabaseSync) => {
  const upsertStatement = database.prepare(`
    INSERT INTO lookups (identifier, status, payload_json, fetched_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(identifier) DO UPDATE SET
      status = excluded.status,
      payload_json = excluded.payload_json,
      fetched_at = excluded.fetched_at
  `);
  const findStatement = database.prepare('SELECT * FROM lookups WHERE identifier = ?');
  const countSinceStatement = database.prepare(
    'SELECT COUNT(*) AS total FROM lookups WHERE fetched_at >= ?',
  );

  return {
    save: ({
      identifier,
      status,
      profile,
      fetchedAt,
    }: {
      identifier: string;
      status: number;
      profile: UnipileUserProfile | null;
      fetchedAt: string;
    }): void => {
      upsertStatement.run(identifier, status, profile === null ? null : JSON.stringify(profile), fetchedAt);
    },
    find: (identifier: string): CachedLookup | null => {
      const row = findStatement.get(identifier) as LookupRow | undefined;

      if (row === undefined) {
        return null;
      }

      return {
        status: row.status,
        profile: row.payload_json === null ? null : (JSON.parse(row.payload_json) as UnipileUserProfile),
        fetchedAt: row.fetched_at,
      };
    },
    countSince: (since: string): number =>
      (countSinceStatement.get(since) as { total: number }).total,
  };
};

export type LookupsRepository = ReturnType<typeof createLookupsRepository>;
