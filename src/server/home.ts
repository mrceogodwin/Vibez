import type { Db } from "./db";

const postKind: Record<string, string> = {
  music: "music_share",
  podcasts: "podcast_share",
  games: "game_activity",
  events: "event_share",
  communities: "community_update",
};

const communityCategory: Record<string, string> = {
  music: "music",
  podcasts: "podcasts",
  games: "games",
  events: "events",
};

export async function loadHome(db: Db, filter: string, viewerId: string | null) {
  const kind = postKind[filter] ?? null;
  const category = communityCategory[filter] ?? null;
  const heroes = await db.query(
    `SELECT e.id, e.title, e.subtitle, e.cta_label, e.cta_path, m.object_key AS image_key
     FROM vibez.editorial_features e
     LEFT JOIN vibez.media_objects m ON m.id = e.image_media_id
     WHERE e.status = 'published' AND e.placement = 'hero'
       AND (e.starts_at IS NULL OR e.starts_at <= now())
       AND (e.ends_at IS NULL OR e.ends_at > now())
     ORDER BY e.sort_order, e.created_at DESC
     LIMIT 8`,
  );
  const trending = await db.query(
    `SELECT p.id, p.kind, p.body AS title, u.display_name AS author, m.object_key AS image_key
     FROM vibez.posts p
     JOIN vibez.users u ON u.id = p.author_id
     LEFT JOIN vibez.post_media pm ON pm.post_id = p.id AND pm.position = 0
     LEFT JOIN vibez.media_objects m ON m.id = pm.media_id
     WHERE p.deleted_at IS NULL AND p.visibility = 'public'
       AND ($1::text IS NULL OR p.kind = $1)
     ORDER BY p.created_at DESC
     LIMIT 12`,
    [kind],
  );
  const communities = await db.query(
    `SELECT c.id, c.name, c.category, img.object_key AS image_key,
            (SELECT count(*)::int FROM vibez.community_members m
              WHERE m.community_id = c.id AND m.status = 'active') AS members,
            EXISTS (
              SELECT 1 FROM vibez.community_members mine
              WHERE mine.community_id = c.id AND mine.user_id = $2::uuid AND mine.status = 'active'
            ) AS joined
     FROM vibez.communities c
     LEFT JOIN vibez.media_objects img ON img.id = c.image_media_id
     WHERE c.visibility = 'public' AND c.status = 'active'
       AND ($1::text IS NULL OR c.category = $1)
     ORDER BY members DESC, c.created_at DESC
     LIMIT 12`,
    [filter === "for_you" || filter === "communities" ? null : category, viewerId],
  );
  const unread = viewerId
    ? await db.query<{ n: number }>(
        "SELECT count(*)::int AS n FROM vibez.notifications WHERE user_id = $1 AND read_at IS NULL",
        [viewerId],
      )
    : { rows: [{ n: 0 }] };
  return {
    filter: filter || "for_you",
    heroes: heroes.rows,
    trending: trending.rows,
    communities: communities.rows,
    unread: unread.rows[0]?.n ?? 0,
  };
}
