import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AppFrame } from "@/components/vibez/frame";
import { Media, Sample } from "@/components/vibez/media";
import { naira } from "@/lib/catalogue";
import { loadEventsPage } from "@/lib/platform.functions";

export const Route = createFileRoute("/events/")({
  loader: () => loadEventsPage(),
  component: EventsPage,
});

function EventsPage() {
  const { events } = Route.useLoaderData();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [city, setCity] = useState("All");
  const categories = ["All", ...Array.from(new Set(events.map((event) => event.category)))];
  const cities = ["All", ...Array.from(new Set(events.map((event) => event.city)))];
  const list = useMemo(() => events.filter((event) => {
    if (category !== "All" && event.category !== category) return false;
    if (city !== "All" && event.city !== city) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return `${event.title} ${event.city} ${event.venue}`.toLowerCase().includes(q);
  }), [events, category, city, query]);

  return (
    <AppFrame>
      <h1 style={{ margin: "8px 0 4px", fontSize: 32 }}>Events</h1>
      <p style={{ margin: 0, color: "#69738a" }}>Sample listings stay labelled and are not on sale.</p>
      <form className="app-search" style={{ marginTop: 12 }} onSubmit={(event) => event.preventDefault()}>
        <Search size={18} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search events or cities" aria-label="Search events" />
      </form>
      <div className="app-chips" aria-label="Category">
        {categories.map((item) => (
          <button key={item} type="button" className={category === item ? "app-chip is-on" : "app-chip"} onClick={() => setCategory(item)}>{item}</button>
        ))}
      </div>
      <div className="app-chips" aria-label="City">
        {cities.map((item) => (
          <button key={item} type="button" className={city === item ? "app-chip is-on" : "app-chip"} onClick={() => setCity(item)}>{item}</button>
        ))}
      </div>
      {list.length === 0 ? (
        <div className="empty"><h2>No events in that filter</h2><p>Try another city or category.</p></div>
      ) : (
        <div style={{ display: "grid", gap: 12 }} className="home-split">
          {list.map((event) => (
            <Link key={event.slug} to="/events/$slug" params={{ slug: event.slug }} className="event-card">
              <span style={{ position: "relative", display: "block" }}>
                <Media src={event.cover} alt="" />
                {event.sample ? <span className="badge-abs"><Sample on /></span> : null}
              </span>
              <div className="body">
                <strong>{event.title}</strong>
                <p><MapPin size={14} /> {event.venue}, {event.city}</p>
                <div className="foot"><span className="price">From {naira(event.fromKobo)}</span><span className="btn small">Get tickets</span></div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppFrame>
  );
}
