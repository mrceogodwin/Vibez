import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { EventCard } from "@/components/vibez/event-card";
import { Shell } from "@/components/vibez/shell";
import { categories, cities, isLive, matchesQuery } from "@/lib/catalogue";
import { loadCatalogue } from "@/lib/vibez.functions";

type EventSearch = {
  q?: string;
  category?: string;
  city?: string;
  status?: string;
};

export const Route = createFileRoute("/events/")({
  validateSearch: (search: Record<string, unknown>): EventSearch => ({
    q: typeof search.q === "string" && search.q ? search.q : undefined,
    category: typeof search.category === "string" && search.category ? search.category : undefined,
    city: typeof search.city === "string" && search.city ? search.city : undefined,
    status: search.status === "live" ? "live" : undefined,
  }),
  loader: () => loadCatalogue(),
  component: EventsPage,
});

function EventsPage() {
  const search = Route.useSearch();
  const { events, curators } = Route.useLoaderData();
  const navigate = useNavigate();

  function update(next: EventSearch) {
    const merged = { ...search, ...next };
    void navigate({
      to: "/events",
      search: {
        q: merged.q || undefined,
        category: merged.category || undefined,
        city: merged.city || undefined,
        status: merged.status || undefined,
      },
      replace: true,
    });
  }

  const list = useMemo(() => {
    return events.filter((event) => {
      if (search.category && event.category !== search.category) return false;
      if (search.city && event.city !== search.city) return false;
      if (search.status === "live" && !isLive(event)) return false;
      if (search.q && !matchesQuery(event, search.q, curators)) return false;
      return true;
    });
  }, [search, events, curators]);

  return (
    <Shell>
      <h1 className="vz-page-title">{search.status === "live" ? "Live now" : "Events"}</h1>
      <p className="vz-sub">
        {list.length} {list.length === 1 ? "listing" : "listings"}
        {search.city ? ` in ${search.city}` : " across Nigeria"}
      </p>
      <form
        className="vz-panel"
        style={{ padding: 10 }}
        onSubmit={(event) => event.preventDefault()}
      >
        <input
          className="vz-searchbox"
          value={search.q ?? ""}
          placeholder="Search events, artists, or locations..."
          aria-label="Search events"
          onChange={(event) => update({ q: event.target.value })}
        />
      </form>
      <div className="vz-chips" role="toolbar" aria-label="Category">
        <button type="button" className={!search.category ? "vz-chip is-on" : "vz-chip"} onClick={() => update({ category: undefined })}>
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={search.category === category ? "vz-chip is-on" : "vz-chip"}
            onClick={() => update({ category })}
          >
            {category}
          </button>
        ))}
      </div>
      <div className="vz-chips" role="toolbar" aria-label="City">
        <button type="button" className={!search.city ? "vz-chip is-on" : "vz-chip"} onClick={() => update({ city: undefined })}>
          All cities
        </button>
        {cities.map((city) => (
          <button
            key={city}
            type="button"
            className={search.city === city ? "vz-chip is-on" : "vz-chip"}
            onClick={() => update({ city })}
          >
            {city}
          </button>
        ))}
        <button
          type="button"
          className={search.status === "live" ? "vz-chip is-on" : "vz-chip"}
          onClick={() => update({ status: search.status === "live" ? undefined : "live" })}
        >
          Live
        </button>
      </div>
      {list.length === 0 ? (
        <div className="vz-empty">
          <p>Nothing in the catalogue matches that.</p>
          <button type="button" className="vz-btn" onClick={() => update({ q: undefined, category: undefined, city: undefined, status: undefined })}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className="vz-grid">
          {list.map((event) => (
            <EventCard key={event.slug} event={event} />
          ))}
        </div>
      )}
    </Shell>
  );
}
