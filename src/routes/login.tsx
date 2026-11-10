import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import { authClient, authEnabled, signIn } from "@/lib/auth/client";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!authEnabled) {
      setError("Sign-in is not available in this build.");
      return;
    }
    setPending(true);
    const result = await authClient.signIn.email({
      email: email.trim(),
      password,
      callbackURL: "/discover",
    });
    setPending(false);
    if (result.error) {
      setError(result.error.message || "Those details did not match an account.");
      return;
    }
    void navigate({ to: "/home" });
  }

  return (
    <main className="ob-page">
      <div className="ob">
        <header className="ob-head">
          <button type="button" className="ob-back" aria-label="Back" onClick={() => void navigate({ to: "/" })}>
            <ArrowLeft />
          </button>
          <img className="ob-logo" src="/brand/vibez-mark.png" alt="Vibez" style={{ margin: "8px auto 0" }} />
          <h1>Log In</h1>
          <p>Use the email and password on your Vibez account.</p>
        </header>
        <form className="ob-form" onSubmit={submit}>
          <label className="ob-field">
            <Mail size={18} />
            <input type="email" required autoComplete="email" placeholder="Email Address" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="ob-field">
            <Lock size={18} />
            <input
              required
              type={show ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow((value) => !value)}>
              {show ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </label>
          {error ? <p className="ob-error">{error}</p> : null}
          <button className="ob-primary" type="submit" disabled={pending} style={{ width: "100%", marginTop: 16 }}>
            {pending ? "Checking…" : "Log In"}
          </button>
          <div className="ob-or">or continue with</div>
          <button
            type="button"
            className="ob-google"
            onClick={() => void signIn("google", { callbackURL: "/home" })}
          >
            Continue with Google
          </button>
          <p className="ob-switch">
            New to Vibez? <Link to="/register">Create Account</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
