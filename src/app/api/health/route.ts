import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const env = {
    databaseUrlConfigured: Boolean(process.env.VIBEZ_DATABASE_URL || process.env.DATABASE_URL),
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
        to_regclass('public.verification') IS NOT NULL AS has_verification_table,
        to_regclass('public.creator_station_profiles') IS NOT NULL AS has_station_profiles,
        to_regclass('public.content_reports') IS NOT NULL AS has_content_reports,
        to_regclass('public.admin_audit_log') IS NOT NULL AS has_admin_audit_log,
        to_regclass('public.station_broadcast_sessions') IS NOT NULL AS has_broadcast_sessions,
        to_regclass('public.communities') IS NOT NULL AS has_communities,
        to_regclass('public.posts') IS NOT NULL AS has_posts
    `;
    const row = rows[0] as Record<string, unknown> | undefined;
    const schema = {
      user: row?.has_user_table === true,
      session: row?.has_session_table === true,
      account: row?.has_account_table === true,
      verification: row?.has_verification_table === true,
    };
    const adminSchema = {
      stationProfiles: row?.has_station_profiles === true,
      contentReports: row?.has_content_reports === true,
      auditLog: row?.has_admin_audit_log === true,
      broadcastSessions: row?.has_broadcast_sessions === true,
      communities: row?.has_communities === true,
      posts: row?.has_posts === true,
    };
    const authReady = Object.values(schema).every(Boolean) && Object.values(env).every(Boolean);
    const adminReady = Object.values(adminSchema).every(Boolean);
    const ready = authReady && adminReady;
    return NextResponse.json(
      { status: ready ? "ok" : "needs-configuration", auth: { configured: Object.values(env).every(Boolean), ready: authReady }, schema, admin: { ready: adminReady, schema: adminSchema }, database: row?.database ?? null },
      { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { status: "unavailable", auth: { configured: Object.values(env).every(Boolean) }, schema: null, database: null },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
