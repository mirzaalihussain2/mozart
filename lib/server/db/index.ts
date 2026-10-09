import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// One client per process, reused across dev hot reloads. `prepare: false`
// because Supabase's transaction pooler (port 6543) doesn't support prepared
// statements.

const globalForDb = globalThis as unknown as {
  mozartSql?: postgres.Sql;
  mozartDb?: PostgresJsDatabase<typeof schema>;
};

function connect(): PostgresJsDatabase<typeof schema> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const sql = globalForDb.mozartSql ?? postgres(url, { prepare: false });
  globalForDb.mozartSql = sql;
  return drizzle(sql, { schema });
}

export const db = globalForDb.mozartDb ?? connect();
if (process.env.NODE_ENV !== "production") globalForDb.mozartDb = db;

export { schema };
