import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, ChevronRight, LogOut, Megaphone, Settings, Shield, Ticket, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { AppFrame } from "@/components/vibez/frame";
import { signOut } from "@/lib/auth/client";
import { askDeletion, loadSession, saveProfile } from "@/lib/platform.functions";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const [bundle, setBundle] = useState<Awaited<ReturnType<typeof loadSession>> | null>(null);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ displayName: "", username: "", bio: "", city: "", state: "", country: "Nigeria", avatarUrl: "" });

  useEffect(() => {
    loadSession()
      .then((value) => {
        setBundle(value);
        setForm({
          displayName: value.profile.displayName,
          username: value.profile.username ?? "",
          bio: value.profile.bio,
          city: value.profile.city,
          state: value.profile.state,
          country: value.profile.country,
          avatarUrl: value.profile.avatarUrl ?? "",
        });
      })
      .catch(() => setBundle(null));
  }, []);

  async function save() {
    setMessage("");
    try {
      const profile = await saveProfile({ data: form });
      setBundle((current) => current ? { ...current, profile } : current);
      setEditing(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save.");
    }
  }

  if (!bundle) {
    return (
      <AppFrame>
        <div className="empty">
          <div className="mark"><UserRound /></div>
          <h2>Your Vibez profile</h2>
          <p>Sign in to see follows, saved music and tickets from your account.</p>
          <Link className="btn" to="/login">Log in</Link>
        </div>
      </AppFrame>
    );
  }

  const { profile, stats } = bundle;
  const initial = (profile.displayName || "V").charAt(0).toUpperCase();

  return (
    <AppFrame>
      <header className="profile-head">
        <div className="avatar">{profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : initial}</div>
        <h1>{profile.displayName || "Your name"}</h1>
        <p>{profile.username ? `@${profile.username}` : "Add a username"}</p>
        <p>{profile.city ? `${profile.city}${profile.state ? `, ${profile.state}` : ""}` : profile.country}</p>
        {profile.status === "suspended" ? <p className="warn">This account is suspended.</p> : null}
      </header>
      <div className="stats">
        <Link to="/artists"><strong>{stats.following}</strong><span>Following</span></Link>
        <Link to="/music"><strong>{stats.saved}</strong><span>Saved</span></Link>
        <Link to="/tickets"><strong>{stats.tickets}</strong><span>Tickets</span></Link>
      </div>
      {editing ? (
        <section className="panel">
          <h2>Edit profile</h2>
          <label className="field">Name<input value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} /></label>
          <label className="field">Username<input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} placeholder="mudino" /></label>
          <label className="field">Bio<textarea value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} /></label>
          <label className="field">City<input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></label>
          <label className="field">State<input value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value })} /></label>
          <label className="field">Photo URL<input value={form.avatarUrl} onChange={(event) => setForm({ ...form, avatarUrl: event.target.value })} placeholder="https://" /></label>
          {!bundle.integrations.storage ? <p className="note">Object storage is not configured. Paste an image URL. Set BLOB_READ_WRITE_TOKEN to enable uploads.</p> : null}
          {message ? <p className="warn">{message}</p> : null}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button type="button" className="btn" onClick={() => void save()}>Save</button>
            <button type="button" className="btn ghost" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </section>
      ) : null}
      <section className="group">
        <h3>Account</h3>
        <button type="button" className="rowlink" onClick={() => setEditing(true)}>
          <span className="ico"><UserRound size={16} /></span>
          <span>Edit profile<small>{profile.roles.join(", ")}</small></span>
          <ChevronRight className="chev" size={16} />
        </button>
        <Link to="/personalise" className="rowlink">
          <span className="ico"><Settings size={16} /></span>
          <span>Preferences<small>Genres, city and roles</small></span>
          <ChevronRight className="chev" size={16} />
        </Link>
        <Link to="/tickets" className="rowlink">
          <span className="ico"><Ticket size={16} /></span>
          <span>Purchased tickets<small>{stats.tickets} issued</small></span>
          <ChevronRight className="chev" size={16} />
        </Link>
        <Link to="/settings" className="rowlink">
          <span className="ico"><Bell size={16} /></span>
          <span>Notifications</span>
          <ChevronRight className="chev" size={16} />
        </Link>
      </section>
      <div className="workspace" aria-label="Workspaces">
        <Link to="/home" className="is-on"><strong>Fan</strong><span>Discover</span></Link>
        {profile.roles.includes("artist") ? <Link to="/studio"><strong>Artist</strong><span>Studio</span></Link> : null}
        {profile.roles.includes("organiser") ? <Link to="/organise"><strong>Organiser</strong><span>{bundle.organiser?.status ?? "Apply"}</span></Link> : null}
        {profile.roles.includes("advertiser") ? <Link to="/ads"><strong>Advertiser</strong><span>Campaigns</span></Link> : null}
        {profile.roles.includes("community") ? <Link to="/community"><strong>Community</strong><span>Push</span></Link> : null}
      </div>
      <section className="group">
        <h3>Workspaces</h3>
        {profile.roles.includes("artist") ? <Link to="/studio" className="rowlink"><span className="ico"><Megaphone size={16} /></span><span>Artist studio</span><ChevronRight className="chev" size={16} /></Link> : null}
        {profile.roles.includes("organiser") ? <Link to="/organise" className="rowlink"><span className="ico"><Ticket size={16} /></span><span>Organiser<small>{bundle.organiser?.status ?? "Not applied"}</small></span><ChevronRight className="chev" size={16} /></Link> : null}
        {profile.roles.includes("advertiser") ? <Link to="/ads" className="rowlink"><span className="ico"><Megaphone size={16} /></span><span>Advertising</span><ChevronRight className="chev" size={16} /></Link> : null}
        {profile.roles.includes("community") ? <Link to="/community" className="rowlink"><span className="ico"><UserRound size={16} /></span><span>Community</span><ChevronRight className="chev" size={16} /></Link> : null}
        {bundle.staffRole ? <Link to="/control" className="rowlink"><span className="ico"><Shield size={16} /></span><span>Control Room</span><ChevronRight className="chev" size={16} /></Link> : null}
      </section>
      <section className="group">
        <h3>Legal</h3>
        <Link to="/legal/$doc" params={{ doc: "terms" }} className="rowlink"><span className="ico"><Shield size={16} /></span><span>Terms</span><ChevronRight className="chev" size={16} /></Link>
        <Link to="/legal/$doc" params={{ doc: "privacy" }} className="rowlink"><span className="ico"><Shield size={16} /></span><span>Privacy</span><ChevronRight className="chev" size={16} /></Link>
        <Link to="/legal/$doc" params={{ doc: "refunds" }} className="rowlink"><span className="ico"><Shield size={16} /></span><span>Refunds</span><ChevronRight className="chev" size={16} /></Link>
        <button type="button" className="rowlink" onClick={() => void signOut().then(() => window.location.assign("/home"))}>
          <span className="ico"><LogOut size={16} /></span>
          <span>Sign out</span>
          <ChevronRight className="chev" size={16} />
        </button>
        <button
          type="button"
          className="rowlink"
          onClick={() => void askDeletion().then(() => setMessage("Deletion request recorded. An admin has to action it."))}
        >
          <span className="ico"><UserRound size={16} /></span>
          <span>Request account deletion<small>{profile.deletionRequested ? "Requested" : "Recorded for review"}</small></span>
          <ChevronRight className="chev" size={16} />
        </button>
      </section>
      {message && !editing ? <p className="note" style={{ marginTop: 12 }}>{message}</p> : null}
    </AppFrame>
  );
}
