import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function currentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

    const sql = getDb();
    const rows = await sql`
      SELECT id, name, tagline, genre, visibility, queue, settings
      FROM creator_station_profiles
      WHERE owner_id = ${user.id}
      LIMIT 1
    `;
    if (!rows.length) return NextResponse.json({ profile: null });
    return NextResponse.json({ profile: rows[0] });
  } catch {
    return NextResponse.json({ error: "Could not load your station settings." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  let user: Awaited<ReturnType<typeof currentUser>>;
  try {
    user = await currentUser();
  } catch {
    return NextResponse.json({ error: "Could not verify your session. Please sign in again." }, { status: 503 });
  }
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "A station settings object is required." }, { status: 400 });
  }

  try {
    const input = body as Record<string, unknown>;
    const name = typeof input.name === "string" ? input.name.trim().slice(0, 48) : "";
    const tagline = typeof input.tagline === "string" ? input.tagline.trim().slice(0, 90) : "";
    const genre = typeof input.genre === "string" ? input.genre.trim().slice(0, 40) : "Mixed genres";
    const requestedVisibility = typeof input.visibility === "string" ? input.visibility : "public";
    if (!["public", "unlisted", "private"].includes(requestedVisibility)) {
      return NextResponse.json({ error: "Visibility must be public, unlisted, or private." }, { status: 400 });
    }
    const visibility = requestedVisibility;
    const queue = Array.isArray(input.queue)
      ? input.queue.slice(0, 250).map((item: unknown, index: number) => {
          const track = item && typeof item === "object" ? item as Record<string, unknown> : {};
          return {
            id: typeof track.id === "number" || typeof track.id === "string" ? String(track.id).slice(0, 80) : String(index + 1),
            title: typeof track.title === "string" ? track.title.trim().slice(0, 180) : "",
            artist: typeof track.artist === "string" ? track.artist.trim().slice(0, 140) : "",
            duration: typeof track.duration === "string" ? track.duration.slice(0, 20) : "—",
          };
        }).filter((track: {title:string}) => track.title.length > 0)
      : [];
    const settings = input.settings && typeof input.settings === "object" && !Array.isArray(input.settings)
      ? input.settings as Record<string, unknown>
      : {};
    const volume = typeof settings.volume === "number" && Number.isFinite(settings.volume) ? Math.max(0, Math.min(100, Math.round(settings.volume))) : 72;
    const crossfade = typeof settings.crossfade === "number" && Number.isFinite(settings.crossfade) ? Math.max(0, Math.min(12, Math.round(settings.crossfade))) : 4;

    if (!name) return NextResponse.json({ error: "Station name is required." }, { status: 400 });

    const sql = getDb();
    const rows = await sql`
      INSERT INTO creator_station_profiles (owner_id, name, tagline, genre, visibility, queue, settings, updated_at)
      VALUES (
        ${user.id}, ${name}, ${tagline}, ${genre}, ${visibility},
        ${JSON.stringify(queue)}::jsonb,
        ${JSON.stringify({ volume, crossfade })}::jsonb,
        now()
      )
      ON CONFLICT (owner_id) DO UPDATE SET
        name = EXCLUDED.name,
        tagline = EXCLUDED.tagline,
        genre = EXCLUDED.genre,
        visibility = EXCLUDED.visibility,
        queue = EXCLUDED.queue,
        settings = EXCLUDED.settings,
        updated_at = now()
      RETURNING id, name, tagline, genre, visibility, queue, settings
    `;
    return NextResponse.json({ profile: rows[0] });
  } catch {
    return NextResponse.json({ error: "Could not save your station settings." }, { status: 500 });
  }
}
