import { createFileRoute, Link } from "@tanstack/react-router";
import { AppFrame } from "@/components/vibez/frame";
import { Media, Sample } from "@/components/vibez/media";
import { loadHome } from "@/lib/platform.functions";

export const Route = createFileRoute("/artists/")({
  loader: () => loadHome(),
  component: ArtistsPage,
});

function ArtistsPage() {
  const { artists } = Route.useLoaderData();
  return (
    <AppFrame>
      <h1 style={{ margin: "8px 0 4px" }}>Artists</h1>
      <p style={{ margin: 0, color: "#69738a" }}>Follower counts are people who tapped Follow. Sample profiles are marked.</p>
      <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
        {artists.map((artist) => (
          <Link key={artist.id} to="/$username" params={{ username: `@${artist.username}` }} className="rowlink" style={{ background: "#fff", borderRadius: 18 }}>
            <span className="media" style={{ width: 56, height: 56, borderRadius: "50%" }}><img className="is-in" src={artist.avatar} alt="" /></span>
            <span>{artist.name}<small>@{artist.username} · {artist.followers} followers · {artist.releases} releases</small></span>
            <Sample on={artist.sample} />
          </Link>
        ))}
      </div>
    </AppFrame>
  );
}
