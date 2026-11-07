"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, CalendarDays, KeyRound, MapPin, Plus, RefreshCw, ShieldCheck, Ticket } from "lucide-react";

type Organizer = { id: string; name: string | null; email: string; organizerProfile: { businessName: string } | null };
type TicketItem = { id: string; name: string; priceKobo: number; quantity: number; sold: number; isActive: boolean };
type EventItem = { id: string; title: string; slug: string; category: string; city: string; venue: string; startsAt: string; status: string; createdAt: string; organizer: { id: string; name: string | null; email: string; organizerProfile: { businessName: string; verificationStatus: string } | null }; ticketTypes: TicketItem[] };
type EventForm = { organizerId: string; title: string; slug: string; summary: string; description: string; category: string; city: string; venue: string; address: string; startsAt: string; endsAt: string; coverImage: string; ticketName: string; ticketPrice: string; ticketQuantity: string };
const emptyForm: EventForm = { organizerId: "", title: "", slug: "", summary: "", description: "", category: "", city: "", venue: "", address: "", startsAt: "", endsAt: "", coverImage: "", ticketName: "General Admission", ticketPrice: "0", ticketQuantity: "100" };
const statuses = ["DRAFT", "PENDING_REVIEW", "PUBLISHED", "REJECTED", "CANCELLED", "COMPLETED", "ARCHIVED"];
const money = (n: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n / 100);
const slugify = (v: string) => v.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export default function EventAdminPage() {
  const [key, setKey] = useState("");
  const [connected, setConnected] = useState(false);
  const [items, setItems] = useState<EventItem[]>([]);
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [form, setForm] = useState<EventForm>(emptyForm);

  useEffect(() => {
    const saved = sessionStorage.getItem("vibez-admin-key");
    if (saved) { setKey(saved); void load(saved); }
  }, []);

  async function load(k = key) {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/admin/events", { headers: { "x-vibez-admin-key": k }, cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load events.");
      setItems(data.events || []); setOrganizers(data.organizers || []);
      setConnected(true); sessionStorage.setItem("vibez-admin-key", k);
    } catch (e) {
      setConnected(false); setError(e instanceof Error ? e.message : "Unable to connect.");
    } finally { setLoading(false); }
  }

  async function createEvent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(""); setNotice("");
    if (!form.organizerId) { setError("Select an approved organiser first."); return; }
    if (!form.startsAt || new Date(form.startsAt) <= new Date()) { setError("Choose a future event start date and time."); return; }
    setCreating(true);
    try {
      const response = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-vibez-admin-key": key },
        body: JSON.stringify({
          organizerId: form.organizerId, title: form.title, slug: form.slug, summary: form.summary,
          description: form.description, category: form.category, city: form.city, venue: form.venue,
          address: form.address, startsAt: new Date(form.startsAt).toISOString(),
          endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null, coverImage: form.coverImage,
          ticketTypes: [{ name: form.ticketName, priceNaira: Number(form.ticketPrice), quantity: Number(form.ticketQuantity) }]
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not create event.");
      setNotice(data.message || "Event created and submitted for review.");
      setForm(emptyForm);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Event creation failed."); }
    finally { setCreating(false); }
  }

  async function update(id: string, status: string) {
    setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/events", { method: "PATCH", headers: { "Content-Type": "application/json", "x-vibez-admin-key": key }, body: JSON.stringify({ id, status }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not update event.");
      setItems(old => old.map(item => item.id === id ? { ...item, ...data.event } : item));
      setNotice("Event status updated.");
    } catch (e) { setError(e instanceof Error ? e.message : "Update failed."); }
  }

  function disconnect() {
    sessionStorage.removeItem("vibez-admin-key"); setKey(""); setConnected(false); setItems([]); setOrganizers([]); setNotice("Admin session ended.");
  }
  const visible = useMemo(() => filter === "ALL" ? items : items.filter(item => item.status === filter), [items, filter]);

  return <main className="ad-admin-page">
    <header className="ad-admin-top">
      <Link href="/" className="ad-admin-brand"><span>VIBEZ</span><small>EVENT OPERATIONS</small></Link>
      <nav className="ad-admin-back" style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <Link href="/admin/events">Events</Link><Link href="/admin/organisers">Organisers</Link><Link href="/admin/advertising">Advertising</Link><Link href="/">Back to site <ArrowLeft size={15}/></Link>
      </nav>
    </header>
    <section className="ad-admin-wrap">
      <div className="ad-admin-heading"><div><span className="ad-admin-kicker">VIBEZ BUSINESS TOOLS</span><h1>Event <em>operations.</em></h1><p>Create events for verified organisers, review submissions and manage publication.</p></div><div className="ad-admin-secure"><ShieldCheck size={17}/> Private admin workspace</div></div>
      {!connected ? <section className="ad-admin-access"><div className="ad-admin-access-icon"><KeyRound size={22}/></div><div><h2>Admin access required</h2><p>Enter the server-configured VIBEZ admin key. The key is kept only for this browser session.</p><form onSubmit={e => { e.preventDefault(); void load(); }}><input type="password" value={key} onChange={e => setKey(e.target.value)} placeholder="Enter admin access key" autoComplete="current-password" required/><button disabled={loading || !key}>{loading ? "Checking…" : "Unlock dashboard"}</button></form>{error && <span className="ad-admin-error">{error}</span>}</div></section> : <>
        <div className="ad-admin-toolbar"><span><BadgeCheck size={16}/> Connected to event records</span><div><button onClick={() => void load()} disabled={loading}><RefreshCw size={14}/> Refresh</button><button className="ad-admin-logout" onClick={disconnect}>Lock dashboard</button></div></div>
        {error && <div className="ad-admin-error">{error}</div>}{notice && <div className="ad-admin-notice">{notice}</div>}
        <div className="ad-admin-stats"><article><span>TOTAL EVENTS</span><strong>{items.length}</strong><small>All event records</small></article><article><span>AWAITING REVIEW</span><strong>{items.filter(x => x.status === "PENDING_REVIEW").length}</strong><small>Need approval</small></article><article><span>PUBLISHED</span><strong>{items.filter(x => x.status === "PUBLISHED").length}</strong><small>Public listings</small></article><article><span>APPROVED ORGANISERS</span><strong>{organizers.length}</strong><small>Eligible to host events</small></article></div>

        <section className="ad-admin-campaigns">
          <div className="ad-admin-section-title"><div><span className="ad-admin-kicker">EVENT SETUP</span><h2>Create an event</h2></div><span>{organizers.length} approved organiser{organizers.length === 1 ? "" : "s"}</span></div>
          {organizers.length === 0 ? <div className="ad-admin-empty"><ShieldCheck size={24}/><strong>No approved organiser accounts yet.</strong><span>Review organiser applications and complete account verification before creating events.</span><Link href="/admin/organisers">Open organiser review</Link></div> : <form onSubmit={createEvent} className="ad-admin-access ad-admin-create">
            <label>Approved organiser<select required value={form.organizerId} onChange={e => setForm({ ...form, organizerId: e.target.value })}><option value="">Choose organiser</option>{organizers.map(o => <option key={o.id} value={o.id}>{o.organizerProfile?.businessName || o.name || o.email} — {o.email}</option>)}</select></label>
            <div className="ad-admin-form-grid">
              <label>Event title<input required maxLength={140} value={form.title} onChange={e => setForm({ ...form, title: e.target.value, slug: form.slug || slugify(e.target.value) })} placeholder="e.g. Lagos Soundscape"/></label>
              <label>URL slug<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.slug} onChange={e => setForm({ ...form, slug: slugify(e.target.value) })} placeholder="lagos-soundscape"/></label>
              <label>Category<input required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Music, Festival, Comedy…"/></label>
              <label>City<input required value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Lagos"/></label>
              <label>Venue<input required value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })} placeholder="Venue name"/></label>
              <label>Address<input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Street address (optional)"/></label>
              <label>Starts at<input required type="datetime-local" value={form.startsAt} onChange={e => setForm({ ...form, startsAt: e.target.value })}/></label>
              <label>Ends at (optional)<input type="datetime-local" value={form.endsAt} onChange={e => setForm({ ...form, endsAt: e.target.value })}/></label>
              <label>Cover image URL<input type="url" value={form.coverImage} onChange={e => setForm({ ...form, coverImage: e.target.value })} placeholder="https://…"/></label>
              <label>Short summary<input maxLength={280} value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} placeholder="A short event description"/></label>
            </div>
            <label>Full description<textarea required rows={4} maxLength={10000} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the event, programme and attendee experience."/></label>
            <div className="ad-admin-section-title"><div><span className="ad-admin-kicker">FIRST TICKET TYPE</span><h2>Ticket inventory</h2></div></div>
            <div className="ad-admin-form-grid">
              <label>Ticket name<input required value={form.ticketName} onChange={e => setForm({ ...form, ticketName: e.target.value })}/></label>
              <label>Price (NGN)<input required type="number" min="0" max="21474836" step="1" value={form.ticketPrice} onChange={e => setForm({ ...form, ticketPrice: e.target.value })}/></label>
              <label>Quantity<input required type="number" min="1" max="1000000" step="1" value={form.ticketQuantity} onChange={e => setForm({ ...form, ticketQuantity: e.target.value })}/></label>
            </div>
            <p className="ad-admin-preview-body">New events are created as PENDING REVIEW. This form does not publish the event or open ticket sales.</p>
            <button type="submit" disabled={creating}>{creating ? "Creating event…" : <><Plus size={15}/> Create event for review</>}</button>
          </form>}
        </section>

        <section className="ad-admin-campaigns">
          <div className="ad-admin-section-title"><div><span className="ad-admin-kicker">EVENT PIPELINE</span><h2>Event submissions</h2></div><select value={filter} onChange={e => setFilter(e.target.value)}><option value="ALL">All statuses</option>{statuses.map(s => <option key={s}>{s}</option>)}</select></div>
          {loading ? <div className="ad-admin-empty">Loading event records…</div> : visible.length === 0 ? <div className="ad-admin-empty"><CalendarDays size={25}/><strong>No events in this view.</strong><span>New event records will appear here after an event is created.</span></div> : <div className="ad-admin-list">{visible.map(ev => <article className="ad-admin-campaign" key={ev.id}><div className="ad-admin-campaign-head"><div><span className={"ad-admin-status status-" + ev.status.toLowerCase()}>{ev.status.replaceAll("_", " ")}</span><h3>{ev.title}</h3><p>{ev.organizer.organizerProfile?.businessName || ev.organizer.email} · {ev.category}</p></div><select aria-label={"Update event status for " + ev.title} value={ev.status} onChange={e => void update(ev.id, e.target.value)}>{statuses.map(s => <option key={s}>{s}</option>)}</select></div><div className="ad-admin-campaign-meta"><span><MapPin size={14}/>{ev.city} · {ev.venue}</span><span><CalendarDays size={14}/>{new Date(ev.startsAt).toLocaleString("en-NG")}</span><span><Ticket size={14}/>{ev.ticketTypes.length} ticket types</span></div><div className="ad-admin-preview-body">{ev.ticketTypes.map(t => <span key={t.id}>{t.name}: {money(t.priceKobo)} · {t.sold}/{t.quantity} sold{t.isActive ? "" : " · inactive"}<br/></span>)}</div></article>)}</div>}
        </section>
      </>}
      <footer className="ad-admin-footer">VIBEZ · EVENT OPERATIONS <span>Publishing requires an approved organiser, a future event date and valid active ticket inventory.</span></footer>
    </section>
  </main>;
}
