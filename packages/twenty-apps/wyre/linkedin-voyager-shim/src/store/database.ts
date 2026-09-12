import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS relations (
  member_id TEXT PRIMARY KEY,
  public_identifier TEXT,
  public_profile_url TEXT,
  first_name TEXT,
  last_name TEXT,
  headline TEXT,
  created_at INTEGER,
  seen_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS relations_created_at ON relations (created_at DESC, member_id ASC);

CREATE TABLE IF NOT EXISTS sent_invitations (
  id TEXT PRIMARY KEY,
  invited_user TEXT,
  invited_user_id TEXT,
  invited_user_public_id TEXT,
  date TEXT NOT NULL,
  parsed_datetime TEXT,
  invitation_text TEXT,
  seen_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS chats (
  id TEXT PRIMARY KEY,
  attendee_provider_id TEXT,
  attendees_json TEXT NOT NULL,
  name TEXT,
  is_group INTEGER NOT NULL,
  last_activity_at TEXT,
  synced_activity_at TEXT
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  text TEXT,
  timestamp TEXT NOT NULL,
  is_sender INTEGER NOT NULL,
  sender_id TEXT,
  sender_attendee_id TEXT
);
CREATE INDEX IF NOT EXISTS messages_timestamp ON messages (timestamp ASC, id ASC);

CREATE TABLE IF NOT EXISTS lookups (
  identifier TEXT PRIMARY KEY,
  status INTEGER NOT NULL,
  payload_json TEXT,
  fetched_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS session (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  li_at TEXT,
  jsessionid TEXT,
  state TEXT NOT NULL,
  last_alive_at TEXT,
  died_reason TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

export const openDatabase = (path: string): DatabaseSync => {
  if (path !== ':memory:') {
    mkdirSync(dirname(path), { recursive: true });
  }

  const database = new DatabaseSync(path);

  database.exec('PRAGMA journal_mode = WAL');
  database.exec('PRAGMA foreign_keys = ON');
  database.exec(SCHEMA);

  return database;
};

export const runInTransaction = <TResult>(database: DatabaseSync, work: () => TResult): TResult => {
  database.exec('BEGIN');

  try {
    const result = work();

    database.exec('COMMIT');

    return result;
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
};
