import { SignJWT, createRemoteJWKSet, importPKCS8, jwtVerify } from "jose";
import { randomToken, sha256 } from "./password";
import { getPool } from "../db";
import { HttpError } from "./rbac";
import { publicOrigin, sessionCookie, upsertOAuthUser } from "./service";
import { secureRequest } from "../http";

const APPLE_JWKS = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));
const NATIVE_SCHEME = "vibez://auth";

function html(message: string, status = 503) {
  return new Response(
    `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Vibez</title></head><body style="margin:0;background:#0c0c0e;color:#fff;font-family:sans-serif;padding:40px 24px"><p style="font-size:18px;line-height:1.5">${message}</p><p><a href="/get-started" style="color:#ff7a18">Back</a></p></body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

export function googleConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function appleConfigured() {
  return Boolean(
    process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY,
  );
}

export async function beginOAuth(provider: "google" | "apple", request: Request) {
  if (provider === "google" && !googleConfigured()) {
    return html("Google sign-in is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
  }
  if (provider === "apple" && !appleConfigured()) {
    return html("Apple sign-in is not configured yet. Set APPLE_CLIENT_ID, APPLE_TEAM_ID, APPLE_KEY_ID, and APPLE_PRIVATE_KEY.");
  }
  const state = randomToken();
  const native = new URL(request.url).searchParams.get("client") === "native";
  await getPool().query(
    "INSERT INTO vibez.oauth_states (state_hash, provider, redirect_to, expires_at) VALUES ($1, $2, $3, now() + interval '15 minutes')",
    [sha256(state), provider, native ? "native" : null],
  );
  const origin = publicOrigin(request);
  const redirectUri = `${origin}/api/auth/${provider}/callback`;
  if (provider === "google") {
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("state", state);
    url.searchParams.set("prompt", "select_account");
    return Response.redirect(url, 302);
  }
  const url = new URL("https://appleid.apple.com/auth/authorize");
  url.searchParams.set("client_id", process.env.APPLE_CLIENT_ID!);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("response_mode", "query");
  url.searchParams.set("scope", "name email");
  url.searchParams.set("state", state);
  return Response.redirect(url, 302);
}

export async function finishGoogle(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return html("Google did not return a sign-in code.", 400);
  const native = await consumeState("google", state);
  if (native === null) return html("This Google sign-in session expired. Try again.", 400);
  const origin = publicOrigin(request);
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${origin}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });
  const token = (await tokenResponse.json()) as { access_token?: string };
  if (!token.access_token) return html("Google did not confirm that sign-in.", 400);
  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  const profile = (await profileResponse.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
  };
  if (!profile.sub) throw new HttpError(400, "oauth", "Google did not return an account id.");
  const session = await upsertOAuthUser(
    getPool(),
    {
      provider: "google",
      subject: profile.sub,
      email: profile.email ?? null,
      emailVerified: profile.email_verified === true,
      name: profile.name || "Vibez member",
    },
    clientIp(request),
    request.headers.get("user-agent") || "",
  );
  return handoff(request, session, native);
}

export async function buildAppleClientSecret(env: Record<string, string | undefined>): Promise<string> {
  const key = await importPKCS8((env.APPLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"), "ES256");
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: env.APPLE_KEY_ID })
    .setIssuer(env.APPLE_TEAM_ID || "")
    .setSubject(env.APPLE_CLIENT_ID || "")
    .setAudience("https://appleid.apple.com")
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(key);
}

export async function finishApple(request: Request) {
  if (!appleConfigured()) {
    return html("Apple sign-in is not configured yet. Set APPLE_CLIENT_ID, APPLE_TEAM_ID, APPLE_KEY_ID, and APPLE_PRIVATE_KEY.");
  }
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return html("Apple did not return a sign-in code.", 400);
  const native = await consumeState("apple", state);
  if (native === null) return html("This Apple sign-in session expired. Try again.", 400);
  const origin = publicOrigin(request);
  const clientSecret = await buildAppleClientSecret(process.env);
  const tokenResponse = await fetch("https://appleid.apple.com/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.APPLE_CLIENT_ID!,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: `${origin}/api/auth/apple/callback`,
    }),
  });
  const token = (await tokenResponse.json()) as { id_token?: string };
  if (!token.id_token) return html("Apple did not confirm that sign-in.", 400);
  const verified = await jwtVerify(token.id_token, APPLE_JWKS, {
    issuer: "https://appleid.apple.com",
    audience: process.env.APPLE_CLIENT_ID,
  });
  const subject = typeof verified.payload.sub === "string" ? verified.payload.sub : "";
  const email = typeof verified.payload.email === "string" ? verified.payload.email : null;
  if (!subject) throw new HttpError(400, "oauth", "Apple did not return an account id.");
  const session = await upsertOAuthUser(
    getPool(),
    {
      provider: "apple",
      subject,
      email,
      emailVerified: verified.payload.email_verified === true || verified.payload.email_verified === "true",
      name: email?.split("@")[0] || "Vibez member",
    },
    clientIp(request),
    request.headers.get("user-agent") || "",
  );
  return handoff(request, session, native);
}

async function consumeState(provider: "google" | "apple", state: string): Promise<boolean | null> {
  const consumed = await getPool().query<{ redirect_to: string | null }>(
    `UPDATE vibez.oauth_states SET consumed_at = now()
     WHERE state_hash = $1 AND provider = $2 AND consumed_at IS NULL AND expires_at > now()
     RETURNING redirect_to`,
    [sha256(state), provider],
  );
  if (!consumed.rows[0]) return null;
  return consumed.rows[0].redirect_to === "native";
}

function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "0.0.0.0";
}

export function handoff(request: Request, session: { token: string; maxAge: number }, native: boolean) {
  if (native) {
    return Response.redirect(`${NATIVE_SCHEME}?token=${encodeURIComponent(session.token)}`, 302);
  }
  return new Response(null, {
    status: 302,
    headers: {
      location: "/home",
      "set-cookie": sessionCookie(session.token, session.maxAge, secureRequest(request)),
    },
  });
}
