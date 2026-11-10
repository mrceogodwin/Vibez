import { createFileRoute, Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { useState } from "react";
import { Shell } from "@/components/vibez/shell";
import { loadCatalogue } from "@/lib/vibez.functions";

export const Route = createFileRoute("/tv")({
  loader: () => loadCatalogue(),
  component: TvPage,
});

function TvPage() {
  const { events } = Route.useLoaderData();
  const [open, setOpen] = useState<string | null>(null);
  const clips = events.slice(0, 6);
  const current = clips.find((event) => event.slug === open);

  return (
    <Shell>
      <h1 className="vz-page-title">Vibez TV</h1>
      <p className="vz-sub">
        Highlights, recaps and interviews. Playback opens only when a rights-holder publishes the file.
      </p>
      <div className="vz-tv-grid">
        {clips.map((event) => (
          <button key={event.slug} type="button" className="vz-poster" onClick={() => setOpen(event.slug)}>
            <img src={event.cover} alt="" />
            <span className="vz-play" aria-hidden="true">
              <Play size={18} fill="currentColor" />
            </span>
            <div>
              <strong>{event.title}</strong>
              <span>
                {event.city} · {event.category}
              </span>
            </div>
          </button>
        ))}
      </div>
      {current ? (
        <section className="vz-panel">
          <h2>{current.title}</h2>
          <p className="vz-prose">{current.blurb}</p>
          <p className="vz-warn">
            Nothing is streaming. This highlight is listed so you can find it. A video plays here only after the
            rights-holder publishes it. No trailer is being faked.
          </p>
          <p>
            <Link to="/events/$slug" params={{ slug: current.slug }} className="vz-btn">
              View the event
            </Link>
          </p>
          <button type="button" className="vz-btn-line" onClick={() => setOpen(null)}>
            Close
          </button>
        </section>
      ) : null}
    </Shell>
  );
}
