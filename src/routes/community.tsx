import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { AppFrame } from "@/components/vibez/frame";
import { naira } from "@/lib/catalogue";
import { answerInvite, loadCommunities, loadMyCommunity, sendEvidence, submitCommunity, submitPush } from "@/lib/platform.functions";

export const Route = createFileRoute("/community")({
  component: CommunityPage,
});

function CommunityPage() {
  const [board, setBoard] = useState<Awaited<ReturnType<typeof loadCommunities>>>([]);
  const [mine, setMine] = useState<Awaited<ReturnType<typeof loadMyCommunity>> | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [title, setTitle] = useState("");
  const [listeningUrl, setListeningUrl] = useState("");
  const [note, setNote] = useState("");
  const [apply, setApply] = useState({ name: "", description: "", category: "Afrobeats", city: "Lagos", platform: "WhatsApp", audience: "", priceNaira: 0 });

  function refresh() {
    loadCommunities().then(setBoard).catch(() => undefined);
    loadMyCommunity().then(setMine).catch(() => setMine(null));
  }
  useEffect(() => { refresh(); }, []);

  async function push(event: FormEvent) {
    event.preventDefault();
    try {
      const result = await submitPush({ data: { title, listeningUrl, note, communityIds: picked } });
      setMessage(result.configured ? `${result.payouts} Amount recorded: ${naira(result.amountKobo)}.` : result.message);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create the campaign.");
    }
  }

  return (
    <AppFrame>
      <h1>Community push</h1>
      <p className="note">Communities are opted in. Vibez does not store member phone numbers and does not promise streams. Payouts to owners are not enabled.</p>
      <section>
        {board.map((item) => (
          <label key={item.id} className="panel" style={{ display: "block" }}>
            <input type="checkbox" checked={picked.includes(item.id)} onChange={() => setPicked((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id])} />
            <strong> {item.name}</strong> {item.sample ? <em className="pill sample">Sample</em> : null}
            <p>{item.platform} · {item.city} · {naira(item.priceKobo)}</p>
            <p>{item.description}</p>
            <p>{item.audience} {item.estimatedReach == null ? "Reach is not measured by Vibez." : `Owner estimate ${item.estimatedReach}. Not measured by Vibez.`}</p>
          </label>
        ))}
      </section>
      <form className="panel" onSubmit={(event) => void push(event)}>
        <h2>Campaign</h2>
        <label className="field">Title<input value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
        <label className="field">Listening link<input value={listeningUrl} onChange={(event) => setListeningUrl(event.target.value)} required /></label>
        <label className="field">Note<textarea value={note} onChange={(event) => setNote(event.target.value)} /></label>
        {message ? <p className="warn">{message}</p> : null}
        <button className="btn" type="submit">Submit campaign</button>
      </form>
      <form className="panel" onSubmit={(event) => {
        event.preventDefault();
        submitCommunity({ data: apply }).then(() => setMessage("Community application sent.")).catch((error) => setMessage(error instanceof Error ? error.message : "Could not apply."));
      }}>
        <h2>Register a community</h2>
        <label className="field">Name<input value={apply.name} onChange={(event) => setApply({ ...apply, name: event.target.value })} required /></label>
        <label className="field">Description<textarea value={apply.description} onChange={(event) => setApply({ ...apply, description: event.target.value })} /></label>
        <label className="field">City<input value={apply.city} onChange={(event) => setApply({ ...apply, city: event.target.value })} /></label>
        <label className="field">Platform
          <select value={apply.platform} onChange={(event) => setApply({ ...apply, platform: event.target.value })}>
            <option>WhatsApp</option><option>Telegram</option><option>Other</option>
          </select>
        </label>
        <label className="field">Audience<input value={apply.audience} onChange={(event) => setApply({ ...apply, audience: event.target.value })} /></label>
        <label className="field">Price in naira<input type="number" value={apply.priceNaira} onChange={(event) => setApply({ ...apply, priceNaira: Number(event.target.value) })} /></label>
        <button className="btn ghost" type="submit">Apply</button>
      </form>
      {mine?.incoming?.length ? (
        <section>
          <h2>Invitations</h2>
          {mine.incoming.map((row) => (
            <article key={row.id} className="panel">
              <strong>{row.campaign}</strong>
              <p>{row.community} · {row.status}</p>
              <button type="button" className="btn small" onClick={() => void answerInvite({ data: { id: row.id, accept: true } }).then(refresh)}>Accept</button>
              <button type="button" className="btn ghost small" onClick={() => void answerInvite({ data: { id: row.id, accept: false } }).then(refresh)}>Decline</button>
              <button type="button" className="btn ghost small" onClick={() => {
                const text = window.prompt("What did you share?") ?? "";
                if (text) void sendEvidence({ data: { id: row.id, note: text, url: "" } }).then(refresh);
              }}>Send evidence</button>
            </article>
          ))}
        </section>
      ) : null}
    </AppFrame>
  );
}
