"use client";

import { useState } from "react";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [notice, setNotice] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  return (
    <main className="auth-shell">
      <a className="brand auth-brand" href="/"><span className="brandmark">v.</span> vibez<span className="brand-dot">●</span></a>
      <div className="auth-layout">
        <section className="auth-story">
          <div className="eyebrow">YOUR SOUND. YOUR PEOPLE.</div>
          <h1>Every voice<br/>has a <span>frequency.</span></h1>
          <p>Sign in to find your stations, join conversations and build a radio home of your own.</p>
          <div className="auth-wave" aria-hidden="true">{Array.from({length:27},(_,i)=><i key={i} style={{height:`${12+((i*17)%42)}px`}} />)}</div>
          <div className="auth-note"><span>✳</span><div><b>Start listening. Start connecting.</b><small>Your next favourite station could be one tap away.</small></div></div>
        </section>
        <section className="auth-card">
          <div className="auth-tabs"><button className={mode==="login"?"selected":""} onClick={()=>{setMode("login");setNotice("");}}>Log in</button><button className={mode==="signup"?"selected":""} onClick={()=>{setMode("signup");setNotice("");}}>Create account</button></div>
          <div className="auth-heading"><h2>{mode==="login"?"Welcome back.":"Join the frequency."}</h2><p>{mode==="login"?"Your people and stations are waiting.":"Create your Vibez account to get started."}</p></div>
          <form onSubmit={(event)=>{event.preventDefault();setNotice("The login screen is ready, but account authentication is not connected yet. No account was created and no credentials were sent.");}}>
            {mode==="signup"&&<label className="auth-field">Display name<input value={name} onChange={e=>setName(e.target.value)} autoComplete="name" placeholder="What should we call you?" required maxLength={50}/></label>}
            <label className="auth-field">Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" required/></label>
            <label className="auth-field">Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode==="login"?"current-password":"new-password"} placeholder="At least 8 characters" minLength={8} required/></label>
            {mode==="login"&&<div className="auth-inline"><label><input type="checkbox"/> Keep me signed in</label><button type="button" onClick={()=>setNotice("Password reset will be enabled after the authentication backend is configured.")}>Forgot password?</button></div>}
            <button className="auth-submit" type="submit">{mode==="login"?"Log in to Vibez":"Create my account"} <span>→</span></button>
          </form>
          {notice&&<div className="auth-notice" role="status">{notice}</div>}
          <div className="auth-divider"><span/> <small>YOUR ACCOUNT, YOUR VIBE</small> <span/></div>
          <p className="auth-terms">By continuing, you agree to use Vibez respectfully. Account creation and sign-in will become active after secure authentication is connected.</p>
          <a className="auth-studio-link" href="/studio">Want to build your own radio? <b>Open Creator Studio →</b></a>
        </section>
      </div>
      <footer className="auth-footer"><span>© 2026 Vibez</span><a href="/">Back to home</a><a href="/studio">Creator Studio</a></footer>
    </main>
  );
}
