import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppFrame } from "@/components/vibez/frame";
import { loadHome } from "@/lib/platform.functions";

export const Route = createFileRoute("/music/$slug")({
  loader: () => loadHome(),
  component: LegacyTrack,
});

function LegacyTrack() {
  const { slug } = Route.useParams();
  const data = Route.useLoaderData();
  const navigate = useNavigate();
  const release = data.releases.find((item) => item.slug === slug);
  useEffect(() => {
    if (!release) return;
    void navigate({ to: "/$username/$slug", params: { username: `@${release.artist.username}`, slug: release.slug }, replace: true });
  }, [release, navigate]);
  if (!release) {
    return <AppFrame><div className="empty"><h2>That track is not published</h2><Link className="btn" to="/music">Music</Link></div></AppFrame>;
  }
  return <AppFrame><p className="note">Opening @{release.artist.username}/{release.slug}…</p></AppFrame>;
}
