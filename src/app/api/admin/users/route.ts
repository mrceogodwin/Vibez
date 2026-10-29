import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const adminEmails = new Set(
  (process.env.VIBEZ_ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean),
);

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    const email = (session.user.email ?? "").toLowerCase();
    if (!email || !adminEmails.has(email)) return NextResponse.json({ error: "Super Admin access required." }, { status: 403 });

    const params = new URL(request.url).searchParams;
    const query = (params.get("q") ?? "").trim().slice(0, 100);
    if (query.length < 2) return NextResponse.json({ users: [] });

    const pattern = `%${query.replace(/[\\%_]/g, "\\$&")}%`;
    const sql = getDb();
    const users = await sql`
      SELECT id, name, email, "createdAt"
      FROM "user"
      WHERE name ILIKE ${pattern}
         OR email ILIKE ${pattern}
      ORDER BY "createdAt" DESC
      LIMIT 25
    `;
    return NextResponse.json({ users }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not search accounts." }, { status: 500 });
  }
}
