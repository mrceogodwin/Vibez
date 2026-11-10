import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AppFrame } from "@/components/vibez/frame";
import { Media, Sample } from "@/components/vibez/media";
import { followArtist, loadArtistPage, loadLibrary } from "@/lib/platform.functions";
import { usePlayer } from "@/lib/player-store";

export const Route = createFileRoute("/$username/")({
  loader: ({ params }) => loadArtistPage({ data: { username: params.username } }),
  head: ({ loaderData }) => ({
    meta: loaderData?.artist
      ? [
          { title: `${loaderData.artist.name} (@${loaderData.artist.username}) · Vibez` },
          { name: "description", content: loaderData.artist.bio },
          { property: "og:title", content: `${loaderData.artist.name} on Vibez` },
          { property: "og:image", content: loaderData.artist.avatar },
        ]
      : [{ title: "Artist · Vibez" }],
  }),
  component: ArtistPage,
});

const tabs = ["overview", "music", "videos", "events", "posts"] as const;

function ArtistPage() {
  const data = Route.useLoaderData();
  const [tab, setTab] = useState<(typeof tabs)[number]>("overview");
  const [following, setFollowing] = useState(false);
  const [message, setMessage] = useState("");
  const play = usePlayer((state) => state.play);

  useEffect(() => {
    if (!data.artist) return;
    loadLibrary().then((library) => setFollowing(library.followedUsernames.includes(data.artist!.username))).catch(() => undefined);
  }, [data.artist]);

  if (data.redirect) {
    return <AppFrame><div className="empty"><h2>This name moved</h2><a className="btn" href={data.redirect}>Open the new profile</a></div></AppFrame>;
  }
  if (!data.artist) {
    return <AppFrame><div className="empty"><h2>No artist at this address</h2><p>Profiles live at /@username.</p><Link className="btn" to="/artists">Browse artists</Link></div></AppFrame>;
  }
  const artist = data.artist;

  return (
    <AppFrame>
      <div className="app-hero" style={{ minHeight: 190 }}>
        <Media src={artist.cover} alt="" />
      </div>
      <div className="profile-head" style={{ marginTop: -42 }}>
        <div className="avatar"><Media src={artist.avatar} alt={artist.name} /></div>
        <h1>{artist.name} {artist.verified ? <BadgeCheck size={18} color="#1016c9" /> : null}</h1>
        <p>@{artist.username} · {artist.city}</p>
        <Sample on={artist.sample} />
      </div>
      <div className="stats">
        <div><strong>{artist.followers}</strong><span>Followers</span></div>
        <div><strong>{artist.releases}</strong><span>Releases</span></div>
        <div><strong>{data.videos.length}</strong><span>Videos</span></div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button type="button" className={following ? "btn ghost" : "btn"} onClick={() => void followArtist({ data: { username: artist.username } }).then((result) => setFollowing(result.following)).catch((error) => setMessage(error instanceof Error ? error.message : "Sign in to follow."))}>{following ? "Following" : "Follow"}</button>
        <button type="button" className="btn ghost" onClick={() => void navigator.clipboard.writeText(`${window.location.origin}/@${artist.username}`)}><Share2 size={16} /> Share</button>
      </div>
      {message ? <p className="warn">{message}</p> : null}
      <div className="tabs" role="tablist">
        {tabs.map((item) => (
          <button key={item} type="button" className={tab === item ? "is-on" : undefined} onClick={() => setTab(item)}>{item[0].toUpperCase() + item.slice(1)}</button>
        ))}
      </div>
      {tab === "overview" || tab === "music" ? (
        <section>
          {tab === "overview" ? <p className="note">{artist.bio}</p> : null}
          <div className="app-row"><h2>{tab === "overview" ? "Latest" : "Music"}</h2></div>
          {data.releases.length === 0 ? <Empty title="No releases yet" body="Published music shows up here. Sample releases are labelled." /> : data.releases.map((release) => (
            <Link key={release.id} to="/$username/$slug" params={{ username: `@${artist.username}`, slug: release.slug }} className="rowlink" style={{ background: "#fff", borderRadius: 16, marginTop: 8 }} onClick={() => play({
              id: release.id, title: release.title, artist: artist.name, artwork: release.artwork, username: artist.username, slug: release.slug, previewUrl: release.previewUrl, durationSeconds: release.durationSeconds, sample: release.sample,
            }, data.releases.map((item) => ({ id: item.id, title: item.title, artist: artist.name, artwork: item.artwork, username: artist.username, slug: item.slug, previewUrl: item.previewUrl, durationSeconds: item.durationSeconds, sample: item.sample })))}>
              <span className="media" style={{ width: 52, height: 52, borderRadius: 12 }}><img src={release.artwork} alt="" /></span>
              <span>{release.title}<small>{release.genre}{release.sample ? " · Sample" : ""}</small></span>
            </Link>
          ))}
        </section>
      ) : null}
      {tab === "videos" ? (
        data.videos.length === 0 ? <Empty title="No videos yet" body="Video links appear when the artist adds them. Vibez does not invent view counts." /> : (
          <div style={{ display: "grid", gap: 12 }}>
            {data.videos.map((video) => (
              <article key={video.id} className="event-card">
                <span style={{ position: "relative", display: "block" }}><Media src={video.thumbnail} alt="" />{video.sample ? <span className="badge-abs"><Sample on /></span> : null}</span>
                <div className="body"><strong>{video.title}</strong><p>{video.watchUrl ? <a href={video.watchUrl}>Watch</a> : "Sample visual. No view count is shown."}</p></div>
              </article>
            ))}
          </div>
        )
      ) : null}
      {tab === "events" ? (
        data.events.length === 0 ? <Empty title="No linked events" body="Shows appear when an event is tied to this username." /> : data.events.map((event) => (
          <Link key={event.slug} to="/events/$slug" params={{ slug: event.slug }} className="event-card" style={{ marginTop: 10 }}>
            <Media src={event.cover} alt="" />
            <div className="body"><strong>{event.title}</strong><p>{event.city}</p><Sample on={event.sample} /></div>
          </Link>
        ))
      ) : null}
      {tab === "posts" ? (
        data.posts.length === 0 ? <Empty title="No posts yet" body="Artist posts are written by the account. This tab stays empty until there is one." /> : data.posts.map((post) => (
          <article key={post.id} className="panel">
            <Sample on={post.sample} />
            <p>{post.body}</p>
            {post.image ? <Media src={post.image} alt="" /> : null}
          </article>
        ))
      ) : null}
    </AppFrame>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return <div className="empty"><h2>{title}</h2><p>{body}</p></div>;
}
