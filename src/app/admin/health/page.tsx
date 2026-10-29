import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminHealthPage() {
 const session = await auth.api.getSession({ headers: await headers() });
 if (!session?.user) redirect("/login?next=/admin/health");
 const email = (session.user.email ?? "").toLowerCase();
 const admins = new Set((process.env.VIBEZ_ADMIN_EMAILS ?? "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean));
 if (!admins.has(email)) return <main className="admin-denied"><section><h1>Admin access only.</h1><p>This account is not on the Super Admin allowlist.</p><Link href="/">Back to Vibez</Link></section></main>;

 const envChecks: Array<[string, boolean]> = [
  ["Vibez database URL", Boolean(process.env.VIBEZ_DATABASE_URL || process.env.DATABASE_URL)],
  ["Better Auth secret", Boolean(process.env.BETTER_AUTH_SECRET)],
  ["Better Auth base URL", Boolean(process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL)],
  ["Super Admin allowlist", admins.size > 0],
 ];
 let database = "Unavailable";
 let dbError = "";
 let schema: Array<[string, boolean]> = [];
 try {
  const sql = getDb();
  const rows = await sql`SELECT current_database() AS database,
   to_regclass('public."user"') IS NOT NULL AS users,
   to_regclass('public.session') IS NOT NULL AS sessions,
   to_regclass('public.account') IS NOT NULL AS accounts,
   to_regclass('public.verification') IS NOT NULL AS verifications,
   to_regclass('public.creator_station_profiles') IS NOT NULL AS stations,
   to_regclass('public.admin_audit_log') IS NOT NULL AS audit`;
  const row = rows[0] as Record<string, unknown>;
  database = String(row.database ?? "Unknown");
  schema = [
   ["Better Auth user table", row.users === true],
   ["Better Auth session table", row.sessions === true],
   ["Better Auth account table", row.accounts === true],
   ["Better Auth verification table", row.verifications === true],
   ["Creator station profiles", row.stations === true],
   ["Admin audit log", row.audit === true],
  ];
 } catch {
  dbError = "Database query failed. Verify the production connection and migrations.";
  schema = [["Database connection", false]];
 }
 const checks = [...envChecks, ...schema];
 const passed = checks.filter((x) => x[1]).length;
 return <main className="admin-shell"><section className="admin-main">
  <header className="admin-topbar"><div><span className="admin-kicker">VIBEZ / CONTROL ROOM</span><h1>System health</h1><p>Private production diagnostics. Secrets and connection strings are never displayed.</p></div><Link href="/admin">← Super Admin</Link></header>
  <section className="admin-panel admin-health-panel"><div className="admin-panel-heading"><div><span className="admin-kicker">READINESS CHECKS</span><h2>System status</h2></div><span className={"admin-health-badge "+(passed===checks.length?"healthy":"warning")}>{passed===checks.length?"HEALTHY":"ATTENTION"}</span></div>
   <p className="admin-health-database">Database: <b>{database}</b> · {passed} of {checks.length} checks passed</p>
   {dbError&&<p className="admin-health-error" role="alert">{dbError}</p>}
   <div className="admin-health-checks">{checks.map(([label,ok])=><div className="admin-health-check" key={label}><span className={"admin-health-indicator "+(ok?"ok":"bad")}/><span>{label}</span><b>{ok?"Ready":"Needs attention"}</b></div>)}</div>
   <Link className="admin-health-refresh" href="/admin/health">Refresh system checks ↻</Link>
   <p className="admin-empty">For a JSON health response, <Link href="/api/health" target="_blank" rel="noreferrer">open the health endpoint</Link>.</p>
  </section>
 </section></main>;
}
