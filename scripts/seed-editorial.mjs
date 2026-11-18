import { readFileSync, existsSync, statSync } from "node:fs";
import { Pool } from "pg";

function loadEnvFile() {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq);
      const value = trimmed.slice(eq + 1);
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

const PRODUCTION_HOST_MARK = "ep-soft-wind-zam8gd6x";
loadEnvFile();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.log("DATABASE_URL is not set. Skipping editorial seed.");
  process.exit(0);
}
const host = new URL(databaseUrl).hostname;
if (host.includes(PRODUCTION_HOST_MARK) && process.env.MIGRATE_ALLOW_PRODUCTION !== "yes") {
  console.error(`Refusing to seed ${host}. That is the production Neon endpoint.`);
  process.exit(1);
}

const heroes = [
  ["Discover Naija Vibes", "Music • Podcasts • Events", "Listen Now", "/discover", "editorial/hero-naija.webp", "hero-naija-960.webp", 1],
  ["Weekend Live Rooms", "Games • Communities", "Jump In", "/discover", "editorial/hero-rooms.webp", "weekend-games-960.webp", 2],
  ["Vibez Fest", "Events • Music", "See Events", "/discover", "editorial/hero-fest.webp", "vibez-fest-960.webp", 3],
];

const posts = [
  ["Afrobeats Hits", "music_share", "editorial/afrobeats.webp", "afrobeats-480.webp"],
  ["The Vibez Cast", "podcast_share", "editorial/vibez-cast.webp", "vibez-cast-480.webp"],
  ["Weekend Games", "game_activity", "editorial/weekend-games.webp", "weekend-games-480.webp"],
  ["Vibez Fest", "event_share", "editorial/vibez-fest.webp", "vibez-fest-480.webp"],
];

const communities = [
  ["music-lovers", "Music Lovers", "Official Vibez community for people who live in Nigerian music.", "music", "editorial/music-lovers.webp", "music-lovers-480.webp"],
  ["naija-gamers", "Naija Gamers", "Official Vibez community for game rooms and weekend sessions.", "games", null, null],
  ["pop-culture", "Pop Culture", "Official Vibez community for film, internet culture and the group chat.", "culture", null, null],
];

function bytes(filename) {
  return statSync(new URL(`../assets/images/editorial/${filename}`, import.meta.url)).size;
}

const pool = new Pool({ connectionString: databaseUrl.replace("-pooler.", "."), max: 1 });
const client = await pool.connect();

try {
  await client.query("BEGIN");
  const user = await client.query(
    `INSERT INTO vibez.users (email, display_name, username, email_verified_at)
     VALUES ('official@vibez.ng', 'Vibez', 'vibez', now())
     ON CONFLICT (email) DO UPDATE SET display_name = EXCLUDED.display_name
     RETURNING id`,
  );
  const userId = user.rows[0].id;
  await client.query(
    `INSERT INTO vibez.profiles (user_id, bio, verified_at)
     VALUES ($1, 'Official Vibez account. Editorial playlists, events and communities live here.', now())
     ON CONFLICT (user_id) DO UPDATE SET bio = EXCLUDED.bio, verified_at = COALESCE(vibez.profiles.verified_at, now())`,
    [userId],
  );
  await client.query("INSERT INTO vibez.wallets (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING", [userId]);
  await client.query("INSERT INTO vibez.user_settings (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING", [userId]);
  await client.query(
    "INSERT INTO vibez.user_roles (user_id, role_code) VALUES ($1, 'member') ON CONFLICT (user_id, role_code) DO NOTHING",
    [userId],
  );

  async function media(key, filename) {
    const size = bytes(filename);
    const row = await client.query(
      `INSERT INTO vibez.media_objects (owner_id, object_key, content_type, byte_size, status, visibility, purpose)
       VALUES ($1, $2, 'image/webp', $3, 'ready', 'public', 'editorial')
       ON CONFLICT (object_key) DO UPDATE SET byte_size = EXCLUDED.byte_size
       RETURNING id`,
      [userId, key, size],
    );
    return row.rows[0].id;
  }

  for (const [title, subtitle, cta, path, key, file, sort] of heroes) {
    const mediaId = await media(key, file);
    const existing = await client.query("SELECT id FROM vibez.editorial_features WHERE placement = 'hero' AND title = $1", [title]);
    if (existing.rows[0]) {
      await client.query(
        `UPDATE vibez.editorial_features
         SET subtitle = $2, cta_label = $3, cta_path = $4, image_media_id = $5, status = 'published', sort_order = $6
         WHERE id = $1`,
        [existing.rows[0].id, subtitle, cta, path, mediaId, sort],
      );
    } else {
      await client.query(
        `INSERT INTO vibez.editorial_features
          (placement, title, subtitle, cta_label, cta_path, image_media_id, status, sort_order)
         VALUES ('hero', $1, $2, $3, $4, $5, 'published', $6)`,
        [title, subtitle, cta, path, mediaId, sort],
      );
    }
  }

  for (const [title, kind, key, file] of posts) {
    const mediaId = await media(key, file);
    const existing = await client.query(
      "SELECT id FROM vibez.posts WHERE author_id = $1 AND body = $2 AND deleted_at IS NULL",
      [userId, title],
    );
    let postId = existing.rows[0]?.id;
    if (!postId) {
      const inserted = await client.query(
        `INSERT INTO vibez.posts (author_id, kind, body, visibility) VALUES ($1, $2, $3, 'public') RETURNING id`,
        [userId, kind, title],
      );
      postId = inserted.rows[0].id;
    }
    await client.query(
      `INSERT INTO vibez.post_media (post_id, media_id, position) VALUES ($1, $2, 0)
       ON CONFLICT (post_id, position) DO UPDATE SET media_id = EXCLUDED.media_id`,
      [postId, mediaId],
    );
  }

  for (const [slug, name, description, category, key, file] of communities) {
    const mediaId = key ? await media(key, file) : null;
    const existing = await client.query("SELECT id FROM vibez.communities WHERE slug = $1", [slug]);
    let communityId = existing.rows[0]?.id;
    if (!communityId) {
      const inserted = await client.query(
        `INSERT INTO vibez.communities (owner_id, slug, name, description, category, image_media_id, visibility)
         VALUES ($1, $2, $3, $4, $5, $6, 'public') RETURNING id`,
        [userId, slug, name, description, category, mediaId],
      );
      communityId = inserted.rows[0].id;
    } else {
      await client.query(
        `UPDATE vibez.communities SET name = $2, description = $3, category = $4, image_media_id = $5 WHERE id = $1`,
        [communityId, name, description, category, mediaId],
      );
    }
    await client.query(
      `INSERT INTO vibez.community_members (community_id, user_id, role, status)
       VALUES ($1, $2, 'owner', 'active')
       ON CONFLICT (community_id, user_id) DO NOTHING`,
      [communityId, userId],
    );
  }

  await client.query("COMMIT");
  const counts = await client.query(
    `SELECT
       (SELECT count(*)::int FROM vibez.posts WHERE author_id = $1 AND deleted_at IS NULL) AS posts,
       (SELECT count(*)::int FROM vibez.communities WHERE owner_id = $1) AS communities,
       (SELECT count(*)::int FROM vibez.editorial_features WHERE status = 'published') AS heroes`,
    [userId],
  );
  console.log(`Seeded official Vibez editorial on ${host}.`, counts.rows[0]);
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  console.error(error);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}
