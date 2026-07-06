// SQLite schema definitions and migration runner
import * as SQLite from "expo-sqlite";

const DB_NAME = "executive_coach.db";
const SCHEMA_VERSION = 1;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  return await SQLite.openDatabaseAsync(DB_NAME);
}

export async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS daily_logs (
      date          TEXT PRIMARY KEY,
      health        INTEGER NOT NULL DEFAULT 0,
      mind          INTEGER NOT NULL DEFAULT 0,
      launchpad     INTEGER NOT NULL DEFAULT 0,
      inner_circle  INTEGER NOT NULL DEFAULT 0,
      engine        INTEGER NOT NULL DEFAULT 0,
      spirit        INTEGER NOT NULL DEFAULT 0,
      total_score   INTEGER NOT NULL DEFAULT 0,
      mental_state  TEXT,
      mode          TEXT NOT NULL DEFAULT 'standard',
      raw_dump      TEXT NOT NULL DEFAULT '',
      coach_response TEXT,
      created_at    TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT NOT NULL DEFAULT (datetime('now')),
      synced_at     TEXT
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id          TEXT PRIMARY KEY,
      session_id  TEXT NOT NULL,
      role        TEXT NOT NULL CHECK(role IN ('user','assistant')),
      content     TEXT NOT NULL,
      mode        TEXT NOT NULL DEFAULT 'quick',
      timestamp   TEXT NOT NULL DEFAULT (datetime('now')),
      synced_at   TEXT
    );

    CREATE TABLE IF NOT EXISTS user_profile (
      id            INTEGER PRIMARY KEY DEFAULT 1,
      uid           TEXT,
      email         TEXT,
      display_name  TEXT,
      photo_url     TEXT,
      birthday      TEXT,
      tier          TEXT NOT NULL DEFAULT 'free',
      gemini_api_key TEXT,
      morning_wake  TEXT NOT NULL DEFAULT '04:50',
      evening_ritual TEXT NOT NULL DEFAULT '20:30',
      onboarded_at  TEXT
    );

    CREATE TABLE IF NOT EXISTS streak_cache (
      id         INTEGER PRIMARY KEY DEFAULT 1,
      overall    INTEGER NOT NULL DEFAULT 0,
      health     INTEGER NOT NULL DEFAULT 0,
      mind       INTEGER NOT NULL DEFAULT 0,
      launchpad  INTEGER NOT NULL DEFAULT 0,
      inner_circle INTEGER NOT NULL DEFAULT 0,
      engine     INTEGER NOT NULL DEFAULT 0,
      spirit     INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(date DESC);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, timestamp);
  `);

  // Insert default profile if not exists
  await db.runAsync(
    `INSERT OR IGNORE INTO user_profile (id) VALUES (1)`
  );
  await db.runAsync(
    `INSERT OR IGNORE INTO streak_cache (id) VALUES (1)`
  );

  await db.runAsync(
    `INSERT OR IGNORE INTO schema_version (version, applied_at) VALUES (?, datetime('now'))`,
    [SCHEMA_VERSION]
  );
}
