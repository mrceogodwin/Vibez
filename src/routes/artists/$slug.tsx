import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BadgeCheck, Bell, Calendar, Copy, MapPin, Play, Plus } from "lucide-react";
import { useState } from "react";
import { artists, spotlight, tracks } from "@/lib/feed";

export const Route = createFileRoute("/artists/$slug")({
  component: ArtistPage,
});

function ArtistPage() {
  const { slug } = Route.useParams();
  const artist = artists.find((item) => item.slug === slug);
  const [following, setFollowing] = useState(false);
  const [copied, setCopied] = useState(false);
  const own = artist ? tracks.filter((track) => track.artist === artist.name) : [];

  if (!artist) {
    return (
      <main className="fd-light">
        <div className="fd">
          <Link to="/artists" className="fd-back"><ArrowLeft size={18} /> Back</Link>
          <p className="fd-empty">That artist is not listed on Vibez.</p>
        </div>
      </main>
    );
  }

  const handle = artist.name.toLowerCase().replace(/\s+/g, "");

  return (
    <main className="fd-light">
      <div className="fd fd-profile">
        <header className="fd-top">
          <Link to="/artists" aria-label="Back"><ArrowLeft size={20} /></Link>
          <img src="/brand/vibez-mark-blue.png" alt="Vibez" />
          <Link to="/activity" aria-label="Activity"><Bell size={20} /></Link>
        </header>
        <section className="fd-cover">
          <img src={artist.image} alt="" />
          <strong>{artist.name}</strong>
        </section>
        <div className="fd-id">
          <span className="pic"><img src={artist.image} alt="" /></span>
          <div>
            <h1>{artist.name} <BadgeCheck size={18} /></h1>
            <p>@{handle}</p>
          </div>
        </div>
        <button
          type="button"
          className="fd-linkrow"
          onClick={() => {
            void navigator.clipboard?.writeText(`https://vibez.ng/@${handle}`);
            setCopied(true);
          }}
        >
          vibez.ng/@{handle}
          <Copy size={16} />
          {copied ? <em>Copied</em> : null}
        </button>
        <div className="fd-actions-row">
          <button type="button" className={following ? "is-on" : undefined} onClick={() => setFollowing((value) => !value)}>
            <Plus size={16} /> {following ? "Following" : "Follow"}
          </button>
          <span>Message</span>
          <span>Tip / Support</span>
        </div>
        <p className="fd-bio">{artist.name} on Vibez. Releases and events listed here are the ones currently on the platform.</p>
        <div className="fd-chips">
          <button type="button" className="is-on">Overview</button>
          <button type="button">Music</button>
          <button type="button">Events</button>
        </div>
        <section>
          <div className="fd-rowhead"><h2>Latest Release</h2></div>
          {own[0] ? (
            <Link to="/music/$slug" params={{ slug: own[0].slug }} className="fd-release">
              <img src={own[0].image} alt="" />
              <span><strong>{own[0].title}</strong><em>{own[0].artist}</em></span>
              <Play size={16} />
            </Link>
          ) : <p className="fd-empty">No release is attached to this profile yet.</p>}
        </section>
        <section>
          <div className="fd-rowhead"><h2>Upcoming Events</h2><Link to="/events">See All</Link></div>
          <article className="fd-event is-light">
            <img src={spotlight.image} alt="" />
            <div>
              <strong>{spotlight.title}</strong>
              <p><Calendar size={13} /> {spotlight.when}</p>
              <p><MapPin size={13} /> {spotlight.city}</p>
              <div><span>{spotlight.tag}</span><Link to="/events">Get Tickets</Link></div>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
