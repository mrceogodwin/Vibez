import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sql = getDb();
    const rows = await sql`SELECT id, name, tagline, genre, updated_at FROM creator_station_profiles WHERE visibility = 'public' ORDER BY updated_at DESC LIMIT 60`;
    const stations = rows.map((row: Record<string, unknown>) => ({
      id: row.id,
      name: typeof row.name === "string" ? row.name : "",
      tagline: typeof row.tagline === "string" ? row.tagline : "",
      genre: typeof row.genre === "string" ? row.genre : "Mixed genres",
      updated_at: row.updated_at,
    }));
    return NextResponse.json({ stations }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch {
    return NextResponse.json({ error: "Station discovery is temporarily unavailable.", stations: [] }, { status: 503 });
  }
}
