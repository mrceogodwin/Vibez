import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppFrame } from "@/components/vibez/frame";
import { Media } from "@/components/vibez/media";
import { loadTicket } from "@/lib/platform.functions";

export const Route = createFileRoute("/tickets/$code")({
  component: TicketPage,
});

function TicketPage() {
  const { code } = Route.useParams();
  const [ticket, setTicket] = useState<Awaited<ReturnType<typeof loadTicket>>>(null);
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    loadTicket({ data: { code } }).then((row) => { setTicket(row); setMissing(!row); }).catch(() => setMissing(true));
  }, [code]);
  if (!ticket && !missing) {
    return <AppFrame><div className="skel" style={{ height: 420 }} /></AppFrame>;
  }
  return (
    <AppFrame>
      {missing ? <div className="empty"><h2>Ticket not on this account</h2><p>Passes only open for the person who bought them.</p><Link className="btn" to="/tickets">Your tickets</Link></div> : null}
      {ticket ? (
        <article className="pass">
          <div className="pass-top">
            <Media src={ticket.cover} alt="" />
            <div className="shade" />
            <div className="copy">
              <span className="pill">{ticket.status}</span>
              <h1 style={{ margin: "8px 0 0", fontSize: 26 }}>{ticket.title}</h1>
            </div>
          </div>
          <div className="pass-body">
            <div className="pass-qr" dangerouslySetInnerHTML={{ __html: ticket.qrSvg }} />
            <p style={{ margin: "8px 0 0", fontWeight: 800 }}>{ticket.attendee}</p>
            <p style={{ margin: 0, color: "#69738a" }}>{ticket.category}</p>
            <div className="pass-stub">
              <div><span>Venue</span><strong>{ticket.venue}</strong></div>
              <div><span>Code</span><strong>{ticket.code}</strong></div>
            </div>
            <p className="note" style={{ marginTop: 12 }}>This QR is a ticket token. It does not include payment details. The gate checks it on the server, once.</p>
          </div>
        </article>
      ) : null}
    </AppFrame>
  );
}
