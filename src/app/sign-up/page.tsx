"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const result = await authClient.signUp.email({ name: name.trim(), email, password, callbackURL: "/studio" });
    setBusy(false);
    if (result.error) setError(result.error.message || "We couldn't create your account. Please try again.");
    else window.location.assign("/studio");
  }

  return <main className="auth-shell"><Link href="/" className="brand"><span className="brandmark">v.</span> vibez<span className="brand-dot">●</span></Link><section className="auth-card"><div className="auth-eyebrow">JOIN THE FREQUENCY</div><h1>Your people.<br/><span>Your own station.</span></h1><p className="auth-copy">Create your account to find stations, join conversations and start building your own audience.</p><form onSubmit={submit}><label htmlFor="name">Display name</label><input id="name" autoComplete="name" required maxLength={70} value={name} onChange={e=>setName(e.target.value)} placeholder="What should we call you?"/><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/><label htmlFor="password">Create password</label><input id="password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/>{error && <p className="auth-error" role="alert">{error}</p>}<button className="auth-submit" disabled={busy}>{busy ? "Creating your account…" : "Create account"} <span>→</span></button></form><p className="auth-switch">Already have an account? <Link href="/sign-in">Sign in</Link></p><p className="auth-legal">Your account lets you personalise Vibez. Creator broadcasting will unlock as studio features are completed.</p></section><footer className="auth-footer">GOOD SOUNDS. REAL PEOPLE. BETTER NIGHTS.</footer></main>;
}
