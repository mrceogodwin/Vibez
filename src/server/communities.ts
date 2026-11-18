import { z } from "zod";
import type { Db } from "./db";
import { HttpError } from "./auth/rbac";

const joinInput = z.object({ communityId: z.string().uuid() });

export async function joinCommunity(db: Db, userId: string, body: unknown) {
  const { communityId } = joinInput.parse(body);
  const community = await db.query<{ id: string }>(
    "SELECT id FROM vibez.communities WHERE id = $1 AND visibility = 'public' AND status = 'active'",
    [communityId],
  );
  if (!community.rows[0]) throw new HttpError(404, "missing", "That community is not open.");
  await db.query(
    `INSERT INTO vibez.community_members (community_id, user_id, role, status)
     VALUES ($1, $2, 'member', 'active')
     ON CONFLICT (community_id, user_id) DO UPDATE SET status = 'active'`,
    [communityId, userId],
  );
  const count = await db.query<{ members: number }>(
    `SELECT count(*)::int AS members FROM vibez.community_members
     WHERE community_id = $1 AND status = 'active'`,
    [communityId],
  );
  return { id: communityId, members: count.rows[0].members, joined: true };
}
