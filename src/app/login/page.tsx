"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [notice, setNotice] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const requestedMode = new URLSearchParams(window.location.search).get("mode");
    if (requestedMode === "signup") setMode("signup");
  }, []);

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
          <form onSubmit={async (event)=>{event.preventDefault();setNotice("");setBusy(true);try{if(mode==="signup"){const result=await authClient.signUp.email({name:name.trim(),email:email.trim(),password,callbackURL:"/studio"});if(result.error)throw new Error(result.error.message||"Could not create your account.");setNotice("Account created. Taking you to your studio…");router.push("/studio");router.refresh();}else{const requestedNext=new URLSearchParams(window.location.search).get("next");const destination=requestedNext==="/admin"?"/admin":"/studio";const result=await authClient.signIn.email({email:email.trim(),password,rememberMe,callbackURL:destination});if(result.error)throw new Error(result.error.message||"Could not sign in.");router.push(destination);router.refresh();}}catch(error){setNotice(error instanceof Error?error.message:"Something went wrong. Please try again.");}finally{setBusy(false);}}}>
            {mode==="signup"&&<label className="auth-field">Display name<input value={name} onChange={e=>setName(e.target.value)} autoComplete="name" placeholder="What should we call you?" required maxLength={50}/></label>}
            <label className="auth-field">Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" required/></label>
            <label className="auth-field">Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode==="login"?"current-password":"new-password"} placeholder="At least 8 characters" minLength={8} required/></label>
            {mode==="login"&&<div className="auth-inline"><label><input type="checkbox" checked={rememberMe} onChange={e=>setRememberMe(e.target.checked)}/> Keep me signed in</label><button type="button" onClick={()=>setNotice("Password reset is not available yet. We still need to configure a verified email provider.")}>Forgot password?</button></div>}
            <button className="auth-submit" type="submit" disabled={busy}>{busy?"Please wait…":mode==="login"?"Log in to Vibez":"Create my account"} <span>→</span></button>
          </form>
          {notice&&<div className="auth-notice" role="status">{notice}</div>}
          <div className="auth-divider"><span/> <small>YOUR ACCOUNT, YOUR VIBE</small> <span/></div>
          <p className="auth-terms">By continuing, you agree to use Vibez respectfully. Keep your password private. Your session is protected by secure cookies.</p>
          <a className="auth-studio-link" href="/studio">Want to build your own radio? <b>Open Creator Studio →</b></a>
        </section>
      </div>
      <footer className="auth-footer"><span>© 2026 Vibez</span><a href="/">Back to home</a><a href="/studio">Creator Studio</a></footer>
    </main>
  );
}
