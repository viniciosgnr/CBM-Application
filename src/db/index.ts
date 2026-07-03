import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

const globalForDb = global as unknown as { sqlite: Database.Database | undefined };

if (!globalForDb.sqlite) {
  globalForDb.sqlite = new Database('sqlite.db');
}

export const db = drizzle(globalForDb.sqlite, { schema });
export type DbType = typeof db;
