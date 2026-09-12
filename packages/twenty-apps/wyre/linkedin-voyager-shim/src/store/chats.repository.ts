import { type DatabaseSync } from 'node:sqlite';

import { type ChatAttendee, type ChatSnapshot } from 'src/domain/mappers/map-conversations-to-chats.util';
import { type UnipileChat } from 'src/domain/unipile/unipile-chat.type';
import { runInTransaction } from 'src/store/database';

type ChatRow = {
  id: string;
  attendee_provider_id: string | null;
  attendees_json: string;
  name: string | null;
  is_group: number;
  last_activity_at: string | null;
  synced_activity_at: string | null;
};

export type StoredChat = UnipileChat & {
  attendees: ChatAttendee[];
  isGroup: boolean;
  lastActivityAt: string | null;
  syncedActivityAt: string | null;
};

const toStoredChat = (row: ChatRow): StoredChat => ({
  id: row.id,
  attendee_provider_id: row.attendee_provider_id,
  name: row.name,
  attendees: JSON.parse(row.attendees_json) as ChatAttendee[],
  isGroup: row.is_group === 1,
  lastActivityAt: row.last_activity_at,
  syncedActivityAt: row.synced_activity_at,
});

export const createChatsRepository = (database: DatabaseSync) => {
  const upsertStatement = database.prepare(`
    INSERT INTO chats (id, attendee_provider_id, attendees_json, name, is_group, last_activity_at, synced_activity_at)
    VALUES (?, ?, ?, ?, ?, ?, NULL)
    ON CONFLICT(id) DO UPDATE SET
      attendee_provider_id = excluded.attendee_provider_id,
      attendees_json = excluded.attendees_json,
      name = excluded.name,
      is_group = excluded.is_group,
      last_activity_at = excluded.last_activity_at
  `);
  const markSyncedStatement = database.prepare('UPDATE chats SET synced_activity_at = ? WHERE id = ?');
  const findStatement = database.prepare('SELECT * FROM chats WHERE id = ?');
  const pendingStatement = database.prepare(`
    SELECT * FROM chats
    WHERE last_activity_at IS NOT NULL
      AND (synced_activity_at IS NULL OR synced_activity_at < last_activity_at)
    ORDER BY last_activity_at DESC
  `);

  return {
    upsertMany: (chats: ChatSnapshot[]): void => {
      runInTransaction(database, () => {
        for (const chat of chats) {
          upsertStatement.run(
            chat.id,
            chat.isGroup ? null : (chat.attendees[0]?.providerId ?? null),
            JSON.stringify(chat.attendees),
            chat.name,
            chat.isGroup ? 1 : 0,
            chat.lastActivityAt,
          );
        }
      });
    },
    markSynced: (chatId: string, activityAt: string): void => {
      markSyncedStatement.run(activityAt, chatId);
    },
    find: (chatId: string): StoredChat | null => {
      const row = findStatement.get(chatId) as ChatRow | undefined;

      return row === undefined ? null : toStoredChat(row);
    },
    pendingSync: (): StoredChat[] => (pendingStatement.all() as ChatRow[]).map(toStoredChat),
  };
};

export type ChatsRepository = ReturnType<typeof createChatsRepository>;
