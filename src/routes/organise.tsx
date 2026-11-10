import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppFrame } from "@/components/vibez/frame";
import { naira } from "@/lib/catalogue";
import { checkInTicket, loadOrganiser } from "@/lib/platform.functions";

export const Route = createFileRoute("/organise")({
  component: OrganiserPage,
});

function OrganiserPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof loadOrganiser>> | null>(null);
  const [eventSlug, setEventSlug] = useState("");
  const [token, setToken] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadOrganiser().then((value) => {
      setData(value);
      setEventSlug(value.events[0]?.slug ?? "");
    }).catch((err) => setError(err instanceof Error ? err.message : "Sign in as an organiser."));
  }, []);

  return (
    <AppFrame>
      <h1>Organiser</h1>
      {error ? <p className="warn">{error}</p> : null}
      {data ? (
        <div className="stats">
          <div><strong>{data.ticketsSold}</strong><span>Tickets issued</span></div>
          <div><strong>{naira(data.ticketRevenueKobo)}</strong><span>Ticket sales</span></div>
          <div><strong>{data.events.length}</strong><span>Your events</span></div>
        </div>
      ) : null}
      <p className="note">Sales figures count paid orders only. Sample catalogue events are not included.</p>
      {data && data.series.some((item) => item.tickets > 0) ? (
        <section className="panel">
          <h2>Tickets by event</h2>
          {data.series.map((item) => (
            <div key={item.title} style={{ marginTop: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span>{item.title}</span><strong>{item.tickets}</strong></div>
              <div style={{ height: 8, background: "#eef1ff", borderRadius: 99 }}>
                <div style={{ width: `${Math.max(8, (item.tickets / Math.max(...data.series.map((row) => row.tickets), 1)) * 100)}%`, height: "100%", background: "#1016c9", borderRadius: 99 }} />
              </div>
            </div>
          ))}
        </section>
      ) : (
        <div className="empty">
          <h2>No paid tickets yet</h2>
          <p>The sales chart uses confirmed orders only. It stays empty until a real purchase lands.</p>
          <Link className="btn" to="/create">List an event</Link>
        </div>
      )}
      <section>
        {data?.events.map((event) => (
          <article key={event.slug} className="panel"><strong>{event.title}</strong><p>{event.status} · {event.city}</p></article>
        ))}
      </section>
      <form className="panel" onSubmit={(event) => {
        event.preventDefault();
        checkInTicket({ data: { token, eventSlug } })
          .then((scan) => setResult(scan.message))
          .catch((err) => setResult(err instanceof Error ? err.message : "Scan failed."));
      }}>
        <h2>Scan a ticket</h2>
        <label className="field">Event
          <select value={eventSlug} onChange={(event) => setEventSlug(event.target.value)}>
            {data?.events.map((event) => <option key={event.slug} value={event.slug}>{event.title}</option>)}
          </select>
        </label>
        <label className="field">Ticket code<input value={token} onChange={(event) => setToken(event.target.value)} placeholder="Scan or type the code" /></label>
        <button className="btn" type="submit">Check server-side</button>
        {result ? <p className="note">{result}</p> : null}
        <p className="note">Camera scanning uses this same check. A code is admitted once. Payment status is the order behind the ticket, not the QR text.</p>
      </form>
    </AppFrame>
  );
}
