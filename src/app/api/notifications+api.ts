import { fail, json } from "@/server/http";
import { getPool } from "@/server/db";
import { requireUser } from "@/server/auth/service";

export async function GET(request: Request) {
  try {
    const user = await requireUser(getPool(), request);
    const rows = await getPool().query(
      `SELECT id, kind, title, body, href, read_at, created_at
       FROM vibez.notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [user.id],
    );
    return json({ notifications: rows.rows });
  } catch (error) {
    return fail(error);
  }
}
