import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, MapPin, Minus, Plus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Shell } from "@/components/vibez/shell";
import { formatWhen, isLive, naira } from "@/lib/catalogue";
import { loadCatalogue } from "@/lib/vibez.functions";
import { refCode, usePrefs } from "@/lib/prefs";

export const Route = createFileRoute("/events/$slug")({
  loader: () => loadCatalogue(),
  component: EventDetail,
});

function EventDetail() {
  const { slug } = Route.useParams();
  const { events, curators } = Route.useLoaderData();
  const event = events.find((item) => item.slug === slug);
  const [tierId, setTierId] = useState(event?.tickets[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [buyer, setBuyer] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [holdId, setHoldId] = useState<string | null>(null);
  const addHold = usePrefs((state) => state.addHold);
  const profile = usePrefs((state) => state.profile);

  if (!event) {
    return (
      <Shell>
        <div className="vz-empty">
          <p>That event is not on the catalogue.</p>
          <Link to="/events" className="vz-btn">
            Back to events
          </Link>
        </div>
      </Shell>
    );
  }

  const curator = curators.find((item) => item.slug === event.curator);
  const tier = event.tickets.find((item) => item.id === tierId) ?? event.tickets[0];
  const left = tier.quantity - tier.sold;
  const amount = tier.priceKobo * qty;

  function placeHold(formEvent: FormEvent) {
    formEvent.preventDefault();
    if (!buyer.trim() || !email.trim() || !phone.trim()) return;
    const id = refCode();
    addHold({
      id,
      eventSlug: event!.slug,
      eventTitle: event!.title,
      tierName: tier.name,
      qty,
      amountKobo: amount,
      buyer: buyer.trim(),
      email: email.trim(),
      phone: phone.trim(),
      createdAt: new Date().toISOString(),
    });
    setHoldId(id);
  }

  return (
    <Shell>
      <Link to="/events" className="vz-back">
        <ChevronLeft size={16} /> Events
      </Link>
      <div className="vz-cover">
        <img src={event.cover} alt="" />
      </div>
      <div className="vz-detail">
        <p className="vz-kicker">
          {event.category}
          {isLive(event) ? " · Live" : ""}
        </p>
        <h1>{event.title}</h1>
        <p className="vz-meta">
          <span>{formatWhen(event.start, event.end)}</span>
        </p>
        <p className="vz-meta">
          <MapPin />
          <span>
            {event.venue} · {event.address}
          </span>
        </p>
        <p className="vz-prose">{event.description}</p>
        {curator ? (
          <Link to="/curators/$slug" params={{ slug: curator.slug }} className="vz-org">
            <span className="vz-avatar">
              <img src={curator.photo} alt="" />
            </span>
            <span>
              <strong>{curator.name}</strong>
              <p className="vz-role">
                {curator.role} · {curator.city}
              </p>
            </span>
          </Link>
        ) : null}
      </div>

      <section className="vz-panel">
        <h2>Tickets</h2>
        {event.tickets.map((item) => {
          const remaining = item.quantity - item.sold;
          return (
            <label key={item.id} className="vz-tier">
              <input
                type="radio"
                name="tier"
                checked={tier.id === item.id}
                onChange={() => {
                  setTierId(item.id);
                  setQty(1);
                }}
              />
              <span>
                <p>
                  <strong>{item.name}</strong> · {naira(item.priceKobo)}
                </p>
                <small>
                  {item.detail}. {remaining} left of {item.quantity}.
                </small>
              </span>
              <span />
            </label>
          );
        })}
        <div className="vz-step" style={{ marginTop: 8 }}>
          <button type="button" aria-label="Fewer tickets" onClick={() => setQty((value) => Math.max(1, value - 1))}>
            <Minus size={14} />
          </button>
          <strong>{qty}</strong>
          <button
            type="button"
            aria-label="More tickets"
            onClick={() => setQty((value) => Math.min(left, value + 1))}
          >
            <Plus size={14} />
          </button>
          <span className="vz-price">
            Total <strong>{naira(amount)}</strong>
          </span>
        </div>
      </section>

      <section className="vz-panel">
        {holdId ? (
          <>
            <h2>Hold {holdId}</h2>
            <p className="vz-prose">
              {qty} × {tier.name} for {event.title} is held under {buyer}. Amount {naira(amount)}.
            </p>
            <p className="vz-warn">
              No charge was made. VIBEZ issues a ticket only after a verified payment. This hold is not entry
              and has no QR code.
            </p>
          </>
        ) : (
          <form onSubmit={placeHold}>
            <h2>Your details</h2>
            <p className="vz-note">
              {profile ? `Using the name on this device is fine. ` : null}
              Payment is not taken here.
            </p>
            <label className="vz-field">
              Full name
              <input value={buyer} onChange={(e) => setBuyer(e.target.value)} required autoComplete="name" />
            </label>
            <div className="vz-row-2">
              <label className="vz-field">
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </label>
              <label className="vz-field">
                Phone
                <input value={phone} onChange={(e) => setPhone(e.target.value)} required autoComplete="tel" />
              </label>
            </div>
            <button className="vz-btn" type="submit" disabled={left < 1}>
              {left < 1 ? "Sold out" : `Hold ${naira(amount)}`}
            </button>
          </form>
        )}
      </section>
    </Shell>
  );
}
