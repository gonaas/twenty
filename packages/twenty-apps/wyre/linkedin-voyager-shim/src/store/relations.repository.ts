import { type DatabaseSync } from 'node:sqlite';

import { type UnipileRelation } from 'src/domain/unipile/unipile-relation.type';
import { runInTransaction } from 'src/store/database';

type RelationRow = {
  member_id: string;
  public_identifier: string | null;
  public_profile_url: string | null;
  first_name: string | null;
  last_name: string | null;
  headline: string | null;
  created_at: number | null;
};

const toRelation = (row: RelationRow): UnipileRelation => ({
  member_id: row.member_id,
  public_identifier: row.public_identifier,
  public_profile_url: row.public_profile_url,
  first_name: row.first_name,
  last_name: row.last_name,
  headline: row.headline,
  created_at: row.created_at,
});

export const createRelationsRepository = (database: DatabaseSync) => {
  const upsertStatement = database.prepare(`
    INSERT INTO relations (member_id, public_identifier, public_profile_url, first_name, last_name, headline, created_at, seen_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(member_id) DO UPDATE SET
      public_identifier = excluded.public_identifier,
      public_profile_url = excluded.public_profile_url,
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      headline = excluded.headline,
      created_at = COALESCE(excluded.created_at, relations.created_at),
      seen_at = excluded.seen_at
  `);
  const pageStatement = database.prepare(
    'SELECT * FROM relations ORDER BY created_at DESC, member_id ASC LIMIT ? OFFSET ?',
  );
  const countStatement = database.prepare('SELECT COUNT(*) AS total FROM relations');
  const memberIdsStatement = database.prepare('SELECT member_id FROM relations');

  return {
    upsertMany: (relations: UnipileRelation[], seenAt: string): void => {
      runInTransaction(database, () => {
        for (const relation of relations) {
          upsertStatement.run(
            relation.member_id,
            relation.public_identifier,
            relation.public_profile_url,
            relation.first_name,
            relation.last_name,
            relation.headline,
            typeof relation.created_at === 'number' ? relation.created_at : null,
            seenAt,
          );
        }
      });
    },
    page: ({ limit, offset }: { limit: number; offset: number }): UnipileRelation[] =>
      (pageStatement.all(limit, offset) as RelationRow[]).map(toRelation),
    count: (): number => (countStatement.get() as { total: number }).total,
    memberIds: (): Set<string> =>
      new Set((memberIdsStatement.all() as { member_id: string }[]).map((row) => row.member_id)),
  };
};

export type RelationsRepository = ReturnType<typeof createRelationsRepository>;
