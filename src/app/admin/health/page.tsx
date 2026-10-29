import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminHealthPage() {
 const session = await auth.api.getSession({ headers: await headers() });
 if (!session?.user) redirect("/login?next=/admin/health");
 const email = (session.user.email ?? "").toLowerCase();
 const admins = new Set((process.env.VIBEZ_ADMIN_EMAILS ?? "").split(",").map((x) => x.trim().toLowerCase()).filter(Boolean));
 if (!admins.has(email)) return <main className="admin-denied"><section><h1>Admin access only.</h1><p>This account is not on the Super Admin allowlist.</p><a href="/">Back to Vibez</a></section></main>;
 return <main className="admin-shell"><section className="admin-main"><header className="admin-topbar"><div><span className="admin-kicker">VIBEZ / CONTROL ROOM</span><h1>System health</h1><p>Production diagnostics and authentication schema.</p></div><a href="/admin">← Super Admin</a></header><section className="admin-panel"><h2>Live health endpoint</h2><p>Open the diagnostic response to verify database connectivity and required authentication tables.</p><a href="/api/health" target="_blank" rel="noreferrer">Open /api/health ↗</a></section></section></main>;
}
