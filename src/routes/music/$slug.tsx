import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, Heart, Play, Share2, SkipBack, SkipForward } from "lucide-react";
import { useState } from "react";
import { tracks } from "@/lib/feed";

export const Route = createFileRoute("/music/$slug")({
  component: PlayerPage,
});

function PlayerPage() {
  const { slug } = Route.useParams();
  const track = tracks.find((item) => item.slug === slug);
  const [liked, setLiked] = useState(false);
  const more = tracks.filter((item) => item.slug !== slug);

  if (!track) {
    return (
      <main className="fd-light"><div className="fd"><p className="fd-empty">That release is not on Vibez.</p></div></main>
    );
  }

  return (
    <main className="fd-light">
      <div className="fd fd-player">
        <header className="fd-top">
          <Link to="/music" aria-label="Close"><ChevronDown size={22} /></Link>
          <img src="/brand/vibez-mark-blue.png" alt="Vibez" />
          <span />
        </header>
        <img className="fd-album" src={track.image} alt="" />
        <div className="fd-songline">
          <div>
            <h1>{track.title}</h1>
            <p>{track.artist}</p>
          </div>
          <button type="button" aria-label="Save" className={liked ? "is-on" : undefined} onClick={() => setLiked((value) => !value)}>
            <Heart size={22} fill={liked ? "currentColor" : "none"} />
          </button>
          <Share2 size={20} />
        </div>
        <div className="fd-scrub" aria-hidden="true"><span /><i /></div>
        <div className="fd-times"><span>0:00</span><span>{track.duration}</span></div>
        <div className="fd-transport">
          <SkipBack size={26} />
          <button type="button" aria-label="Play"><Play size={22} fill="currentColor" /></button>
          <SkipForward size={26} />
        </div>
        <p className="fd-empty">Playback isn’t connected for this release. Vibez is not streaming the recording.</p>
        <section>
          <div className="fd-rowhead"><h2>More from {track.artist}</h2></div>
          <div className="fd-rail">
            {more.map((item) => (
              <Link key={item.slug} to="/music/$slug" params={{ slug: item.slug }} className="fd-track is-light">
                <span className="art"><img src={item.image} alt="" /><Play size={12} /></span>
                <strong>{item.title}</strong>
                <em>{item.artist}</em>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
