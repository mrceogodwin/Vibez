import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/vibez/shell";
import { loadCatalogue } from "@/lib/vibez.functions";
import { usePrefs } from "@/lib/prefs";

export const Route = createFileRoute("/curators/")({
  loader: () => loadCatalogue(),
  component: CuratorsPage,
});

function CuratorsPage() {
  const { curators } = Route.useLoaderData();
  const following = usePrefs((state) => state.following);
  const toggleFollow = usePrefs((state) => state.toggleFollow);

  return (
    <Shell>
      <h1 className="vz-page-title">Curators</h1>
      <p className="vz-sub">Hosts, artists and comedy rooms in the catalogue. Follow is saved on this device.</p>
      <div className="vz-curators" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", overflow: "visible" }}>
        {curators.map((curator) => {
          const on = following.includes(curator.slug);
          return (
            <div key={curator.slug} className="vz-curator">
              <Link to="/curators/$slug" params={{ slug: curator.slug }} className="vz-avatar">
                <img src={curator.photo} alt="" />
              </Link>
              <Link to="/curators/$slug" params={{ slug: curator.slug }}>
                <strong>{curator.name}</strong>
              </Link>
              <p className="vz-role">
                {curator.role} · {curator.city}
              </p>
              <button type="button" className={on ? "vz-follow is-on" : "vz-follow"} onClick={() => toggleFollow(curator.slug)}>
                {on ? "Following" : "Follow"}
              </button>
            </div>
          );
        })}
      </div>
    </Shell>
  );
}
