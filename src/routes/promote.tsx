import { createFileRoute, Link } from "@tanstack/react-router";
import { Dock } from "@/components/vibez/dock";

export const Route = createFileRoute("/promote")({
  component: PromotePage,
});

function PromotePage() {
  return (
    <main className="fd-light">
      <div className="fd">
        <h1>Promote</h1>
        <p className="fd-sub">Music placements, community push and ads are the next commercial products. Nothing here takes payment yet.</p>
        <div className="fd-menu">
          <Link to="/music">Music placements</Link>
          <Link to="/create">List an event</Link>
          <Link to="/events">Event tickets</Link>
        </div>
        <Dock tone="light" />
      </div>
    </main>
  );
}
