import { Link } from "@tanstack/react-router";
import { Calendar, Heart, MapPin } from "lucide-react";
import { formatWhen, fromPrice, isLive, naira, type VibezEvent } from "@/lib/catalogue";
import { usePrefs } from "@/lib/prefs";

export function EventCard({ event }: { event: VibezEvent }) {
  const saved = usePrefs((state) => state.saved.includes(event.slug));
  const toggleSaved = usePrefs((state) => state.toggleSaved);
  const live = isLive(event);

  return (
    <article className="vz-card">
      <Link to="/events/$slug" params={{ slug: event.slug }} className="vz-card-media">
        <img src={event.cover} alt="" />
        <span className="vz-badge">{event.category}</span>
      </Link>
      <button
        type="button"
        className={saved ? "vz-heart is-on" : "vz-heart"}
        aria-label={saved ? `Remove ${event.title} from saved` : `Save ${event.title}`}
        aria-pressed={saved}
        onClick={() => toggleSaved(event.slug)}
      >
        <Heart />
      </button>
      <div className="vz-card-body">
        <Link to="/events/$slug" params={{ slug: event.slug }} className="vz-card-title">
          {event.title}
        </Link>
        <p className="vz-meta">
          <Calendar />
          <span>{live ? `Happening now · ${formatWhen(event.start, event.end)}` : formatWhen(event.start, event.end)}</span>
        </p>
        <p className="vz-meta">
          <MapPin />
          <span>{event.venue}</span>
        </p>
        <div className="vz-card-foot">
          <span className="vz-price">
            From <strong>{naira(fromPrice(event))}</strong>
          </span>
          <Link to="/events/$slug" params={{ slug: event.slug }} className="vz-btn">
            Get Tickets
          </Link>
        </div>
      </div>
    </article>
  );
}
