import { createFileRoute } from "@tanstack/react-router";
import { Dock } from "@/components/vibez/dock";

export const Route = createFileRoute("/activity")({
  component: ActivityPage,
});

function ActivityPage() {
  return (
    <main className="fd-light">
      <div className="fd">
        <h1>Activity</h1>
        <p className="fd-empty">No alerts yet. Ticket receipts, campaign updates and event reminders will show up here.</p>
        <Dock tone="light" />
      </div>
    </main>
  );
}
