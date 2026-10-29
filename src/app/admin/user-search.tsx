"use client";

import { useState } from "react";

type UserRow = { id: string; name: string; email: string; createdAt: string };

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}

export function UserSearch() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function search(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (query.trim().length < 2) { setError("Enter at least two characters."); return; }
    setBusy(true); setError(""); setSearched(true);
    try {
      const response = await fetch(`/api/admin/users?q=${encodeURIComponent(query.trim())}`, { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Account search failed.");
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Account search failed.");
      setUsers([]);
    } finally { setBusy(false); }
  }

  return (
    <section className="admin-panel admin-user-search">
      <div className="admin-panel-heading"><div><span className="admin-kicker">ACCOUNT DIRECTORY</span><h2>Find a member</h2></div><span className="admin-count">PRIVATE</span></div>
      <form className="admin-search-form" onSubmit={search}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or email…" maxLength={100} aria-label="Search member name or email" />
        <button type="submit" disabled={busy}>{busy ? "Searching…" : "Search accounts"}</button>
      </form>
      {error && <p className="admin-search-error" role="alert">{error}</p>}
      {searched && !busy && !error && users.length === 0 && <p className="admin-empty">No matching accounts found.</p>}
      {users.length > 0 && <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Member</th><th>Email</th><th>Joined</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td><b>{user.name || "Unnamed member"}</b><small>{user.id.slice(0, 8)}…</small></td><td>{user.email}</td><td>{dateLabel(user.createdAt)}</td></tr>)}</tbody></table></div>}
    </section>
  );
}
