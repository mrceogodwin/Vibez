import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { confirmReset, sendReset } from "@/lib/platform.functions";

export const Route = createFileRoute("/reset")({
  component: ResetPage,
});

function ResetPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [devCode, setDevCode] = useState("");

  async function request(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setDevCode("");
    try {
      const result = await sendReset({ data: { email } });
      if (result.delivered) setMessage("Check your email for a 6-digit code.");
      else {
        setMessage(result.reason);
        setDevCode(result.devCode);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not send a code.");
    }
  }

  async function confirm(event: FormEvent) {
    event.preventDefault();
    try {
      await confirmReset({ data: { email, code, password } });
      setMessage("Password updated. You can log in.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not reset the password.");
    }
  }

  return (
    <main className="ob-page">
      <div className="ob">
        <form className="ob-form" onSubmit={(event) => void request(event)}>
          <h1>Reset password</h1>
          <label className="ob-field"><input type="email" required placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <button className="ob-primary" type="submit">Send code</button>
        </form>
        <form className="ob-form" onSubmit={(event) => void confirm(event)}>
          <label className="ob-field"><input inputMode="numeric" placeholder="6-digit code" value={code} onChange={(event) => setCode(event.target.value)} /></label>
          <label className="ob-field"><input type="password" minLength={8} placeholder="New password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          <button className="ob-primary" type="submit">Update password</button>
          {devCode ? <p className="note">Email is not configured, so this one-time code is shown here: <strong>{devCode}</strong></p> : null}
          {message ? <p className="ob-error">{message}</p> : null}
          <p className="ob-switch"><Link to="/login">Back to log in</Link></p>
        </form>
      </div>
    </main>
  );
}
