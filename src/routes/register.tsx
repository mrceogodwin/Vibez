import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Eye, EyeOff, Lock, Mail, Megaphone, Music, Ticket, User, Users } from "lucide-react";
import { useState, type FormEvent } from "react";
import { authClient, authEnabled, signIn, GROK_PROVIDERS } from "@/lib/auth/client";
import { savePersonalisation, sendVerification } from "@/lib/platform.functions";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

const roles = [
  { id: "fan", label: "Music Fan", icon: User },
  { id: "artist", label: "Artist", icon: Music },
  { id: "organiser", label: "Event Organiser", icon: Ticket },
  { id: "advertiser", label: "Advertiser", icon: Megaphone },
  { id: "community", label: "Community Owner", icon: Users },
] as const;

function RegisterPage() {
  const navigate = useNavigate();
  const [picked, setPicked] = useState<string[]>(["fan"]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  function toggle(id: string) {
    setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!authEnabled) {
      setError("Account creation is not available in this build.");
      return;
    }
    if (picked.length === 0) {
      setError("Choose at least one role.");
      return;
    }
    setPending(true);
    const result = await authClient.signUp.email({
      email: email.trim(),
      password,
      name: name.trim(),
      callbackURL: "/discover",
    });
    setPending(false);
    if (result.error) {
      setError(result.error.message || "Could not create the account.");
      return;
    }
    window.localStorage.setItem("vibez.roles", JSON.stringify(picked));
    await savePersonalisation({ data: { roles: picked, genres: [], city: "" } }).catch(() => undefined);
    void navigate({ to: "/verify", search: { email: email.trim() } });
  }

  return (
    <main className="ob-page">
      <div className="ob">
        <header className="ob-head">
          <button type="button" className="ob-back" aria-label="Back" onClick={() => void navigate({ to: "/" })}>
            <ArrowLeft />
          </button>
          <img className="ob-logo" src="/brand/vibez-mark.png" alt="Vibez" style={{ margin: "8px auto 0" }} />
          <h1>Create Your Vibez Account</h1>
          <p>Join the entertainment hub for music, events and promotion.</p>
        </header>
        <form className="ob-form" onSubmit={submit}>
          <h2>Choose what best describes you</h2>
          <p className="ob-note">You can choose more than one. You can update later.</p>
          <div className="ob-roles">
            {roles.map((role) => {
              const on = picked.includes(role.id);
              return (
                <button
                  key={role.id}
                  type="button"
                  className={on ? "ob-role is-on" : "ob-role"}
                  aria-pressed={on}
                  onClick={() => toggle(role.id)}
                >
                  {on ? (
                    <span className="tick">
                      <Check size={12} />
                    </span>
                  ) : null}
                  <role.icon size={22} />
                  {role.label}
                </button>
              );
            })}
          </div>
          <label className="ob-field">
            <Mail size={18} />
            <input type="email" required autoComplete="email" placeholder="Email Address" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="ob-field">
            <User size={18} />
            <input required autoComplete="name" placeholder="Full Name" value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label className="ob-field">
            <Lock size={18} />
            <input
              required
              minLength={8}
              type={show ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Create Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow((value) => !value)}>
              {show ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </label>
          <p className="ob-legal">By creating an account you agree to the <Link to="/legal/$doc" params={{ doc: "terms" }}>Terms</Link> and <Link to="/legal/$doc" params={{ doc: "privacy" }}>Privacy Policy</Link>.</p>
          {error ? <p className="ob-error">{error}</p> : null}
          <button className="ob-primary" type="submit" disabled={pending} style={{ width: "100%", marginTop: 16 }}>
            {pending ? "Creating…" : "Create Account"}
          </button>
          <div className="ob-or">or continue with</div>
          {authEnabled ? (
            <button type="button" className="ob-google" onClick={() => void signIn(GROK_PROVIDERS.find((item) => item.idp === "google")?.providerId ?? "grok-google", { callbackURL: "/personalise" })}>
              <GoogleMark /> Continue with Google
            </button>
          ) : (
            <p className="note">Google sign-in is not configured in this build.</p>
          )}
          <p className="ob-switch">
            Already have an account? <Link to="/login">Log In</Link>
          </p>
        </form>
      </div>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.7-6.6 7.2l6.3 5.3C37.4 38.4 44 33 44 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}
