import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const env = {
    databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
    authSecretConfigured: Boolean(process.env.BETTER_AUTH_SECRET),
    authUrlConfigured: Boolean(process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL),
  };
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT
        current_database() AS database,
        to_regclass('public."user"') IS NOT NULL AS has_user_table,
        to_regclass('public.session') IS NOT NULL AS has_session_table,
        to_regclass('public.account') IS NOT NULL AS has_account_table,
        to_regclass('public.verification') IS NOT NULL AS has_verification_table
    `;
    const row = rows[0] as Record<string, unknown> | undefined;
    const schema = {
      user: row?.has_user_table === true,
      session: row?.has_session_table === true,
      account: row?.has_account_table === true,
      verification: row?.has_verification_table === true,
    };
    const ready = Object.values(schema).every(Boolean) && Object.values(env).every(Boolean);
    return NextResponse.json(
      { status: ready ? "ok" : "needs-configuration", auth: { configured: Object.values(env).every(Boolean) }, schema, database: row?.database ?? null },
      { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { status: "unavailable", auth: { configured: Object.values(env).every(Boolean) }, schema: null, database: null },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
