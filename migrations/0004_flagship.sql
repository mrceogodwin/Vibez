-- Videos, posts, playlists and appearance. Additive and idempotent.

alter table profiles add column if not exists appearance text not null default 'light';
alter table events add column if not exists artist_username text;

update events set artist_username = 'mudino'
where slug = 'ibadan-sound' and artist_username is null;

create table if not exists artist_videos (
  id text primary key,
  artist_id text not null references artist_profiles (id) on delete cascade,
  title text not null,
  thumbnail_url text not null,
  watch_url text not null default '',
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists artist_posts (
  id text primary key,
  artist_id text not null references artist_profiles (id) on delete cascade,
  body text not null,
  image_url text,
  is_sample boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists playlists (
  id text primary key,
  user_id text not null,
  name text not null,
  created_at timestamptz not null default now()
);
create index if not exists playlists_user_idx on playlists (user_id, created_at desc);

create table if not exists playlist_tracks (
  playlist_id text not null references playlists (id) on delete cascade,
  release_id text not null references music_releases (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (playlist_id, release_id)
);

insert into artist_videos (id, artist_id, title, thumbnail_url, watch_url, is_sample) values
  ('vid_mudi_live', 'art_mudi', 'Montana (sample visual)', '/media/onboard-stage.jpg', '', true)
on conflict (id) do nothing;

insert into artist_posts (id, artist_id, body, image_url, is_sample) values
  ('post_mudi_1', 'art_mudi', 'Sample post. This is catalogue copy for the profile layout, not an announcement from a real artist.', '/media/onboard-crowd.jpg', true)
on conflict (id) do nothing;
