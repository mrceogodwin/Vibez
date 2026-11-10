import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppFrame } from "@/components/vibez/frame";
import { loadTicket } from "@/lib/platform.functions";

export const Route = createFileRoute("/tickets/$code")({
  component: TicketPage,
});

function TicketPage() {
  const { code } = Route.useParams();
  const [ticket, setTicket] = useState<Awaited<ReturnType<typeof loadTicket>>>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    loadTicket({ data: { code } }).then((row) => {
      setTicket(row);
      setMissing(!row);
    }).catch(() => setMissing(true));
  }, [code]);
  return (
    <AppFrame>
      {missing ? <div className="empty"><h2>Ticket not on this account</h2><Link className="btn" to="/tickets">Your tickets</Link></div> : null}
      {ticket ? (
        <article className="panel" style={{ textAlign: "center" }}>
          <p className="pill">{ticket.status}</p>
          <h1>{ticket.title}</h1>
          <p>{ticket.category} · {ticket.attendee}</p>
          <p>{ticket.venue}, {ticket.city}</p>
          <div style={{ background: "#fff", borderRadius: 16, padding: 12 }} dangerouslySetInnerHTML={{ __html: ticket.qrSvg }} />
          <p className="note">Code {ticket.code}. The QR code is a ticket token. It does not include payment details. Entry is checked on the server.</p>
        </article>
      ) : null}
    </AppFrame>
  );
}
