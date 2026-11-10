import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { AppFrame } from "@/components/vibez/frame";
import { naira } from "@/lib/catalogue";
import { loadStudio, submitRelease } from "@/lib/platform.functions";

export const Route = createFileRoute("/studio")({
  component: StudioPage,
});

function StudioPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof loadStudio>> | null>(null);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ artistName: "", title: "", genre: "Afrobeats", listeningUrl: "", artworkUrl: "", description: "", placementCode: "" });

  useEffect(() => {
    loadStudio().then(setData).catch((error) => setMessage(error instanceof Error ? error.message : "Sign in as an artist."));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      const result = await submitRelease({ data: form });
      setMessage("configured" in result && result.configured === false ? result.message : "Submitted for editorial review.");
      const next = await loadStudio();
      setData(next);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not submit.");
    }
  }

  return (
    <AppFrame>
      <h1>Artist studio</h1>
      {data?.username ? <p className="note">Your public page is /@{data.username}</p> : <p className="note">Set a username on your profile to publish /@username.</p>}
      <form className="panel" onSubmit={(event) => void onSubmit(event)}>
        <h2>Submit music</h2>
        <label className="field">Artist name<input value={form.artistName} onChange={(event) => setForm({ ...form, artistName: event.target.value })} required /></label>
        <label className="field">Title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></label>
        <label className="field">Genre<input value={form.genre} onChange={(event) => setForm({ ...form, genre: event.target.value })} /></label>
        <label className="field">Listening link<input value={form.listeningUrl} onChange={(event) => setForm({ ...form, listeningUrl: event.target.value })} required /></label>
        <label className="field">Artwork URL<input value={form.artworkUrl} onChange={(event) => setForm({ ...form, artworkUrl: event.target.value })} /></label>
        <label className="field">Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
        <label className="field">Placement
          <select value={form.placementCode} onChange={(event) => setForm({ ...form, placementCode: event.target.value })}>
            <option value="">No paid placement</option>
            {data?.products.map((item) => <option key={item.code} value={item.code}>{item.name} · {naira(item.priceKobo)} · {item.days} days</option>)}
          </select>
        </label>
        <p className="note">Paying for a placement does not approve the music. Approved paid placements are labelled Sponsored.</p>
        {!data?.integrations.storage ? <p className="note">Object storage is not configured. Paste an artwork URL.</p> : null}
        {message ? <p className="warn">{message}</p> : null}
        <button className="btn" type="submit">Submit</button>
      </form>
      <section>
        <div className="app-row"><h2>Your submissions</h2></div>
        {data?.submissions.length ? data.submissions.map((item) => (
          <article key={item.id} className="panel"><strong>{item.title}</strong><p>{item.status}{item.placement ? ` · ${item.placement}` : ""}{item.amountKobo ? ` · ${naira(item.amountKobo)}` : ""}</p>{item.note ? <p>{item.note}</p> : null}</article>
        )) : <p className="note">No submissions yet.</p>}
      </section>
    </AppFrame>
  );
}
