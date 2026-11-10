import { createFileRoute, Link } from "@tanstack/react-router";
import { AppFrame } from "@/components/vibez/frame";

export const Route = createFileRoute("/promote")({
  component: PromotePage,
});

function PromotePage() {
  return (
    <AppFrame>
      <h1>Promote</h1>
      <p className="note">Placements, community push and ads each have their own review. Nothing here is charged until Paystack is configured and a campaign is approved.</p>
      <div className="group">
        <Link className="rowlink" to="/studio">Music placements</Link>
        <Link className="rowlink" to="/community">Community push</Link>
        <Link className="rowlink" to="/ads">Advertising</Link>
        <Link className="rowlink" to="/create">List an event</Link>
      </div>
    </AppFrame>
  );
}
