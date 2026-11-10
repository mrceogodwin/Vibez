import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Calendar, MapPin, Minus, Plus, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { AppFrame } from "@/components/vibez/frame";
import { Media, Sample } from "@/components/vibez/media";
import { formatWhen, naira } from "@/lib/catalogue";
import { beginCheckout, loadEventsPage } from "@/lib/platform.functions";

export const Route = createFileRoute("/events/$slug")({
  loader: () => loadEventsPage(),
  component: EventPage,
});

function friendly(error: string) {
  if (/paystack|configured|server|control room|catalogue|sample listing/i.test(error)) {
    return "Payments aren't available for this one.";
  }
  return error;
}

function EventPage() {
  const { slug } = Route.useParams();
  const { events, curators } = Route.useLoaderData();
  const event = events.find((item) => item.slug === slug);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [tierCode, setTierCode] = useState(event?.tickets[0]?.code ?? "");
  const [qty, setQty] = useState(1);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  if (!event) {
    return (
      <AppFrame>
        <div className="empty"><h2>Event not found</h2><Link className="btn" to="/events">All events</Link></div>
      </AppFrame>
    );
  }

  const tier = event.tickets.find((item) => item.code === tierCode) ?? event.tickets[0];
  const curator = curators.find((item) => item.slug === event.curator);
  const subtotal = tier ? tier.priceKobo * qty : 0;
  const when = event.start && event.end ? formatWhen(event.start, event.end) : "";
  const maps = `https://maps.apple.com/?q=${encodeURIComponent(`${event.venue}, ${event.address}`)}`;

  async function pay(formEvent: FormEvent) {
    formEvent.preventDefault();
    if (!tier || event?.sample) return;
    setPending(true);
    setMessage("");
    try {
      const result = await beginCheckout({
        data: { eventSlug: event!.slug, tierCode: tier.code, qty, buyerName, buyerEmail, buyerPhone },
      });
      if (!result.configured) {
        setMessage("Payments aren't available right now.");
        return;
      }
      if (result.free) {
        await navigate({ to: "/checkout/return", search: { reference: result.reference } });
        return;
      }
      window.location.assign(result.authorizationUrl);
    } catch (error) {
      setMessage(friendly(error instanceof Error ? error.message : "Couldn't start checkout."));
    } finally {
      setPending(false);
    }
  }

  return (
    <AppFrame>
      <article className="ev">
        <div className="ev-hero">
          <Media src={event.cover} alt="" />
          <div className="ev-shade" />
          <div className="ev-title">
            <Sample on={event.sample} />
            <h1>{event.title}</h1>
            <p>{event.category} · {event.city}</p>
          </div>
        </div>
        <div className="ev-chips">
          <span><Calendar size={14} /> {when}</span>
          <span><MapPin size={14} /> {event.venue}</span>
        </div>
        <p className="ev-about">{event.blurb || event.description}</p>
        <section className="ev-tiers">
          <h2>Tickets</h2>
          {event.tickets.map((item) => (
            <button
              key={item.code}
              type="button"
              className={tier?.code === item.code ? "tier is-on" : "tier"}
              onClick={() => { setTierCode(item.code); setQty(1); setOpen(true); }}
            >
              <span><strong>{item.name}</strong><em>{item.detail}</em></span>
              <b>{item.priceKobo === 0 ? "Free" : naira(item.priceKobo)}</b>
            </button>
          ))}
        </section>
        <section>
          <h2>Lineup</h2>
          {curator ? (
            <Link to="/curators/$slug" params={{ slug: curator.slug }} className="lineup">
              <span className="media"><img src={curator.photo} alt="" /></span>
              <span><strong>{curator.name}</strong><em>{curator.role}</em></span>
            </Link>
          ) : <p className="note">Lineup coming soon.</p>}
        </section>
        <section>
          <h2>Venue</h2>
          <a className="venue" href={maps}>
            <span className="venue-map" aria-hidden="true" />
            <span>
              <strong>{event.venue}</strong>
              <em>{event.address}</em>
            </span>
          </a>
        </section>
      </article>
      <div className="buybar">
        <div>
          <span>From</span>
          <strong>{tier ? (tier.priceKobo === 0 ? "Free" : naira(tier.priceKobo)) : "—"}</strong>
        </div>
        <button type="button" className="btn" onClick={() => setOpen(true)}>
          {event.sample ? "Preview" : "Get tickets"}
        </button>
      </div>
      {open ? (
        <div className="sheet is-open">
          <button type="button" className="sheet-bg" aria-label="Close" onClick={() => setOpen(false)} />
          <form className="sheet-card checkout" onSubmit={(formEvent) => void pay(formEvent)}>
            <div className="sheet-handle" />
            <div className="checkout-head">
              <div>
                <h2>{event.title}</h2>
                <p>{when}</p>
              </div>
              <button type="button" className="app-iconbtn" aria-label="Close" onClick={() => setOpen(false)}><X size={16} /></button>
            </div>
            <div className="checkout-tiers">
              {event.tickets.map((item) => (
                <button key={item.code} type="button" className={tier?.code === item.code ? "tier is-on" : "tier"} onClick={() => { setTierCode(item.code); setQty(1); }}>
                  <span><strong>{item.name}</strong><em>{item.detail}</em></span>
                  <b>{item.priceKobo === 0 ? "Free" : naira(item.priceKobo)}</b>
                </button>
              ))}
            </div>
            <div className="stepper">
              <span>Quantity</span>
              <div>
                <button type="button" aria-label="Fewer" onClick={() => setQty((value) => Math.max(1, value - 1))}><Minus size={16} /></button>
                <strong>{qty}</strong>
                <button type="button" aria-label="More" onClick={() => setQty((value) => Math.min(10, value + 1))}><Plus size={16} /></button>
              </div>
            </div>
            <label className="field">Name<input value={buyerName} onChange={(input) => setBuyerName(input.target.value)} required autoComplete="name" /></label>
            <label className="field">Email<input type="email" value={buyerEmail} onChange={(input) => setBuyerEmail(input.target.value)} required autoComplete="email" /></label>
            <label className="field">Phone<input value={buyerPhone} onChange={(input) => setBuyerPhone(input.target.value)} autoComplete="tel" inputMode="tel" /></label>
            <div className="summary">
              <span>{qty} × {tier?.name}</span>
              <strong>{naira(subtotal)}</strong>
            </div>
            {message ? <p className="warn">{message}</p> : null}
            <button className="btn" type="submit" disabled={pending || event.sample}>{event.sample ? "Not for sale" : pending ? "One moment…" : subtotal === 0 ? "Get tickets" : `Pay ${naira(subtotal)}`}</button>
          </form>
        </div>
      ) : null}
    </AppFrame>
  );
}
