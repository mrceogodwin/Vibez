import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { AppFrame } from "@/components/vibez/frame";
import { Media, Sample } from "@/components/vibez/media";
import { followArtist, loadArtistPage, loadLibrary } from "@/lib/platform.functions";

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

function ArtistPage() {
  const data = Route.useLoaderData();
  const [tab, setTab] = useState<"overview" | "music" | "events">("overview");
  const [following, setFollowing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!data.artist) return;
    loadLibrary()
      .then((library) => setFollowing(library.followedUsernames.includes(data.artist!.username)))
      .catch(() => undefined);
  }, [data.artist]);

  if (data.redirect) {
    return (
      <AppFrame>
        <div className="empty">
          <h2>This name moved</h2>
          <a className="btn" href={data.redirect}>Open the new profile</a>
        </div>
      </AppFrame>
    );
  }
  if (!data.artist) {
    return (
      <AppFrame>
        <div className="empty">
          <h2>No artist at this address</h2>
          <p>Usernames on Vibez look like /@mudino. This one is not published.</p>
          <Link className="btn" to="/artists">Browse artists</Link>
        </div>
      </AppFrame>
    );
  }
  const artist = data.artist;

  async function toggle() {
    try {
      const result = await followArtist({ data: { username: artist.username } });
      setFollowing(result.following);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign in to follow.");
    }
  }

  async function share() {
    const url = `${window.location.origin}/@${artist.username}`;
    if (navigator.share) await navigator.share({ title: artist.name, url }).catch(() => undefined);
    else await navigator.clipboard.writeText(url);
  }

  return (
    <AppFrame>
      <div className="app-hero" style={{ minHeight: 160 }}>
        <Media src={artist.cover} alt="" />
      </div>
      <div className="profile-head" style={{ marginTop: -36 }}>
        <div className="avatar"><Media src={artist.avatar} alt={artist.name} /></div>
        <h1>{artist.name} {artist.verified ? <BadgeCheck size={18} color="#1016c9" /> : null}</h1>
        <p>@{artist.username}</p>
        <p>{artist.city}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 8 }}>
          <Sample on={artist.sample} />
        </div>
      </div>
      <div className="stats">
        <div><strong>{artist.followers}</strong><span>Followers</span></div>
        <div><strong>{artist.releases}</strong><span>Releases</span></div>
        <div><strong>{artist.sample ? "Sample" : "Live"}</strong><span>Profile</span></div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button type="button" className={following ? "btn ghost" : "btn"} onClick={() => void toggle()}>{following ? "Following" : "Follow"}</button>
        <button type="button" className="btn ghost" onClick={() => void share()}><Share2 size={16} /> Share</button>
      </div>
      {message ? <p className="warn">{message}</p> : null}
      <div className="app-chips">
        {(["overview", "music", "events"] as const).map((item) => (
          <button key={item} type="button" className={tab === item ? "app-chip is-on" : "app-chip"} onClick={() => setTab(item)}>{item[0].toUpperCase() + item.slice(1)}</button>
        ))}
      </div>
      {tab !== "events" ? <p className="note">{artist.bio}</p> : null}
      {artist.website ? <p><a href={artist.website}>{artist.website}</a></p> : null}
      {tab !== "events" ? (
        <section>
          <div className="app-row"><h2>Music</h2></div>
          {data.releases.length === 0 ? <p className="note">No published releases yet.</p> : data.releases.map((release) => (
            <Link key={release.id} to="/$username/$slug" params={{ username: `@${artist.username}`, slug: release.slug }} className="rowlink" style={{ background: "#fff", borderRadius: 16, marginTop: 8 }}>
              <span className="media" style={{ width: 48, height: 48, borderRadius: 12 }}><img src={release.artwork} alt="" className="is-in" /></span>
              <span>{release.title}<small>{release.genre}{release.sample ? " · Sample" : ""}</small></span>
              <span />
            </Link>
          ))}
        </section>
      ) : (
        <div className="empty">
          <h2>No events linked</h2>
          <p>Upcoming shows appear here when this artist is attached to a published event.</p>
          <Link className="btn" to="/events">Browse events</Link>
        </div>
      )}
    </AppFrame>
  );
}
