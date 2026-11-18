import { Pool, type PoolClient } from "pg";

export type Db = Pick<Pool | PoolClient, "query">;

let pool: Pool | undefined;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    pool = new Pool({ connectionString, max: 5 });
    void attach(pool);
  }
  return pool;
}

async function attach(next: Pool) {
  try {
    const mod = await import("@vercel/functions");
    if (typeof mod.attachDatabasePool === "function") mod.attachDatabasePool(next);
  } catch {
    // Local tests and non-Vercel runtimes do not have the helper.
  }
}

export async function withTx<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
