import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Actions, Board, RealChart, Stat } from "@/components/vibez/board";
import { AppFrame } from "@/components/vibez/frame";
import { naira } from "@/lib/catalogue";
import { loadAdInventory, loadMyAds, submitAd } from "@/lib/platform.functions";

export const Route = createFileRoute("/ads")({
  component: AdsPage,
});

function AdsPage() {
  const [inventory, setInventory] = useState<Awaited<ReturnType<typeof loadAdInventory>>>([]);
  const [mine, setMine] = useState<Awaited<ReturnType<typeof loadMyAds>>>([]);
  const [locked, setLocked] = useState(false);
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", objective: "Awareness", placement: "", headline: "", body: "", imageUrl: "", destinationUrl: "", startsOn: "", endsOn: "", businessName: "" });

  useEffect(() => {
    loadAdInventory().then((rows) => {
      setInventory(rows);
      setForm((current) => ({ ...current, placement: rows[0]?.placement ?? current.placement }));
    }).catch(() => undefined);
    loadMyAds().then(setMine).catch(() => setLocked(true));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      const result = await submitAd({ data: form });
      setMessage(result.configured ? "Sent for review." : "Saved. Paid campaigns aren't available yet.");
      setOpen(false);
      setMine(await loadMyAds());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Couldn't save that.");
    }
  }

  const impressions = mine.reduce((sum, item) => sum + item.impressions, 0);
  const clicks = mine.reduce((sum, item) => sum + item.clicks, 0);

  return (
    <AppFrame>
      <Board kicker="Advertising" title="Campaigns">
        {locked ? <div className="empty"><h2>Your ads</h2><p>Sign in to run a campaign.</p><Link className="btn" to="/login">Log in</Link></div> : null}
        <div className="hero-stats">
          <Stat label="Campaigns" value={String(mine.length)} />
          <Stat label="Impressions" value={String(impressions)} />
          <Stat label="Clicks" value={String(clicks)} />
        </div>
        <RealChart
          data={mine.map((item) => ({ name: item.name.split(" ")[0], value: item.clicks }))}
          empty="Clicks show up here once a live campaign is seen."
        />
        <Actions items={[
          { href: "#new", label: "New campaign", detail: "Pick a placement" },
          { href: "/home", label: "Home", detail: "Where ads can run" },
          { href: "/promote", label: "Promote", detail: "Other ways" },
        ]} />
        <h2>Recent</h2>
        {mine.length === 0 ? <div className="empty"><h2>No campaigns yet</h2><p>Create one and track it here.</p></div> : mine.map((item) => (
          <article key={item.id} className="activity-row">
            <span className="avatar-dot">{item.name.slice(0, 1)}</span>
            <span><strong>{item.name}</strong><em>{item.status} · {item.impressions} views · {item.clicks} clicks</em></span>
          </article>
        ))}
        <form id="new" className="panel" onSubmit={(event) => void onSubmit(event)}>
          <button type="button" className="btn ghost" onClick={() => setOpen((value) => !value)}>{open ? "Close" : "Create campaign"}</button>
          {open ? (
            <>
              <label className="field">Business<input value={form.businessName} onChange={(event) => setForm({ ...form, businessName: event.target.value })} required /></label>
              <label className="field">Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
              <label className="field">Placement
                <select value={form.placement} onChange={(event) => setForm({ ...form, placement: event.target.value })}>
                  {inventory.map((item) => <option key={item.placement} value={item.placement}>{item.name} · {naira(item.priceKobo)}</option>)}
                </select>
              </label>
              <label className="field">Headline<input value={form.headline} onChange={(event) => setForm({ ...form, headline: event.target.value })} /></label>
              <label className="field">Message<textarea value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} /></label>
              <label className="field">Image link<input value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} /></label>
              <label className="field">Link<input value={form.destinationUrl} onChange={(event) => setForm({ ...form, destinationUrl: event.target.value })} /></label>
              <label className="field">Starts<input type="date" value={form.startsOn} onChange={(event) => setForm({ ...form, startsOn: event.target.value })} /></label>
              <label className="field">Ends<input type="date" value={form.endsOn} onChange={(event) => setForm({ ...form, endsOn: event.target.value })} /></label>
              <button className="btn" type="submit">Send</button>
            </>
          ) : null}
          {message ? <p className="note">{message}</p> : null}
        </form>
      </Board>
    </AppFrame>
  );
}
