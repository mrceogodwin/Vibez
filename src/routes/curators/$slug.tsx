import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { EventCard } from "@/components/vibez/event-card";
import { Shell } from "@/components/vibez/shell";
import { loadCatalogue } from "@/lib/vibez.functions";
import { usePrefs } from "@/lib/prefs";

export const Route = createFileRoute("/curators/$slug")({
  loader: () => loadCatalogue(),
  component: CuratorPage,
});

function CuratorPage() {
  const { slug } = Route.useParams();
  const { events, curators } = Route.useLoaderData();
  const curator = curators.find((item) => item.slug === slug);
  const following = usePrefs((state) => state.following.includes(slug));
  const toggleFollow = usePrefs((state) => state.toggleFollow);

  if (!curator) {
    return (
      <Shell>
        <div className="vz-empty">
          <p>That curator is not in the catalogue.</p>
          <Link to="/curators" className="vz-btn">
            All curators
          </Link>
        </div>
      </Shell>
    );
  }

  const list = events.filter((event) => event.curator === curator.slug);

  return (
    <Shell>
      <Link to="/curators" className="vz-back">
        <ChevronLeft size={16} /> Curators
      </Link>
      <div className="vz-detail" style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <span className="vz-avatar" style={{ width: 92, height: 92 }}>
          <img src={curator.photo} alt="" />
        </span>
        <div>
          <h1 style={{ margin: 0 }}>{curator.name}</h1>
          <p className="vz-role">
            {curator.role} · {curator.city}
          </p>
          <button type="button" className={following ? "vz-follow is-on" : "vz-follow"} onClick={() => toggleFollow(curator.slug)}>
            {following ? "Following" : "Follow"}
          </button>
        </div>
      </div>
      <p className="vz-sub">{curator.bio}</p>
      <div className="vz-head">
        <h2>Their events</h2>
      </div>
      {list.length === 0 ? (
        <div className="vz-empty">No public events from this profile yet.</div>
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
