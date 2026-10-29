import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const adminEmails = new Set(
  (process.env.VIBEZ_ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean),
);

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const email = (session.user.email ?? "").toLowerCase();
    if (!email || !adminEmails.has(email)) return NextResponse.json({ error: "Super Admin access required." }, { status: 403 });

    const { id } = await context.params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ error: "Invalid station ID." }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "A station visibility action is required." }, { status: 400 });
    }
    const visibility = (body as Record<string, unknown>).visibility;
    if (visibility !== "public" && visibility !== "unlisted" && visibility !== "private") {
      return NextResponse.json({ error: "Choose public, unlisted, or private visibility." }, { status: 400 });
    }

    const sql = getDb();
    const rows = await sql`
      WITH updated AS (
        UPDATE creator_station_profiles
        SET visibility = ${visibility}, updated_at = now()
        WHERE id = ${id}::uuid
        RETURNING id, name, visibility
      ),
      logged AS (
        INSERT INTO admin_audit_log (actor_id, actor_email, action, target_type, target_id, details)
        SELECT ${session.user.id}, ${email}, 'station.visibility_changed', 'creator_station', updated.id::text,
               jsonb_build_object('station_name', updated.name, 'visibility', updated.visibility)
        FROM updated
        RETURNING target_id
      )
      SELECT updated.id, updated.name, updated.visibility
      FROM updated INNER JOIN logged ON logged.target_id = updated.id::text
    `;
    if (!rows.length) return NextResponse.json({ error: "Station not found." }, { status: 404 });
    return NextResponse.json({ station: rows[0] }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not update station visibility." }, { status: 500 });
  }
}
