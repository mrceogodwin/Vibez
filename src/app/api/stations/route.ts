import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sql = getDb();
    const rows = await sql`SELECT id, name, tagline, genre, updated_at FROM creator_station_profiles WHERE visibility = 'public' ORDER BY updated_at DESC LIMIT 60`;
    return NextResponse.json({ stations: rows }, { headers: { "Cache-Control": "private, no-store, max-age=0" } });
  } catch {
    return NextResponse.json({ error: "Station discovery is temporarily unavailable.", stations: [] }, { status: 503 });
  }
}
