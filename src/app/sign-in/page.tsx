"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const result = await authClient.signIn.email({ email, password, callbackURL: "/studio" });
    setBusy(false);
    if (result.error) setError(result.error.message || "We couldn't sign you in. Check your details and try again.");
    else window.location.assign("/studio");
  }

  return <main className="auth-shell"><Link href="/" className="brand"><span className="brandmark">v.</span> vibez<span className="brand-dot">●</span></Link><section className="auth-card"><div className="auth-eyebrow">WELCOME BACK</div><h1>Good to have you<br/><span>back in the mix.</span></h1><p className="auth-copy">Sign in to your Vibez account and get back to your stations, people and shows.</p><form onSubmit={submit}><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/><label htmlFor="password">Password</label><input id="password" type="password" autoComplete="current-password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Your password"/>{error && <p className="auth-error" role="alert">{error}</p>}<button className="auth-submit" disabled={busy}>{busy ? "Signing you in…" : "Sign in"} <span>→</span></button></form><p className="auth-switch">New to Vibez? <Link href="/sign-up">Create an account</Link></p><p className="auth-legal">By continuing, you agree to use Vibez respectfully and follow our community rules.</p></section><footer className="auth-footer">YOUR CITY. YOUR SOUND. YOUR PEOPLE.</footer></main>;
}
