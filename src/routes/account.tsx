import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/vibez/shell";
import { cities, naira } from "@/lib/catalogue";
import { loadCatalogue } from "@/lib/vibez.functions";
import { usePrefs } from "@/lib/prefs";

export const Route = createFileRoute("/account")({
  loader: () => loadCatalogue(),
  component: AccountPage,
});

function AccountPage() {
  const { events } = Route.useLoaderData();
  const profile = usePrefs((state) => state.profile);
  const setProfile = usePrefs((state) => state.setProfile);
  const clearProfile = usePrefs((state) => state.clearProfile);
  const saved = usePrefs((state) => state.saved);
  const following = usePrefs((state) => state.following);
  const drafts = usePrefs((state) => state.drafts);
  const holds = usePrefs((state) => state.holds);
  const removeDraft = usePrefs((state) => state.removeDraft);
  const removeHold = usePrefs((state) => state.removeHold);
  const [name, setName] = useState(profile?.name ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [city, setCity] = useState(profile?.city ?? cities[0]);

  const savedEvents = saved.map((slug) => events.find((event) => event.slug === slug)).filter((event) => event != null);

  return (
    <Shell>
      <h1 className="vz-page-title">Account</h1>
      <p className="vz-sub">Saved on this device. This is not a signed-in VIBEZ account and it does not take payment.</p>

      <section className="vz-panel">
        <h2>{profile ? profile.name : "Your name on this device"}</h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setProfile({ name: name.trim(), email: email.trim(), city });
          }}
        >
          <label className="vz-field">
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="vz-field">
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="vz-field">
            City
            <select value={city} onChange={(e) => setCity(e.target.value)}>
              {cities.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <button className="vz-btn" type="submit">
            Save on this device
          </button>
          {profile ? (
            <button className="vz-btn-line" type="button" onClick={clearProfile} style={{ marginLeft: 8 }}>
              Clear
            </button>
          ) : null}
        </form>
      </section>

      <section className="vz-panel">
        <h2>Saved events</h2>
        {savedEvents.length === 0 ? (
          <p className="vz-note">Hearts on event cards land here.</p>
        ) : (
          <div className="vz-list">
            {savedEvents.map((event) => (
              <Link key={event.slug} to="/events/$slug" params={{ slug: event.slug }} className="item">
                <img src={event.cover} alt="" />
                <span>
                  <strong>{event.title}</strong>
                  <p className="vz-role">{event.city}</p>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="vz-panel">
        <h2>Following</h2>
        {following.length === 0 ? (
          <p className="vz-note">Follow a curator from the home row.</p>
        ) : (
          <div className="vz-list">
            {following.map((slug) => (
              <Link key={slug} to="/curators/$slug" params={{ slug }} className="item">
                <span>{slug}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="vz-panel">
        <h2>Drafts</h2>
        {drafts.length === 0 ? (
          <p className="vz-note">
            Nothing drafted. <Link to="/create">Create an event</Link>.
          </p>
        ) : (
          <div className="vz-list">
            {drafts.map((draft) => (
              <div key={draft.id} className="item">
                <span>
                  <strong>{draft.title}</strong>
                  <p className="vz-role">
                    {draft.city} · {draft.id} · not published
                  </p>
                </span>
                <button type="button" className="vz-btn-line" onClick={() => removeDraft(draft.id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="vz-panel">
        <h2>Ticket holds</h2>
        {holds.length === 0 ? (
          <p className="vz-note">Holds show up after you request tickets. They are unpaid.</p>
        ) : (
          <div className="vz-list">
            {holds.map((hold) => (
              <div key={hold.id} className="item">
                <span>
                  <strong>{hold.id}</strong>
                  <p className="vz-role">
                    {hold.qty} × {hold.tierName} · {hold.eventTitle} · {naira(hold.amountKobo)} · unpaid
                  </p>
                </span>
                <button type="button" className="vz-btn-line" onClick={() => removeHold(hold.id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="vz-note">{events.length} public listings are on the catalogue. Drafts are not among them.</p>
      </section>
    </Shell>
  );
}
