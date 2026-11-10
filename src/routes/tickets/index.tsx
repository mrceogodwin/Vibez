import { createFileRoute, Link } from "@tanstack/react-router";
import { Ticket } from "lucide-react";
import { useEffect, useState } from "react";
import { AppFrame } from "@/components/vibez/frame";
import { loadTickets } from "@/lib/platform.functions";

export const Route = createFileRoute("/tickets/")({
  component: TicketsPage,
});

function TicketsPage() {
  const [rows, setRows] = useState<Awaited<ReturnType<typeof loadTickets>> | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    loadTickets().then(setRows).catch(() => setError("Sign in to see tickets bought on this account."));
  }, []);
  return (
    <AppFrame>
      <h1>Tickets</h1>
      {error ? <div className="empty"><div className="mark"><Ticket /></div><h2>Sign in</h2><p>{error}</p><Link className="btn" to="/login">Log in</Link></div> : null}
      {rows && rows.length === 0 ? (
        <div className="empty">
          <div className="mark"><Ticket /></div>
          <h2>No tickets yet</h2>
          <p>Tickets appear after Paystack confirms a payment, or immediately for a free ticket. Sample events are not for sale.</p>
          <Link className="btn" to="/events">Find an event</Link>
        </div>
      ) : null}
      {rows?.map((ticket) => (
        <Link key={ticket.code} to="/tickets/$code" params={{ code: ticket.code }} className="rowlink" style={{ background: "#fff", borderRadius: 16, marginTop: 8 }}>
          <span>{ticket.title}<small>{ticket.category} · {ticket.status}</small></span>
        </Link>
      ))}
    </AppFrame>
  );
}
