import { type DatabaseSync } from 'node:sqlite';

export type SessionState = 'STARTING' | 'ALIVE' | 'DEAD';

export type StoredSession = {
  liAt: string | null;
  jsessionid: string | null;
  state: SessionState;
  lastAliveAt: string | null;
  diedReason: string | null;
};

type SessionRow = {
  li_at: string | null;
  jsessionid: string | null;
  state: SessionState;
  last_alive_at: string | null;
  died_reason: string | null;
};

export const createSessionRepository = (database: DatabaseSync) => {
  const findStatement = database.prepare('SELECT * FROM session WHERE id = 1');
  const upsertStatement = database.prepare(`
    INSERT INTO session (id, li_at, jsessionid, state, last_alive_at, died_reason, updated_at)
    VALUES (1, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      li_at = excluded.li_at,
      jsessionid = excluded.jsessionid,
      state = excluded.state,
      last_alive_at = excluded.last_alive_at,
      died_reason = excluded.died_reason,
      updated_at = excluded.updated_at
  `);

  return {
    find: (): StoredSession | null => {
      const row = findStatement.get() as SessionRow | undefined;

      if (row === undefined) {
        return null;
      }

      return {
        liAt: row.li_at,
        jsessionid: row.jsessionid,
        state: row.state,
        lastAliveAt: row.last_alive_at,
        diedReason: row.died_reason,
      };
    },
    save: (session: StoredSession): void => {
      upsertStatement.run(
        session.liAt,
        session.jsessionid,
        session.state,
        session.lastAliveAt,
        session.diedReason,
        new Date().toISOString(),
      );
    },
  };
};

export type SessionRepository = ReturnType<typeof createSessionRepository>;
