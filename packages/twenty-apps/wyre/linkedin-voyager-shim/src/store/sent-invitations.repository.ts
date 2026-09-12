import { type DatabaseSync } from 'node:sqlite';

import { type UnipileSentInvitation } from 'src/domain/unipile/unipile-sent-invitation.type';
import { runInTransaction } from 'src/store/database';

type SentInvitationRow = UnipileSentInvitation & { seen_at: string };

const toSentInvitation = (row: SentInvitationRow): UnipileSentInvitation => ({
  id: row.id,
  invited_user: row.invited_user,
  invited_user_id: row.invited_user_id,
  invited_user_public_id: row.invited_user_public_id,
  date: row.date,
  parsed_datetime: row.parsed_datetime,
  invitation_text: row.invitation_text,
});

export const createSentInvitationsRepository = (database: DatabaseSync) => {
  const upsertStatement = database.prepare(`
    INSERT INTO sent_invitations (id, invited_user, invited_user_id, invited_user_public_id, date, parsed_datetime, invitation_text, seen_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      invited_user = excluded.invited_user,
      invited_user_id = excluded.invited_user_id,
      invited_user_public_id = excluded.invited_user_public_id,
      date = excluded.date,
      parsed_datetime = excluded.parsed_datetime,
      invitation_text = excluded.invitation_text,
      seen_at = excluded.seen_at
  `);
  // An invitation that vanished from LinkedIn was accepted, withdrawn or
  // ignored; keeping it would make the CRM believe it is still pending.
  const deleteStaleStatement = database.prepare('DELETE FROM sent_invitations WHERE seen_at <> ?');
  const pageStatement = database.prepare(
    'SELECT * FROM sent_invitations ORDER BY parsed_datetime DESC, id ASC LIMIT ? OFFSET ?',
  );
  const countStatement = database.prepare('SELECT COUNT(*) AS total FROM sent_invitations');

  return {
    replaceAll: (invitations: UnipileSentInvitation[], seenAt: string): void => {
      runInTransaction(database, () => {
        for (const invitation of invitations) {
          upsertStatement.run(
            invitation.id,
            invitation.invited_user,
            invitation.invited_user_id,
            invitation.invited_user_public_id,
            invitation.date,
            invitation.parsed_datetime,
            invitation.invitation_text,
            seenAt,
          );
        }

        deleteStaleStatement.run(seenAt);
      });
    },
    page: ({ limit, offset }: { limit: number; offset: number }): UnipileSentInvitation[] =>
      (pageStatement.all(limit, offset) as SentInvitationRow[]).map(toSentInvitation),
    count: (): number => (countStatement.get() as { total: number }).total,
  };
};

export type SentInvitationsRepository = ReturnType<typeof createSentInvitationsRepository>;
