import type { Db } from "./db";

export async function loadHome(db: Db, filter: string) {
  const kind =
    filter === "music"
      ? "music_share"
      : filter === "podcasts"
        ? "podcast_share"
        : filter === "games"
          ? "game_activity"
          : filter === "events"
            ? "event_share"
            : filter === "communities"
              ? "community_update"
              : null;
  const heroes = await db.query(
    `SELECT id, title, subtitle, cta_label, cta_path, sponsored
     FROM vibez.editorial_features
     WHERE status = 'published' AND placement = 'hero'
       AND (starts_at IS NULL OR starts_at <= now())
       AND (ends_at IS NULL OR ends_at > now())
     ORDER BY sort_order, created_at DESC
     LIMIT 8`,
  );
  const trending = await db.query(
    kind
      ? `SELECT p.id, p.kind, p.body, p.created_at, u.display_name, u.username
         FROM vibez.posts p
         JOIN vibez.users u ON u.id = p.author_id
         WHERE p.deleted_at IS NULL AND p.visibility = 'public' AND p.kind = $1
         ORDER BY p.created_at DESC LIMIT 12`
      : `SELECT p.id, p.kind, p.body, p.created_at, u.display_name, u.username
         FROM vibez.posts p
         JOIN vibez.users u ON u.id = p.author_id
         WHERE p.deleted_at IS NULL AND p.visibility = 'public'
         ORDER BY p.created_at DESC LIMIT 12`,
    kind ? [kind] : [],
  );
  const communities = await db.query(
    `SELECT c.id, c.name, c.description, c.category,
            (SELECT count(*)::int FROM vibez.community_members m
              WHERE m.community_id = c.id AND m.status = 'active') AS members
     FROM vibez.communities c
     WHERE c.visibility = 'public' AND c.status = 'active'
     ORDER BY members DESC, c.created_at DESC
     LIMIT 12`,
  );
  return {
    filter: filter || "for_you",
    heroes: heroes.rows,
    trending: trending.rows,
    communities: communities.rows,
  };
}
