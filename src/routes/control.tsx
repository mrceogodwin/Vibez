import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppFrame } from "@/components/vibez/frame";
import { naira } from "@/lib/catalogue";
import { loadControl, runControl } from "@/lib/platform.functions";

export const Route = createFileRoute("/control")({
  component: ControlPage,
});

function ControlPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof loadControl>> | null>(null);
  const [message, setMessage] = useState("");
  const [fee, setFee] = useState("500");

  function refresh() {
    loadControl().then(setData).catch((error) => setMessage(error instanceof Error ? error.message : "Sign in required."));
  }
  useEffect(() => { refresh(); }, []);

  async function act(action: string, target: string, note = "") {
    setMessage("");
    try {
      await runControl({ data: { action, target, note } });
      refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action failed.");
    }
  }

  if (!data) return <AppFrame><p className="note">{message || "Loading Control Room…"}</p></AppFrame>;
  if (!data.allowed) {
    return (
      <AppFrame>
        <div className="empty">
          <h2>Control Room is locked</h2>
          <p>Set VIBEZ_ADMIN_EMAILS to a comma-separated list of admin emails. This account is not on that list.</p>
        </div>
      </AppFrame>
    );
  }

  const m = data.metrics;
  return (
    <AppFrame>
      <h1>Control Room</h1>
      {data.previewAdmin ? <p className="note">Local preview admin, because sign-in is off and there is no production database. This access is not used when the app is deployed with auth on.</p> : null}
      <div className="stats">
        <div><strong>{m.users}</strong><span>Accounts</span></div>
        <div><strong>{m.artists}</strong><span>Artists</span></div>
        <div><strong>{m.ticketsIssued}</strong><span>Tickets issued</span></div>
      </div>
      <div className="stats">
        <div><strong>{m.organisers}</strong><span>Organisers</span></div>
        <div><strong>{m.advertisers}</strong><span>Advertisers</span></div>
        <div><strong>{naira(m.paymentKobo)}</strong><span>Confirmed payments</span></div>
      </div>
      <p className="note">{m.sampleArtists} sample artist profiles are in the catalogue and can be hidden. Published events exclude samples: {m.publishedEvents}. Communities excluding samples: {m.communities}.</p>
      {message ? <p className="warn">{message}</p> : null}
      <Queue title="Events waiting" rows={data.pendingEvents} idKey="slug" labelKey="title" approve="approve-event" reject="reject-event" onAct={act} />
      <Queue title="Music submissions" rows={data.pendingMusic} idKey="id" labelKey="title" approve="approve-music" reject="reject-music" onAct={act} />
      <Queue title="Ad campaigns" rows={data.pendingAds} idKey="id" labelKey="name" approve="approve-ad" reject="reject-ad" onAct={act} />
      <Queue title="Communities" rows={data.pendingCommunities} idKey="id" labelKey="name" approve="approve-community" reject="reject-ad" onAct={act} />
      <section>
        <h2>Delivery evidence</h2>
        {data.evidence.map((row) => (
          <article key={row.id} className="panel">
            <strong>{row.campaign}</strong>
            <p>{row.note}</p>
            <button type="button" className="btn small" onClick={() => void act("verify-delivery", row.id)}>Mark verified</button>
          </article>
        ))}
      </section>
      <section>
        <h2>People</h2>
        {data.people.map((person) => (
          <article key={person.userId} className="panel">
            <strong>{person.displayName || person.email || person.userId}</strong>
            <p>{person.status}</p>
            <button type="button" className="btn small" onClick={() => void act("approve-organiser", person.userId)}>Approve organiser</button>
            <button type="button" className="btn ghost small" onClick={() => void act(person.status === "suspended" ? "restore-user" : "suspend-user", person.userId)}>{person.status === "suspended" ? "Restore" : "Suspend"}</button>
          </article>
        ))}
      </section>
      <form className="panel" onSubmit={(event) => { event.preventDefault(); void act("set-fee-bps", "ticket_fee_bps", fee); }}>
        <h2>Ticket fee</h2>
        <label className="field">Basis points (500 = 5%)<input value={fee} onChange={(event) => setFee(event.target.value)} /></label>
        <button className="btn" type="submit">Save fee</button>
      </form>
    </AppFrame>
  );
}

function Queue<T extends Record<string, string>>({ title, rows, idKey, labelKey, approve, reject, onAct }: {
  title: string;
  rows: T[];
  idKey: keyof T;
  labelKey: keyof T;
  approve: string;
  reject: string;
  onAct: (action: string, target: string) => void;
}) {
  if (!rows.length) return null;
  return (
    <section>
      <h2>{title}</h2>
      {rows.map((row) => (
        <article key={String(row[idKey])} className="panel">
          <strong>{String(row[labelKey])}</strong>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button type="button" className="btn small" onClick={() => onAct(approve, String(row[idKey]))}>Approve</button>
            <button type="button" className="btn ghost small" onClick={() => onAct(reject, String(row[idKey]))}>Reject</button>
          </div>
        </article>
      ))}
    </section>
  );
}
