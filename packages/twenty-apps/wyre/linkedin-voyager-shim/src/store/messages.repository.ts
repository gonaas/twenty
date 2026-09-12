import { type DatabaseSync } from 'node:sqlite';

import { type UnipileListedMessage } from 'src/domain/unipile/unipile-listed-message.type';
import { runInTransaction } from 'src/store/database';

type MessageRow = Omit<UnipileListedMessage, 'is_sender'> & { is_sender: number };

const toMessage = (row: MessageRow): UnipileListedMessage => ({
  id: row.id,
  chat_id: row.chat_id,
  text: row.text,
  timestamp: row.timestamp,
  is_sender: row.is_sender === 1 ? 1 : 0,
  sender_id: row.sender_id,
  sender_attendee_id: row.sender_attendee_id,
});

export const createMessagesRepository = (database: DatabaseSync) => {
  const upsertStatement = database.prepare(`
    INSERT INTO messages (id, chat_id, text, timestamp, is_sender, sender_id, sender_attendee_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      text = excluded.text,
      timestamp = excluded.timestamp,
      is_sender = excluded.is_sender,
      sender_id = excluded.sender_id,
      sender_attendee_id = excluded.sender_attendee_id
  `);
  const pageStatement = database.prepare(
    'SELECT * FROM messages ORDER BY timestamp ASC, id ASC LIMIT ? OFFSET ?',
  );
  const pageAfterStatement = database.prepare(
    'SELECT * FROM messages WHERE timestamp > ? ORDER BY timestamp ASC, id ASC LIMIT ? OFFSET ?',
  );
  const countStatement = database.prepare('SELECT COUNT(*) AS total FROM messages');
  const countAfterStatement = database.prepare(
    'SELECT COUNT(*) AS total FROM messages WHERE timestamp > ?',
  );
  const idsForChatStatement = database.prepare('SELECT id FROM messages WHERE chat_id = ?');

  return {
    upsertMany: (messages: UnipileListedMessage[]): void => {
      runInTransaction(database, () => {
        for (const message of messages) {
          upsertStatement.run(
            message.id,
            message.chat_id,
            message.text,
            message.timestamp,
            message.is_sender,
            message.sender_id,
            message.sender_attendee_id,
          );
        }
      });
    },
    page: ({
      after,
      limit,
      offset,
    }: {
      after?: string;
      limit: number;
      offset: number;
    }): UnipileListedMessage[] => {
      const rows =
        after === undefined
          ? pageStatement.all(limit, offset)
          : pageAfterStatement.all(after, limit, offset);

      return (rows as MessageRow[]).map(toMessage);
    },
    count: ({ after }: { after?: string }): number => {
      const row =
        after === undefined ? countStatement.get() : countAfterStatement.get(after);

      return (row as { total: number }).total;
    },
    idsForChat: (chatId: string): Set<string> =>
      new Set((idsForChatStatement.all(chatId) as { id: string }[]).map((row) => row.id)),
  };
};

export type MessagesRepository = ReturnType<typeof createMessagesRepository>;
