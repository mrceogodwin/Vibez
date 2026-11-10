import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { useState, type FormEvent } from "react";
import { AppFrame } from "@/components/vibez/frame";
import { Media, Sample } from "@/components/vibez/media";
import { formatWhen, naira } from "@/lib/catalogue";
import { beginCheckout, loadEventsPage } from "@/lib/platform.functions";

export const Route = createFileRoute("/events/$slug")({
  loader: () => loadEventsPage(),
  component: EventPage,
});

function EventPage() {
  const { slug } = Route.useParams();
  const { events, curators } = Route.useLoaderData();
  const event = events.find((item) => item.slug === slug);
  const navigate = useNavigate();
  const [tierCode, setTierCode] = useState(event?.tickets[0]?.code ?? "");
  const [qty, setQty] = useState(1);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  if (!event) {
    return <AppFrame><div className="empty"><h2>Event not listed</h2><Link className="btn" to="/events">Back to events</Link></div></AppFrame>;
  }
  const tier = event.tickets.find((item) => item.code === tierCode) ?? event.tickets[0];
  const curator = curators.find((item) => item.slug === event.curator);
  const subtotal = tier ? tier.priceKobo * qty : 0;

  async function pay(formEvent: FormEvent) {
    formEvent.preventDefault();
    if (!tier) return;
    setPending(true);
    setMessage("");
    try {
      const result = await beginCheckout({
        data: { eventSlug: event!.slug, tierCode: tier.code, qty, buyerName, buyerEmail, buyerPhone },
      });
      if (!result.configured) {
        setMessage(result.message);
        return;
      }
      if (result.free) {
        await navigate({ to: "/checkout/return", search: { reference: result.reference } });
        return;
      }
      if (result.message) setMessage(result.message);
      window.location.assign(result.authorizationUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checkout failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AppFrame>
      <div className="app-hero" style={{ minHeight: 210 }}>
        <Media src={event.cover} alt="" />
        <div className="copy">
          <Sample on={event.sample} />
          <h1>{event.title}</h1>
          <p>{event.category} · {event.city}</p>
        </div>
      </div>
      <div className="panel">
        <p><MapPin size={14} /> {event.venue} · {event.address}</p>
        <p>{event.start && event.end ? formatWhen(event.start, event.end) : ""}</p>
        <p>{event.description}</p>
        {event.ageNote ? <p className="note">{event.ageNote}</p> : null}
        {event.refundPolicy ? <p className="note">{event.refundPolicy}</p> : null}
        {curator ? <p><Link to="/curators/$slug" params={{ slug: curator.slug }}>{curator.name}</Link> · {curator.role}</p> : null}
      </div>
      <form className="panel" onSubmit={(eventForm) => void pay(eventForm)}>
        <h2>Tickets</h2>
        {event.sample ? <p className="note">This is sample catalogue data. Tickets are not on sale.</p> : null}
        {event.tickets.map((item) => (
          <label key={item.code} className="rowlink" style={{ cursor: "pointer" }}>
            <input type="radio" name="tier" checked={tier?.code === item.code} onChange={() => setTierCode(item.code)} />
            <span>{item.name}<small>{item.detail} · {item.remaining} left of {item.quantity}</small></span>
            <strong>{item.priceKobo === 0 ? "Free" : naira(item.priceKobo)}</strong>
          </label>
        ))}
        <label className="field">Quantity
          <input type="number" min={1} max={10} value={qty} onChange={(eventInput) => setQty(Number(eventInput.target.value))} />
        </label>
        <label className="field">Attendee name<input value={buyerName} onChange={(eventInput) => setBuyerName(eventInput.target.value)} required /></label>
        <label className="field">Email<input type="email" value={buyerEmail} onChange={(eventInput) => setBuyerEmail(eventInput.target.value)} required /></label>
        <label className="field">Phone<input value={buyerPhone} onChange={(eventInput) => setBuyerPhone(eventInput.target.value)} /></label>
        <p className="note">Ticket subtotal {naira(subtotal)}. The service fee is added on the server from the Control Room setting. A redirect from Paystack is not treated as payment.</p>
        {message ? <p className="warn">{message}</p> : null}
        <button className="btn" type="submit" disabled={pending || event.sample} style={{ width: "100%", marginTop: 12 }}>
          {event.sample ? "Sample listing" : pending ? "Starting…" : subtotal === 0 ? "Get free tickets" : "Pay with Paystack"}
        </button>
      </form>
    </AppFrame>
  );
}
