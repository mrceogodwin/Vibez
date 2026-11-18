import { readFileSync, existsSync } from "node:fs";
import { Pool } from "pg";

function loadEnvFile() {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq);
      const value = trimmed.slice(eq + 1);
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

const PRODUCTION_HOST_MARK = "ep-soft-wind-zam8gd6x";

loadEnvFile();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.log("DATABASE_URL is not set. Skipping migrations.");
  process.exit(0);
}

const host = new URL(databaseUrl).hostname;
if (host.includes(PRODUCTION_HOST_MARK) && process.env.MIGRATE_ALLOW_PRODUCTION !== "yes") {
  console.error(
    `Refusing to migrate ${host}. That is the production Neon endpoint. Use the cursor-phase1-rebuild branch, or set MIGRATE_ALLOW_PRODUCTION=yes for an approved additive apply.`,
  );
  process.exit(1);
}

const directUrl = databaseUrl.replace("-pooler.", ".");
const pool = new Pool({ connectionString: directUrl, max: 1 });
const sql = readFileSync(new URL("../db/migrations/0001_vibez_schema.sql", import.meta.url), "utf8");
const filename = "0001_vibez_schema.sql";

const client = await pool.connect();
try {
  const reg = await client.query("SELECT to_regclass('vibez.schema_migrations') AS name");
  if (reg.rows[0]?.name) {
    const applied = await client.query("SELECT 1 FROM vibez.schema_migrations WHERE filename = $1", [filename]);
    if (applied.rowCount) {
      console.log(`${filename} already applied on ${host}`);
      process.exit(0);
    }
  }
  const before = await client.query("SELECT count(*)::int AS n FROM public.events");
  await client.query("BEGIN");
  await client.query(sql);
  await client.query("INSERT INTO vibez.schema_migrations (filename) VALUES ($1)", [filename]);
  await client.query("COMMIT");
  const after = await client.query("SELECT count(*)::int AS n FROM public.events");
  const tables = await client.query(
    "SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = 'vibez' AND table_type = 'BASE TABLE'",
  );
  console.log(
    `Applied ${filename} on ${host}. vibez tables: ${tables.rows[0].n}. public.events rows before/after: ${before.rows[0].n}/${after.rows[0].n}.`,
  );
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  console.error(error);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}
