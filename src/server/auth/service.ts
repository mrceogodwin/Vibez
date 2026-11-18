import { z } from "zod";
import type { Db } from "../db";
import { withTx } from "../db";
import { HttpError, emailOnAllowlist } from "./rbac";
import { hashPassword, randomToken, sha256, verifyPassword } from "./password";

const RESERVED = new Set([
  "admin", "api", "home", "discover", "login", "signup", "wallet", "profile", "chats",
  "settings", "support", "terms", "privacy", "notifications", "games", "music", "podcasts",
  "events", "communities", "control", "vibez", "plus", "auth", "payments", "media",
]);

const credentials = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(10).max(200),
});

const signupSchema = credentials.extend({
  displayName: z.string().trim().min(1).max(40),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,20}$/, "Use 3 to 20 letters, numbers, or underscores."),
});

export type EmailSender = {
  send(message: { to: string; subject: string; text: string }): Promise<{ delivered: boolean; error?: string }>;
};

type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  username: string;
  roles: string[];
  permissions: string[];
  balanceKobo: number;
  plusUntil: string | null;
  followers: number;
  following: number;
  posts: number;
};

function pepper(): string {
  const value = process.env.SESSION_PEPPER;
  if (!value) throw new HttpError(500, "not_configured", "SESSION_PEPPER is not set.");
  return value;
}

function isProduction(): boolean {
  return process.env.VERCEL_ENV === "production";
}

export async function rateLimit(db: Db, bucket: string, limit: number, windowSeconds: number) {
  const windowStart = new Date(Math.floor(Date.now() / (windowSeconds * 1000)) * windowSeconds * 1000);
  const result = await db.query<{ hits: number }>(
    `INSERT INTO vibez.rate_limits (bucket, window_start, hits)
     VALUES ($1, $2, 1)
     ON CONFLICT (bucket, window_start) DO UPDATE SET hits = vibez.rate_limits.hits + 1
     RETURNING hits`,
    [bucket, windowStart.toISOString()],
  );
  if (Number(result.rows[0]?.hits) > limit) {
    throw new HttpError(429, "rate_limited", "Too many attempts. Try again shortly.");
  }
}

async function audit(db: Db, actorId: string | null, action: string, entityId: string, after: unknown) {
  await db.query(
    `INSERT INTO vibez.audit_logs (actor_id, action, entity_type, entity_id, after_state)
     VALUES ($1, $2, 'user', $3, $4::jsonb)`,
    [actorId, action, entityId, JSON.stringify(after)],
  );
}

async function issueToken(db: Db, userId: string, purpose: "email_verify" | "password_reset", hours: number) {
  const token = randomToken();
  await db.query(
    `INSERT INTO vibez.auth_tokens (user_id, purpose, token_hash, expires_at)
     VALUES ($1, $2, $3, now() + (($4 || ' hours')::interval))`,
    [userId, purpose, sha256(token), String(hours)],
  );
  return token;
}

