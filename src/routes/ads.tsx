import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { AppFrame } from "@/components/vibez/frame";
import { naira } from "@/lib/catalogue";
import { loadAdInventory, loadMyAds, submitAd } from "@/lib/platform.functions";

export const Route = createFileRoute("/ads")({
  component: AdsPage,
});

function AdsPage() {
  const [inventory, setInventory] = useState<Awaited<ReturnType<typeof loadAdInventory>>>([]);
  const [mine, setMine] = useState<Awaited<ReturnType<typeof loadMyAds>>>([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ name: "", objective: "Awareness", placement: "", headline: "", body: "", imageUrl: "", destinationUrl: "", startsOn: "", endsOn: "", businessName: "" });

  useEffect(() => {
    loadAdInventory().then((rows) => {
      setInventory(rows);
      setForm((current) => ({ ...current, placement: rows[0]?.placement ?? current.placement }));
    }).catch(() => undefined);
    loadMyAds().then(setMine).catch(() => undefined);
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      const result = await submitAd({ data: form });
      setMessage(result.configured ? "Campaign submitted. It stays off Home until the Control Room approves it." : result.message);
      setMine(await loadMyAds());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save the campaign.");
    }
  }

  return (
    <AppFrame>
      <h1>Advertising</h1>
      <p className="note">Every live placement is labelled Sponsored. Impressions and clicks below are recorded events, not estimates.</p>
      <form className="panel" onSubmit={(event) => void onSubmit(event)}>
        <h2>New campaign</h2>
        <div className="wizard" aria-hidden="true"><i className="is-on" /><i className={form.name ? "is-on" : undefined} /><i className={form.headline ? "is-on" : undefined} /></div>
        <label className="field">Business<input value={form.businessName} onChange={(event) => setForm({ ...form, businessName: event.target.value })} required /></label>
        <label className="field">Campaign<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
        <label className="field">Objective<input value={form.objective} onChange={(event) => setForm({ ...form, objective: event.target.value })} /></label>
        <label className="field">Placement
          <select value={form.placement} onChange={(event) => setForm({ ...form, placement: event.target.value })}>
            {inventory.map((item) => <option key={item.placement} value={item.placement}>{item.name} · {naira(item.priceKobo)}</option>)}
          </select>
        </label>
        <label className="field">Headline<input value={form.headline} onChange={(event) => setForm({ ...form, headline: event.target.value })} /></label>
        <label className="field">Body<textarea value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} /></label>
        <label className="field">Image URL<input value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} /></label>
        <label className="field">Destination<input value={form.destinationUrl} onChange={(event) => setForm({ ...form, destinationUrl: event.target.value })} /></label>
        <label className="field">Starts<input type="date" value={form.startsOn} onChange={(event) => setForm({ ...form, startsOn: event.target.value })} /></label>
        <label className="field">Ends<input type="date" value={form.endsOn} onChange={(event) => setForm({ ...form, endsOn: event.target.value })} /></label>
        <p className="note">Object storage is optional. Paste a creative URL if uploads are not configured.</p>
        {message ? <p className="warn">{message}</p> : null}
        <button className="btn" type="submit">Submit campaign</button>
      </form>
      {mine.map((item) => (
        <article key={item.id} className="panel">
          <strong>{item.name}</strong>
          <p>{item.status} · {item.placement}</p>
          <p>{item.impressions} impressions · {item.clicks} clicks{item.ctr == null ? "" : ` · ${(item.ctr * 100).toFixed(1)}% CTR`}</p>
        </article>
      ))}
    </AppFrame>
  );
}
