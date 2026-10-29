import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ReportActions } from "./report-actions";
import { UserSearch } from "./user-search";
import { AdminSignOut } from "./sign-out";
import { StationVisibility } from "./station-visibility";

export const dynamic = "force-dynamic";

const adminEmails = new Set(
  (process.env.VIBEZ_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

function formatDate(value: unknown) {
  if (!value) return "—";
  const date = new Date(String(value));
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default async function AdminPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login?next=/admin");
  const email = (session.user.email ?? "").toLowerCase();
  if (!email || !adminEmails.has(email)) {
    return (
      <main className="admin-denied">
        <a className="admin-brand" href="/">v. <span>VIBEZ</span></a>
        <section>
          <span className="admin-kicker">RESTRICTED AREA · 403</span>
          <h1>Admin access only.</h1>
          <p>This account is not on the Vibez Super Admin allowlist. No admin data has been shown.</p>
          <a className="admin-button" href="/">Back to Vibez</a>
        </section>
      </main>
    );
  }

  let stats = { users: 0, stations: 0, posts: 0, openReports: 0, communities: 0, liveSessions: 0 };
  let recentUsers: Array<{ id: string; name: string; email: string; createdAt: string }> = [];
  let stations: Array<{ id: string; name: string; genre: string; visibility: string; updated_at: string; owner_email: string | null }> = [];
  let reports: Array<{ id: string; target_type: string; reason: string; status: string; created_at: string }> = [];
  let auditEvents: Array<{ id: string; actor_email: string; action: string; target_type: string; target_id: string; details: Record<string, unknown>; created_at: string }> = [];
  let dataError = "";

  try {
    const sql = getDb();
    const countRows = await sql`
      SELECT
        (SELECT COUNT(*)::int FROM "user") AS users,
        (SELECT COUNT(*)::int FROM creator_station_profiles) AS stations,
        (SELECT COUNT(*)::int FROM posts) AS posts,
        (SELECT COUNT(*)::int FROM content_reports WHERE status IN ('open', 'reviewing')) AS "openReports",
        (SELECT COUNT(*)::int FROM communities) AS communities,
        (SELECT COUNT(*)::int FROM station_broadcast_sessions WHERE status = 'live') AS "liveSessions"
    `;
    if (countRows[0]) {
      const row = countRows[0] as Record<string, unknown>;
      stats = {
        users: Number(row.users ?? 0),
        stations: Number(row.stations ?? 0),
        posts: Number(row.posts ?? 0),
        openReports: Number(row.openReports ?? 0),
        communities: Number(row.communities ?? 0),
        liveSessions: Number(row.liveSessions ?? 0),
      };
    }
    recentUsers = (await sql`
      SELECT id, name, email, "createdAt"
      FROM "user"
      ORDER BY "createdAt" DESC
      LIMIT 8
    `) as typeof recentUsers;
    stations = (await sql`
      SELECT p.id, p.name, p.genre, p.visibility, p.updated_at, u.email AS owner_email
      FROM creator_station_profiles p
      LEFT JOIN "user" u ON u.id = p.owner_id
      ORDER BY p.updated_at DESC
      LIMIT 8
    `) as typeof stations;
    reports = (await sql`
      SELECT id, target_type, reason, status, created_at
      FROM content_reports
      ORDER BY created_at DESC
      LIMIT 8
    `) as typeof reports;
    auditEvents = (await sql`
      SELECT id, actor_email, action, target_type, target_id, details, created_at
      FROM admin_audit_log
      ORDER BY created_at DESC
      LIMIT 8
    `) as typeof auditEvents;
  } catch {
    dataError = "The dashboard could not read one or more database tables. Check the production database connection and migrations.";
  }

  const cards = [
    { label: "Registered accounts", value: stats.users, icon: "◎", detail: "Better Auth users" },
    { label: "Creator stations", value: stats.stations, icon: "♫", detail: "Saved station profiles" },
    { label: "Community posts", value: stats.posts, icon: "▤", detail: "Social content records" },
    { label: "Open reports", value: stats.openReports, icon: "⚑", detail: "Needs moderation" },
    { label: "Communities", value: stats.communities, icon: "◈", detail: "Community spaces" },
    { label: "Live sessions", value: stats.liveSessions, icon: "●", detail: "Provider sessions marked live" },
  ];

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <a className="admin-brand" href="/">v. <span>VIBEZ</span></a>
        <div className="admin-sidebar-label">SUPER ADMIN</div>
        <a className="admin-nav active" href="/admin">▦ <span>Overview</span></a>
        <a className="admin-nav" href="#users">◎ <span>User accounts</span></a>
        <a className="admin-nav" href="#stations">♫ <span>Stations</span></a>
        <a className="admin-nav" href="#moderation">⚑ <span>Moderation</span></a>
        <div className="admin-sidebar-bottom"><span className="admin-secure-dot" /> Protected admin session <a href="/">← View public site</a><AdminSignOut /></div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div><span className="admin-kicker">VIBEZ / CONTROL ROOM</span><h1>Platform overview</h1><p>Monitor the platform, accounts, stations and moderation queue.</p></div>
          <div className="admin-account"><span className="admin-avatar">{email.slice(0, 1).toUpperCase()}</span><span><b>Super Admin</b><small>{email}</small></span></div>
        </header>

        {dataError && <div className="admin-alert" role="alert">{dataError}</div>}

        <div className="admin-welcome"><div><span className="admin-kicker">SYSTEM CONTROL</span><h2>Everything in one place.</h2><p>Account search is available, and moderation changes are permission-checked and audit-logged.</p></div><span className="admin-orb">v.</span></div>

        <section className="admin-stat-grid" aria-label="Platform metrics">
          {cards.map((card) => <article className="admin-stat" key={card.label}><div><span>{card.label}</span><i>{card.icon}</i></div><strong>{card.value.toLocaleString("en")}</strong><small>{card.detail}</small></article>)}
        </section>

        <UserSearch />

        <div className="admin-content-grid">
          <section className="admin-panel" id="users"><div className="admin-panel-heading"><div><span className="admin-kicker">ACCOUNT ACTIVITY</span><h2>Recent accounts</h2></div><span className="admin-count">{recentUsers.length} SHOWN</span></div>
            {recentUsers.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Member</th><th>Email</th><th>Joined</th></tr></thead><tbody>{recentUsers.map((user) => <tr key={user.id}><td><b>{user.name || "Unnamed member"}</b><small>{user.id.slice(0, 8)}…</small></td><td>{user.email}</td><td>{formatDate(user.createdAt)}</td></tr>)}</tbody></table></div> : <p className="admin-empty">No registered accounts are available to display yet.</p>}
          </section>

          <section className="admin-panel" id="moderation"><div className="admin-panel-heading"><div><span className="admin-kicker">TRUST & SAFETY</span><h2>Latest reports</h2></div><span className="admin-count">{stats.openReports} OPEN</span></div>
            {reports.length ? <div className="admin-report-list">{reports.map((report) => <article className="admin-report" key={report.id}><span className="admin-report-icon">⚑</span><div><b>{report.reason}</b><p>{report.target_type} · {formatDate(report.created_at)}</p></div><ReportActions id={report.id} status={report.status} /></article>)}</div> : <p className="admin-empty">No reports have been submitted.</p>}
          </section>
        </div>

        <section className="admin-panel admin-roadmap" id="stations">
          <div className="admin-panel-heading"><div><span className="admin-kicker">CREATOR OPERATIONS</span><h2>Recent stations</h2></div><span className="admin-count">{stations.length} SHOWN</span></div>
          {stations.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Station</th><th>Creator</th><th>Visibility</th><th>Updated</th></tr></thead><tbody>{stations.map((station) => <tr key={station.id}><td><b>{station.name}</b><small>{station.genre || "Mixed genres"} · {station.id.slice(0, 8)}…</small></td><td>{station.owner_email || "Account unavailable"}</td><td><StationVisibility id={station.id} initialVisibility={station.visibility} /></td><td>{formatDate(station.updated_at)}</td></tr>)}</tbody></table></div> : <p className="admin-empty">No creator stations have been saved yet.</p>}
        </section>

        <section className="admin-panel admin-roadmap" id="audit-log">
          <div className="admin-panel-heading"><div><span className="admin-kicker">SECURITY & ACCOUNTABILITY</span><h2>Admin activity log</h2></div><span className="admin-count">LATEST {auditEvents.length}</span></div>
          {auditEvents.length ? <div className="admin-audit-list">{auditEvents.map((event) => <article className="admin-audit-row" key={event.id}><span className="admin-audit-dot" /><div><b>{event.action.replace(/\./g, " ")}</b><p>{event.actor_email} · {event.target_type} · {event.target_id.slice(0, 8)}…</p></div><time>{formatDate(event.created_at)}</time></article>)}</div> : <p className="admin-empty">Privileged actions will be recorded here as they occur.</p>}
        </section>

        <section className="admin-panel admin-roadmap" id="admin-roadmap"><div className="admin-panel-heading"><div><span className="admin-kicker">ADMIN MODULES</span><h2>Control centre roadmap</h2></div><span className="admin-count">IN PROGRESS</span></div><div className="admin-module-grid"><article><span>01</span><b>Accounts & access</b><p>Account lookup is available. Account suspension and role changes remain disabled until enforcement is implemented.</p></article><article><span>02</span><b>Stations & broadcasts</b><p>Station counts are connected. Stream health depends on a real provider integration.</p></article><article><span>03</span><b>Moderation queue</b><p>Report records are visible. Resolve/dismiss actions are protected and audit-logged.</p></article><article><span>04</span><b>Billing & platform settings</b><p>Payments, plan changes and global settings are not connected yet.</p></article></div></section>
        <footer className="admin-footer"><span>VIBEZ SUPER ADMIN · PRIVATE CONTROL ROOM</span><span>Signed in as {email}</span></footer>
      </section>
    </main>
  );
}
