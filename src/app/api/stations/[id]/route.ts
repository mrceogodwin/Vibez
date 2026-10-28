import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const sql = getDb();
    const rows = await sql`SELECT id, name, tagline, genre FROM creator_station_profiles WHERE id = ${id} AND visibility = 'public' LIMIT 1`;
    if (!rows.length) return NextResponse.json({ error: "Station not found." }, { status: 404 });
    return NextResponse.json({ station: rows[0] }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } });
  } catch {
    return NextResponse.json({ error: "Station details are temporarily unavailable." }, { status: 503 });
  }
}
