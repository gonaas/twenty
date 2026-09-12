import { type DatabaseSync } from 'node:sqlite';

import { createChatsRepository } from 'src/store/chats.repository';
import { openDatabase } from 'src/store/database';
import { createLookupsRepository } from 'src/store/lookups.repository';
import { createMessagesRepository } from 'src/store/messages.repository';
import { createMetaRepository } from 'src/store/meta.repository';
import { createRelationsRepository } from 'src/store/relations.repository';
import { createSentInvitationsRepository } from 'src/store/sent-invitations.repository';
import { createSessionRepository } from 'src/store/session.repository';

export const createStore = (path: string) => {
  const database: DatabaseSync = openDatabase(path);

  return {
    database,
    relations: createRelationsRepository(database),
    sentInvitations: createSentInvitationsRepository(database),
    chats: createChatsRepository(database),
    messages: createMessagesRepository(database),
    lookups: createLookupsRepository(database),
    session: createSessionRepository(database),
    meta: createMetaRepository(database),
    close: (): void => {
      database.close();
    },
  };
};

export type Store = ReturnType<typeof createStore>;
