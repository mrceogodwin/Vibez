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
  const [section, setSection] = useState("Overview");

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
      <div className="tabs" aria-label="Control Room sections">
        {["Overview", "Users", "Staff", "Music", "Events", "Advertising", "Community", "Finance", "Content"].map((item) => (
          <button key={item} type="button" className={section === item ? "is-on" : undefined} onClick={() => setSection(item)}>{item}</button>
        ))}
      </div>
      {data.previewAdmin ? <p className="note">Local preview admin, because sign-in is off and there is no production database. This access is not used when the app is deployed with auth on.</p> : null}
      {section === "Overview" || section === "Finance" ? (
        <>
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
          <p className="note">{m.sampleArtists} sample artist profiles can be hidden. Published events exclude samples: {m.publishedEvents}. Communities excluding samples: {m.communities}.</p>
        </>
      ) : null}
      {message ? <p className="warn">{message}</p> : null}
      {section === "Events" || section === "Overview" ? <Queue title="Events waiting" rows={data.pendingEvents} idKey="slug" labelKey="title" approve="approve-event" reject="reject-event" onAct={act} /> : null}
      {section === "Music" ? <Queue title="Music submissions" rows={data.pendingMusic} idKey="id" labelKey="title" approve="approve-music" reject="reject-music" onAct={act} /> : null}
      {section === "Advertising" ? <Queue title="Ad campaigns" rows={data.pendingAds} idKey="id" labelKey="name" approve="approve-ad" reject="reject-ad" onAct={act} /> : null}
      {section === "Community" ? <Queue title="Communities" rows={data.pendingCommunities} idKey="id" labelKey="name" approve="approve-community" reject="reject-ad" onAct={act} /> : null}
      {section === "Community" ? <section>
        <h2>Delivery evidence</h2>
        {data.evidence.map((row) => (
          <article key={row.id} className="panel">
            <strong>{row.campaign}</strong>
            <p>{row.note}</p>
            <button type="button" className="btn small" onClick={() => void act("verify-delivery", row.id)}>Mark verified</button>
          </article>
        ))}
      </section> : null}
      {section === "Users" ? <section>
        <h2>People</h2>
        {data.people.map((person) => (
          <article key={person.userId} className="panel">
            <strong>{person.displayName || person.email || person.userId}</strong>
            <p>{person.status}</p>
            <button type="button" className="btn small" onClick={() => void act("approve-organiser", person.userId)}>Approve organiser</button>
            <button type="button" className="btn ghost small" onClick={() => void act(person.status === "suspended" ? "restore-user" : "suspend-user", person.userId)}>{person.status === "suspended" ? "Restore" : "Suspend"}</button>
          </article>
        ))}
      </section> : null}
      {section === "Staff" ? <section>
        <h2>Staff</h2>
        {data.staff.length === 0 ? <p className="note">No staff records yet. Emails in VIBEZ_ADMIN_EMAILS become super admins when they sign in.</p> : data.staff.map((person) => (
          <article key={person.userId} className="panel"><strong>{person.role}</strong><p>{person.userId}</p></article>
        ))}
      </section> : null}
      {section === "Overview" || section === "Content" ? <section>
        <h2>Audit log</h2>
        {data.audit.length === 0 ? <p className="note">Sensitive actions are written here. Nothing has been logged yet.</p> : data.audit.map((entry) => (
          <article key={`${entry.action}-${entry.createdAt}`} className="panel"><strong>{entry.action}</strong><p>{entry.target} · {entry.detail}</p></article>
        ))}
      </section> : null}
      {section === "Finance" || section === "Content" ? <form className="panel" onSubmit={(event) => { event.preventDefault(); void act("set-fee-bps", "ticket_fee_bps", fee); }}>
        <h2>Ticket fee</h2>
        <label className="field">Basis points (500 = 5%)<input value={fee} onChange={(event) => setFee(event.target.value)} /></label>
        <button className="btn" type="submit">Save fee</button>
      </form> : null}
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
