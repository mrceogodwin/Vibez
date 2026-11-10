import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Actions, Board, RealChart, Stat } from "@/components/vibez/board";
import { AppFrame } from "@/components/vibez/frame";
import { naira } from "@/lib/catalogue";
import { loadStudio, submitRelease } from "@/lib/platform.functions";

export const Route = createFileRoute("/studio")({
  component: StudioPage,
});

function StudioPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof loadStudio>> | null>(null);
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ artistName: "", title: "", genre: "Afrobeats", listeningUrl: "", artworkUrl: "", description: "", placementCode: "" });

  useEffect(() => {
    loadStudio().then(setData).catch(() => setMessage("sign-in"));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      const result = await submitRelease({ data: form });
      setMessage(result.configured ? "Sent for review." : "Saved. Paid placements aren't available yet.");
      setOpen(false);
      setData(await loadStudio());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Couldn't send that.");
    }
  }

  const submissions = data?.submissions ?? [];
  const chart = [
    { name: "In review", value: submissions.filter((item) => item.status === "submitted").length },
    { name: "Live", value: submissions.filter((item) => item.status === "approved" || item.status === "live").length },
    { name: "Returned", value: submissions.filter((item) => item.status === "rejected").length },
  ];

  return (
    <AppFrame>
      <Board kicker="Artist" title={data?.username ? `@${data.username}` : "Studio"}>
        <div className="hero-stats">
          <Stat label="Submissions" value={String(submissions.length)} />
          <Stat label="Placements" value={String(data?.products.length ?? 0)} hint="Available" />
          <Stat label="In review" value={String(chart[0].value)} />
        </div>
        <RealChart data={chart} empty="Send a release and the review chart fills in." />
        <Actions items={[
          { href: "#submit", label: "New release", detail: "Send music" },
          { href: data?.username ? `/@${data.username}` : "/profile", label: "Public page", detail: "How fans see you" },
          { href: "/community", label: "Push", detail: "Communities" },
        ]} />
        <h2>Recent</h2>
        {message === "sign-in" ? (
          <div className="empty"><h2>Sign in</h2><p>Your releases show up here.</p><Link className="btn" to="/login">Log in</Link></div>
        ) : submissions.length === 0 ? (
          <div className="empty"><h2>No releases yet</h2><p>Your submissions show up here.</p></div>
        ) : submissions.map((item) => (
          <article key={item.id} className="activity-row">
            <span className="avatar-dot">{item.title.slice(0, 1)}</span>
            <span><strong>{item.title}</strong><em>{item.status}{item.amountKobo ? ` · ${naira(item.amountKobo)}` : ""}</em></span>
          </article>
        ))}
        <form id="submit" className="panel" onSubmit={(event) => void onSubmit(event)}>
          <button type="button" className="btn ghost" onClick={() => setOpen((value) => !value)}>{open ? "Close" : "Submit music"}</button>
          {open ? (
            <>
              <label className="field">Artist<input value={form.artistName} onChange={(event) => setForm({ ...form, artistName: event.target.value })} required /></label>
              <label className="field">Title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></label>
              <label className="field">Genre<input value={form.genre} onChange={(event) => setForm({ ...form, genre: event.target.value })} /></label>
              <label className="field">Listening link<input value={form.listeningUrl} onChange={(event) => setForm({ ...form, listeningUrl: event.target.value })} required /></label>
              <label className="field">Artwork link<input value={form.artworkUrl} onChange={(event) => setForm({ ...form, artworkUrl: event.target.value })} placeholder="https://" /></label>
              <label className="field">About<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
              <label className="field">Placement
                <select value={form.placementCode} onChange={(event) => setForm({ ...form, placementCode: event.target.value })}>
                  <option value="">None</option>
                  {data?.products.map((item) => <option key={item.code} value={item.code}>{item.name} · {naira(item.priceKobo)}</option>)}
                </select>
              </label>
              <button className="btn" type="submit">Send</button>
            </>
          ) : null}
          {message && message !== "sign-in" ? <p className="note">{message}</p> : null}
        </form>
      </Board>
    </AppFrame>
  );
}
