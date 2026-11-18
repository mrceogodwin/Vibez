import { fail, json } from "@/server/http";
import { getPool } from "@/server/db";
import { requireUser } from "@/server/auth/service";
import { presignUpload, requireR2 } from "@/server/media/r2";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "audio/mpeg", "audio/mp4", "audio/aac"]);

export async function POST(request: Request) {
  try {
    const user = await requireUser(getPool(), request);
    const config = requireR2();
    const body = (await request.json()) as { contentType?: string; byteSize?: number; purpose?: string };
    if (!body.contentType || !ALLOWED.has(body.contentType)) {
      return json({ error: { code: "type", message: "That file type is not allowed." } }, 400);
    }
    if (!body.byteSize || body.byteSize < 1 || body.byteSize > 20_000_000) {
      return json({ error: { code: "size", message: "Files must be between 1 byte and 20 MB." } }, 400);
    }
    const key = `${user.id}/${crypto.randomUUID()}`;
    const row = await getPool().query<{ id: string }>(
      `INSERT INTO vibez.media_objects (owner_id, object_key, content_type, byte_size, status, visibility, purpose)
       VALUES ($1, $2, $3, $4, 'pending', 'private', $5) RETURNING id`,
      [user.id, key, body.contentType, body.byteSize, (body.purpose || "upload").slice(0, 40)],
    );
    const uploadUrl = await presignUpload(config, key, body.contentType);
    return json({ mediaId: row.rows[0].id, uploadUrl });
  } catch (error) {
    return fail(error);
  }
}
