import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Actions, Board, RealChart, Stat } from "@/components/vibez/board";
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
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    loadOrganiser().then((value) => {
      setData(value);
      setEventSlug(value.events[0]?.slug ?? "");
    }).catch(() => setLocked(true));
  }, []);

  const series = data?.series ?? [];
  return (
    <AppFrame>
      <Board kicker="Organiser" title="Your nights">
        <div className="hero-stats">
          <Stat label="Tickets" value={String(data?.ticketsSold ?? 0)} />
          <Stat label="Sales" value={naira(data?.ticketRevenueKobo ?? 0)} />
          <Stat label="Events" value={String(data?.events.length ?? 0)} />
        </div>
        <RealChart data={series.map((item) => ({ name: item.title.split(" ")[0], value: item.tickets }))} empty="Sales appear here after a ticket is paid for." />
        <Actions items={[
          { href: "/create", label: "New event", detail: "List a night" },
          { href: "#door", label: "Door", detail: "Check a ticket" },
          { href: "/events", label: "Discover", detail: "What's on" },
        ]} />
        <h2>Events</h2>
        {locked ? (
          <div className="empty"><h2>Sign in</h2><p>Your events and sales show up here.</p><Link className="btn" to="/login">Log in</Link></div>
        ) : (data?.events.length ?? 0) === 0 ? (
          <div className="empty"><h2>No events yet</h2><p>List one and it shows up here.</p></div>
        ) : data?.events.map((event) => (
          <Link key={event.slug} to="/events/$slug" params={{ slug: event.slug }} className="activity-row">
            <span className="avatar-dot">{event.title.slice(0, 1)}</span>
            <span><strong>{event.title}</strong><em>{event.city} · {event.status.toLowerCase()}</em></span>
          </Link>
        ))}
        <form id="door" className="panel" onSubmit={(event) => {
          event.preventDefault();
          checkInTicket({ data: { token, eventSlug } })
            .then((scan) => setResult(scan.message))
            .catch(() => setResult("That code didn't check in."));
        }}>
          <h2>At the door</h2>
          <label className="field">Event
            <select value={eventSlug} onChange={(event) => setEventSlug(event.target.value)}>
              {data?.events.map((event) => <option key={event.slug} value={event.slug}>{event.title}</option>)}
            </select>
          </label>
          <label className="field">Ticket code<input value={token} onChange={(event) => setToken(event.target.value)} placeholder="Type or paste the code" /></label>
          <button className="btn" type="submit">Check in</button>
          {result ? <p className="note">{result}</p> : null}
        </form>
      </Board>
    </AppFrame>
  );
}
