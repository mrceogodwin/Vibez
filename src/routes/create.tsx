import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Shell } from "@/components/vibez/shell";
import { categories, cities } from "@/lib/catalogue";
import { refCode, usePrefs } from "@/lib/prefs";

export const Route = createFileRoute("/create")({
  component: CreatePage,
});

function CreatePage() {
  const addDraft = usePrefs((state) => state.addDraft);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(categories[0]);
  const [city, setCity] = useState<string>(cities[0]);
  const [venue, setVenue] = useState("");
  const [when, setWhen] = useState("");
  const [description, setDescription] = useState("");
  const [ticketName, setTicketName] = useState("Regular");
  const [priceNaira, setPriceNaira] = useState("");
  const [quantity, setQuantity] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const id = refCode();
    addDraft({
      id,
      title: title.trim(),
      category,
      city,
      venue: venue.trim(),
      when,
      description: description.trim(),
      ticketName: ticketName.trim(),
      priceNaira,
      quantity,
    });
    setSavedId(id);
  }

  return (
    <Shell>
      <h1 className="vz-page-title">Create event</h1>
      <p className="vz-sub">Drafts stay on this device. They are not added to the public catalogue.</p>
      {savedId ? (
        <section className="vz-panel">
          <h2>Draft {savedId}</h2>
          <p className="vz-prose">
            {title} in {city} is saved on this device only. It will not appear under Featured Events.
          </p>
          <Link to="/account" className="vz-btn">
            See it on Account
          </Link>
        </section>
      ) : (
        <form className="vz-panel" onSubmit={submit}>
          <label className="vz-field">
            Event title
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <div className="vz-row-2">
            <label className="vz-field">
              Category
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="vz-field">
              City
              <select value={city} onChange={(e) => setCity(e.target.value)}>
                {cities.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="vz-field">
            Venue
            <input value={venue} onChange={(e) => setVenue(e.target.value)} required />
          </label>
          <label className="vz-field">
            Starts
            <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} required />
          </label>
          <label className="vz-field">
            Description
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
          </label>
          <div className="vz-row-2">
            <label className="vz-field">
              Ticket name
              <input value={ticketName} onChange={(e) => setTicketName(e.target.value)} required />
            </label>
            <label className="vz-field">
              Price (₦)
              <input inputMode="numeric" value={priceNaira} onChange={(e) => setPriceNaira(e.target.value)} required />
            </label>
          </div>
          <label className="vz-field">
            Quantity
            <input inputMode="numeric" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
          </label>
          <button className="vz-btn" type="submit">
            Save draft
          </button>
        </form>
      )}
    </Shell>
  );
}
