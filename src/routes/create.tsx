import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { AppFrame } from "@/components/vibez/frame";
import { categories, cities } from "@/lib/catalogue";
import { becomeOrganiser, submitEvent } from "@/lib/platform.functions";

export const Route = createFileRoute("/create")({
  component: CreateEventPage,
});

function CreateEventPage() {
  const [message, setMessage] = useState("");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(categories[0]);
  const [city, setCity] = useState(cities[0]);
  const [venue, setVenue] = useState("");
  const [address, setAddress] = useState("");
  const [start, setStart] = useState("");
  const [description, setDescription] = useState("");
  const [ticketName, setTicketName] = useState("Regular");
  const [price, setPrice] = useState("0");
  const [quantity, setQuantity] = useState("100");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      const result = await submitEvent({
        data: {
          title, category, city, venue, address, start, end: start, description,
          cover: "", ageNote: "", refundPolicy: "Refunds follow the policy on this event after it is approved.",
          tickets: [{ name: ticketName, priceNaira: Number(price), quantity: Number(quantity), detail: "Entry" }],
        },
      });
      setSlug(result.slug);
    } catch (error) {
      const text = error instanceof Error ? error.message : "Could not submit.";
      setMessage(text);
    }
  }

  return (
    <AppFrame>
      <h1 style={{ marginTop: 8 }}>List an event</h1>
      <p className="note">Drafts are saved on the server as pending. They are not public until the Control Room approves them. Sample catalogue events are separate and not for sale.</p>
      {slug ? (
        <div className="empty">
          <h2>Submitted for review</h2>
          <p>Reference {slug}. It will not appear on Home until it is approved.</p>
          <Link className="btn" to="/organise">Organiser home</Link>
        </div>
      ) : (
        <form className="panel" onSubmit={(event) => void onSubmit(event)}>
          <label className="field">Title<input value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
          <label className="field">Category
            <select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select>
          </label>
          <label className="field">City
            <select value={city} onChange={(event) => setCity(event.target.value)}>{cities.map((item) => <option key={item}>{item}</option>)}</select>
          </label>
          <label className="field">Venue<input value={venue} onChange={(event) => setVenue(event.target.value)} required /></label>
          <label className="field">Address<input value={address} onChange={(event) => setAddress(event.target.value)} required /></label>
          <label className="field">Starts<input type="datetime-local" value={start} onChange={(event) => setStart(event.target.value)} required /></label>
          <label className="field">Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} required /></label>
          <label className="field">Ticket name<input value={ticketName} onChange={(event) => setTicketName(event.target.value)} required /></label>
          <label className="field">Price in naira (0 for free)<input inputMode="numeric" value={price} onChange={(event) => setPrice(event.target.value)} required /></label>
          <label className="field">Quantity<input inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} required /></label>
          {message ? <p className="warn">{message}</p> : null}
          <button className="btn" type="submit" style={{ width: "100%", marginTop: 12 }}>Submit for approval</button>
          <button
            className="btn ghost"
            type="button"
            style={{ width: "100%", marginTop: 8 }}
            onClick={() => void becomeOrganiser({ data: { displayName: "Organiser" } }).then(() => setMessage("Organiser application sent.")).catch((error) => setMessage(error instanceof Error ? error.message : "Could not apply."))}
          >
            Apply as organiser
          </button>
        </form>
      )}
    </AppFrame>
  );
}
