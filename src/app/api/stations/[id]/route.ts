import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const sql = getDb();
    const rows = await sql`SELECT id, name, tagline, genre, queue FROM creator_station_profiles WHERE id = ${id} AND visibility = 'public' LIMIT 1`;
    if (!rows.length) return NextResponse.json({ error: "Station not found." }, { status: 404 });
    const rawQueue = Array.isArray(rows[0].queue) ? rows[0].queue : [];
    const queue = rawQueue.slice(0, 250).map((item: unknown, index: number) => {
      const track = item && typeof item === "object" ? item as Record<string, unknown> : {};
      const candidate = typeof track.audioUrl === "string" ? track.audioUrl : "";
      let audioUrl = "";
      try {
        const parsed = new URL(candidate);
        if (parsed.protocol === "https:" && !parsed.username && !parsed.password) audioUrl = parsed.toString();
      } catch {
        audioUrl = "";
      }
      return {
        id: String(track.id ?? index + 1).slice(0, 80),
        title: typeof track.title === "string" ? track.title.slice(0, 180) : "",
        artist: typeof track.artist === "string" ? track.artist.slice(0, 140) : "",
        duration: typeof track.duration === "string" ? track.duration.slice(0, 20) : "—",
        audioUrl,
      };
    }).filter((track: { title: string }) => track.title.length > 0);
    return NextResponse.json({ station: { ...rows[0], queue } }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } });
  } catch {
    return NextResponse.json({ error: "Station details are temporarily unavailable." }, { status: 503 });
  }
}