export async function signUp(db: Db, sender: EmailSender, input: unknown, origin: string, ip: string) {
  const data = signupSchema.parse(input);
  if (RESERVED.has(data.username)) throw new HttpError(400, "username", "That username is reserved.");
  await rateLimit(db, `signup:${ip}`, 8, 3600);
  const passwordHash = await hashPassword(data.password, pepper());
  const user = await withTx(async (tx) => {
    const existing = await tx.query("SELECT id FROM vibez.users WHERE email = $1 OR username = $2", [
      data.email,
      data.username,
    ]);
    if ((existing.rowCount ?? 0) > 0) throw new HttpError(409, "exists", "An account with that email or username already exists.");
    const created = await tx.query<{ id: string }>(
      `INSERT INTO vibez.users (email, password_hash, display_name, username)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [data.email, passwordHash, data.displayName, data.username],
    );
    const id = created.rows[0].id;
    await tx.query("INSERT INTO vibez.profiles (user_id) VALUES ($1)", [id]);
    await tx.query("INSERT INTO vibez.user_settings (user_id) VALUES ($1)", [id]);
    await tx.query("INSERT INTO vibez.wallets (user_id) VALUES ($1)", [id]);
    await tx.query("INSERT INTO vibez.user_roles (user_id, role_code) VALUES ($1, 'member')", [id]);
    await audit(tx, id, "user.signed_up", id, { email: data.email });
    const token = await issueToken(tx, id, "email_verify", 24);
    return { id, token };
  });
  const url = `${origin}/verify-email?token=${user.token}`;
  const delivery = await sender.send({
    to: data.email,
    subject: "Verify your Vibez email",
    text: `Confirm your Vibez account by opening this link: ${url}`,
  });
  await db.query(
    `INSERT INTO vibez.outbound_emails (to_address, subject, body, status, error)
     VALUES ($1, $2, $3, $4, $5)`,
    [data.email, "Verify your Vibez email", "verification", delivery.delivered ? "sent" : "undelivered", delivery.error ?? null],
  );
  return {
    ok: true,
    emailDelivered: delivery.delivered,
    message: delivery.delivered
      ? "Check your email to verify your account."
      : "Your account was created, but email delivery is not configured.",
    verificationPath: !delivery.delivered && !isProduction() ? `/verify-email?token=${user.token}` : undefined,
  };
}

export async function verifyEmail(db: Db, token: string) {
  const hash = sha256(token);
  const row = await db.query<{ id: string; user_id: string }>(
    `UPDATE vibez.auth_tokens SET consumed_at = now()
     WHERE token_hash = $1 AND purpose = 'email_verify' AND consumed_at IS NULL AND expires_at > now()
     RETURNING id, user_id`,
    [hash],
  );
  if (!row.rows[0]) throw new HttpError(400, "token", "This verification link is invalid or expired.");
  await db.query("UPDATE vibez.users SET email_verified_at = COALESCE(email_verified_at, now()) WHERE id = $1", [
    row.rows[0].user_id,
  ]);
  await maybeBootstrapAdmin(db, row.rows[0].user_id);
  return { ok: true };
}

async function maybeBootstrapAdmin(db: Db, userId: string) {
  const user = await db.query<{ email: string; email_verified_at: Date | null }>(
    "SELECT email, email_verified_at FROM vibez.users WHERE id = $1",
    [userId],
  );
  const record = user.rows[0];
  if (!record?.email_verified_at || !emailOnAllowlist(record.email, process.env.SUPER_ADMIN_EMAILS)) return;
  const inserted = await db.query(
    `INSERT INTO vibez.user_roles (user_id, role_code) VALUES ($1, 'super_admin')
     ON CONFLICT DO NOTHING RETURNING user_id`,
    [userId],
  );
  if ((inserted.rowCount ?? 0) > 0) {
    await audit(db, null, "super_admin.bootstrapped", userId, { email: record.email });
  }
}

export async function login(db: Db, input: unknown, ip: string, userAgent: string) {
  const data = credentials.parse(input);
  await rateLimit(db, `login:${ip}:${data.email}`, 10, 900);
  const found = await db.query<{ id: string; password_hash: string | null; email_verified_at: Date | null; status: string }>(
    "SELECT id, password_hash, email_verified_at, status FROM vibez.users WHERE email = $1",
    [data.email],
  );
  const user = found.rows[0];
  const dummy = "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
  const ok = user?.password_hash ? await verifyPassword(data.password, user.password_hash, pepper()) : await verifyPassword(data.password, dummy, pepper()).then(() => false);
  if (!user || !ok) throw new HttpError(401, "invalid", "Email or password is incorrect.");
  if (user.status !== "active") throw new HttpError(403, "suspended", "This account is not active.");
  if (!user.email_verified_at) throw new HttpError(403, "unverified", "Verify your email before logging in.");
  await maybeBootstrapAdmin(db, user.id);
  return createSession(db, user.id, ip, userAgent);
}

export async function createSession(db: Db, userId: string, ip: string, userAgent: string) {
  const roles = await db.query<{ role_code: string }>("SELECT role_code FROM vibez.user_roles WHERE user_id = $1", [userId]);
  const isAdmin = roles.rows.some((row) => row.role_code === "super_admin");
  const hours = isAdmin ? 8 : 24 * 30;
  const token = randomToken();
  await db.query(
    `INSERT INTO vibez.sessions (user_id, token_hash, expires_at, ip_address, user_agent)
     VALUES ($1, $2, now() + (($3 || ' hours')::interval), $4, $5)`,
    [userId, sha256(token), String(hours), ip, userAgent.slice(0, 300)],
  );
  return { token, maxAge: hours * 3600 };
}

export async function logout(db: Db, token: string | null) {
  if (!token) return;
  await db.query("UPDATE vibez.sessions SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL", [
    sha256(token),
  ]);
}

export function readToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (header?.toLowerCase().startsWith("bearer ")) return header.slice(7).trim();
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith("vibez_session="));
  return match ? decodeURIComponent(match.slice("vibez_session=".length)) : null;
}

export async function currentUser(db: Db, token: string | null): Promise<SessionUser | null> {
  if (!token) return null;
  const result = await db.query<{
    id: string;
    email: string;
    display_name: string;
    username: string;
    balance: string;
    plus_until: Date | null;
    followers: number;
    following: number;
    posts: number;
  }>(
    `SELECT u.id, u.email, u.display_name, u.username,
            vibez.wallet_balance(u.id) AS balance,
            (SELECT max(period_end) FROM vibez.user_subscriptions s
              WHERE s.user_id = u.id AND s.product_code = 'vibez_plus' AND s.period_end > now()) AS plus_until,
            (SELECT count(*)::int FROM vibez.follows f WHERE f.followee_id = u.id AND f.status = 'active') AS followers,
            (SELECT count(*)::int FROM vibez.follows f WHERE f.follower_id = u.id AND f.status = 'active') AS following,
            (SELECT count(*)::int FROM vibez.posts p WHERE p.author_id = u.id AND p.deleted_at IS NULL) AS posts
     FROM vibez.sessions ses
     JOIN vibez.users u ON u.id = ses.user_id
     WHERE ses.token_hash = $1 AND ses.revoked_at IS NULL AND ses.expires_at > now()
       AND u.status = 'active' AND u.email_verified_at IS NOT NULL`,
    [sha256(token)],
  );
  const user = result.rows[0];
  if (!user) return null;
  const roles = await db.query<{ role_code: string }>("SELECT role_code FROM vibez.user_roles WHERE user_id = $1", [user.id]);
  const permissions = await db.query<{ permission_code: string }>(
    `SELECT DISTINCT rp.permission_code
     FROM vibez.user_roles ur
     JOIN vibez.role_permissions rp ON rp.role_code = ur.role_code
     WHERE ur.user_id = $1`,
    [user.id],
  );
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    username: user.username,
    roles: roles.rows.map((row) => row.role_code),
    permissions: permissions.rows.map((row) => row.permission_code),
    balanceKobo: Number(user.balance),
    plusUntil: user.plus_until ? new Date(user.plus_until).toISOString() : null,
    followers: Number(user.followers),
    following: Number(user.following),
    posts: Number(user.posts),
  };
}

export async function requestPasswordReset(db: Db, sender: EmailSender, email: string, origin: string, ip: string) {
  const parsed = z.string().trim().email().transform((value) => value.toLowerCase()).parse(email);
  await rateLimit(db, `reset:${ip}`, 5, 3600);
  const found = await db.query<{ id: string }>("SELECT id FROM vibez.users WHERE email = $1 AND status = 'active'", [parsed]);
  let path: string | undefined;
  if (found.rows[0]) {
    const token = await issueToken(db, found.rows[0].id, "password_reset", 2);
    const url = `${origin}/reset-password?token=${token}`;
    const delivery = await sender.send({
      to: parsed,
      subject: "Reset your Vibez password",
      text: `Reset your password: ${url}`,
    });
    if (!delivery.delivered && !isProduction()) path = `/reset-password?token=${token}`;
  }
  return {
    ok: true,
    message: "If an account exists for that email, a reset link is on its way.",
    resetPath: path,
  };
}

export async function resetPassword(db: Db, token: string, password: string) {
  const next = z.string().min(10).max(200).parse(password);
  const hash = sha256(token);
  const row = await db.query<{ user_id: string }>(
    `UPDATE vibez.auth_tokens SET consumed_at = now()
     WHERE token_hash = $1 AND purpose = 'password_reset' AND consumed_at IS NULL AND expires_at > now()
     RETURNING user_id`,
    [hash],
  );
  if (!row.rows[0]) throw new HttpError(400, "token", "This reset link is invalid or expired.");
  const passwordHash = await hashPassword(next, pepper());
  await db.query("UPDATE vibez.users SET password_hash = $2, updated_at = now() WHERE id = $1", [
    row.rows[0].user_id,
    passwordHash,
  ]);
  await db.query("UPDATE vibez.sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL", [
    row.rows[0].user_id,
  ]);
  return { ok: true };
}

export function sessionCookie(token: string, maxAge: number, secure: boolean): string {
  const parts = [
    `vibez_session=${encodeURIComponent(token)}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function clearCookie(secure: boolean): string {
  return sessionCookie("", 0, secure).replace("Max-Age=0", "Max-Age=0");
}

export async function upsertOAuthUser(
  db: Db,
  input: { provider: "google" | "apple"; subject: string; email: string | null; emailVerified: boolean; name: string },
  ip: string,
  userAgent: string,
) {
  if (!input.email || !input.emailVerified) {
    throw new HttpError(400, "oauth_email", "That sign-in did not include a verified email address.");
  }
  const email = input.email.toLowerCase();
  const linked = await db.query<{ user_id: string }>(
    "SELECT user_id FROM vibez.oauth_accounts WHERE provider = $1 AND provider_subject = $2",
    [input.provider, input.subject],
  );
  let userId = linked.rows[0]?.user_id;
  if (!userId) {
    const existing = await db.query<{ id: string; email_verified_at: Date | null }>(
      "SELECT id, email_verified_at FROM vibez.users WHERE email = $1",
      [email],
    );
    if (existing.rows[0] && !existing.rows[0].email_verified_at) {
      throw new HttpError(409, "unverified_email", "Verify the password account for this email before linking it.");
    }
    userId = existing.rows[0]?.id;
    if (!userId) {
      const username = await uniqueUsername(db, email.split("@")[0] || "member");
      const created = await db.query<{ id: string }>(
        `INSERT INTO vibez.users (email, display_name, username, email_verified_at)
         VALUES ($1, $2, $3, now()) RETURNING id`,
        [email, input.name.slice(0, 40) || "Vibez member", username],
      );
      userId = created.rows[0].id;
      await db.query("INSERT INTO vibez.profiles (user_id) VALUES ($1)", [userId]);
      await db.query("INSERT INTO vibez.user_settings (user_id) VALUES ($1)", [userId]);
      await db.query("INSERT INTO vibez.wallets (user_id) VALUES ($1)", [userId]);
      await db.query("INSERT INTO vibez.user_roles (user_id, role_code) VALUES ($1, 'member')", [userId]);
    } else {
      await db.query("UPDATE vibez.users SET email_verified_at = COALESCE(email_verified_at, now()) WHERE id = $1", [userId]);
    }
    await db.query(
      `INSERT INTO vibez.oauth_accounts (user_id, provider, provider_subject, email)
       VALUES ($1, $2, $3, $4)`,
      [userId, input.provider, input.subject, email],
    );
  }
  await maybeBootstrapAdmin(db, userId);
  return createSession(db, userId, ip, userAgent);
}

async function uniqueUsername(db: Db, seed: string): Promise<string> {
  const base = seed.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 16) || "member";
  for (let i = 0; i < 5; i += 1) {
    const candidate = `${base}${i === 0 ? "" : i}`.slice(0, 20);
    if (RESERVED.has(candidate) || candidate.length < 3) continue;
    const taken = await db.query("SELECT 1 FROM vibez.users WHERE username = $1", [candidate]);
    if ((taken.rowCount ?? 0) === 0) return candidate;
  }
  return `m${randomToken().slice(0, 12).toLowerCase().replace(/[^a-z0-9]/g, "a")}`.slice(0, 20);
}

export function publicOrigin(request: Request): string {
  const url = new URL(request.url);
  const forwarded = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || url.protocol.replace(":", "");
  const host = forwarded || url.host;
  if (!/^(localhost(:\d+)?|.+\.vercel\.app|vibez\.ng|www\.vibez\.ng)$/.test(host)) return url.origin;
  return `${proto}://${host}`;
}

export function assertSameOrigin(request: Request) {
  if (request.headers.get("authorization")?.toLowerCase().startsWith("bearer ")) return;
  const origin = request.headers.get("origin");
  const expected = publicOrigin(request);
  if (!origin) {
    const site = request.headers.get("sec-fetch-site");
    if (site === "same-origin" || site === "same-site" || site === "none") return;
    throw new HttpError(403, "origin", "This request was rejected.");
  }
  if (origin !== expected && origin !== new URL(request.url).origin) {
    throw new HttpError(403, "origin", "This request was rejected.");
  }
}

export async function requireUser(db: Db, request: Request): Promise<SessionUser> {
  const user = await currentUser(db, readToken(request));
  if (!user) throw new HttpError(401, "unauthorized", "Log in to continue.");
  return user;
}
