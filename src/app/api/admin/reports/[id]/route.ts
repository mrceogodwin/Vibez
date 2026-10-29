import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const adminEmails = new Set(
  (process.env.VIBEZ_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { response: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  const email = (session.user.email ?? "").toLowerCase();
  if (!email || !adminEmails.has(email)) {
    return { response: NextResponse.json({ error: "Super Admin access required." }, { status: 403 }) };
  }
  return { user: session.user };
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await requireAdmin();
  if ("response" in access) return access.response;

  const { id } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid report ID." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "A report action is required." }, { status: 400 });
  }
  const status = (body as Record<string, unknown>).status;
  if (status !== "reviewing" && status !== "resolved" && status !== "dismissed") {
    return NextResponse.json({ error: "Choose reviewing, resolved, or dismissed." }, { status: 400 });
  }

  try {
    const sql = getDb();
    const rows = await sql`
      WITH updated AS (
        UPDATE content_reports
        SET status = ${status},
            resolved_at = CASE WHEN ${status} IN ('resolved', 'dismissed') THEN now() ELSE NULL END
        WHERE id = ${id}::uuid
        RETURNING id, status, resolved_at
      ),
      logged AS (
        INSERT INTO admin_audit_log (actor_id, actor_email, action, target_type, target_id, details)
        SELECT ${access.user.id}, ${(access.user.email ?? "").toLowerCase()},
               'report.status_changed', 'content_report', updated.id::text,
               jsonb_build_object('status', updated.status)
        FROM updated
        RETURNING target_id
      )
      SELECT updated.id, updated.status, updated.resolved_at
      FROM updated
      INNER JOIN logged ON logged.target_id = updated.id::text
    `;
    if (!rows.length) return NextResponse.json({ error: "Report not found." }, { status: 404 });
    return NextResponse.json({ report: rows[0] });
  } catch {
    return NextResponse.json({ error: "Could not update the report. Please try again." }, { status: 500 });
  }
}
