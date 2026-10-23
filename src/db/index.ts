import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import path from 'path';
import * as schema from './schema';

const globalForDb = global as unknown as { sqlite: Database.Database | undefined };

if (!globalForDb.sqlite) {
  const dbPath = process.env.DATABASE_PATH || path.resolve(process.cwd(), 'sqlite.db');
  globalForDb.sqlite = new Database(dbPath);
  try {
    globalForDb.sqlite.pragma('journal_mode = WAL');
  } catch (err) {
    console.warn('Could not set journal_mode = WAL, falling back:', err);
    try {
      globalForDb.sqlite.pragma('journal_mode = DELETE');
    } catch (e) {
      console.warn('Could not set journal mode:', e);
    }
  }
}

export const db = drizzle(globalForDb.sqlite, { schema });
export type DbType = typeof db;
