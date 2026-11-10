import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { confirmVerification, sendVerification } from "@/lib/platform.functions";

export const Route = createFileRoute("/verify")({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === "string" ? search.email : "",
  }),
  component: VerifyPage,
});

function VerifyPage() {
  const { email } = Route.useSearch();
  const navigate = useNavigate();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [seconds, setSeconds] = useState(59);
  const [error, setError] = useState("");
  const [devCode, setDevCode] = useState("");
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!email) return;
    sendVerification({ data: { email } })
      .then((result) => {
        if (!result.delivered) {
          setDevCode(result.devCode);
          setError(result.reason);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not send a code."));
  }, [email]);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = window.setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [seconds]);

  function write(index: number, raw: string) {
    const only = raw.replace(/\D/g, "");
    if (only.length > 1) {
      const next = [...digits];
      only.slice(0, 6).split("").forEach((char, offset) => {
        if (index + offset < 6) next[index + offset] = char;
      });
      setDigits(next);
      inputs.current[Math.min(5, index + only.length)]?.focus();
      return;
    }
    const next = [...digits];
    next[index] = only;
    setDigits(next);
    if (only && index < 5) inputs.current[index + 1]?.focus();
  }

  function submit() {
    const code = digits.join("");
    if (code.length < 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    confirmVerification({ data: { email, code } })
      .then(() => navigate({ to: "/personalise" }))
      .catch((err) => setError(err instanceof Error ? err.message : "That code was not accepted."));
  }

  function resend() {
    setSeconds(59);
    sendVerification({ data: { email } })
      .then((result) => {
        if (!result.delivered) setDevCode(result.devCode);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not resend."));
  }

  return (
    <main className="ob-page">
      <div className="ob">
        <header className="ob-head">
          <button type="button" className="ob-back" aria-label="Back" onClick={() => void navigate({ to: "/register" })}>
            <ArrowLeft />
          </button>
          <img className="ob-logo" src="/brand/vibez-mark.png" alt="Vibez" style={{ margin: "6px auto 0" }} />
          <Envelope />
        </header>
        <section className="ob-form">
          <h1 className="fd-title">Verify Your Email</h1>
          <p className="fd-lead">
            We’ve sent a 6-digit verification code to <strong>{email || "your email"}</strong>
          </p>
          <div className="fd-otp">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(node) => {
                  inputs.current[index] = node;
                }}
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                maxLength={1}
                size={1}
                aria-label={`Digit ${index + 1}`}
                value={digit}
                onChange={(event) => write(index, event.target.value)}
                onPaste={(event) => {
                  const text = event.clipboardData.getData("text");
                  if (/\d/.test(text)) {
                    event.preventDefault();
                    write(index, text);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Backspace" && !digits[index] && index > 0) inputs.current[index - 1]?.focus();
                }}
              />
            ))}
          </div>
          {devCode ? <p className="note">Your code is <strong>{devCode}</strong></p> : null}
          {error ? <p className="ob-error">{error}</p> : null}
          <button type="button" className="ob-primary" style={{ width: "100%", marginTop: 18 }} onClick={submit}>
            Verify Email
          </button>
          <p className="fd-resend">
            Didn’t get the code?{" "}
            {seconds > 0 ? (
              <strong>Resend in {seconds}s</strong>
            ) : (
              <button type="button" onClick={resend}>
                Resend
              </button>
            )}
          </p>
          <p className="fd-spam">
            <Send size={16} /> Check your spam or promotions folder.
          </p>
        </section>
      </div>
    </main>
  );
}

function Envelope() {
  return (
    <svg className="fd-mail" viewBox="0 0 160 120" aria-hidden="true">
      <path d="M18 38h28" stroke="#dbe4ff" strokeWidth="4" strokeLinecap="round" />
      <path d="M22 26h18" stroke="#dbe4ff" strokeWidth="4" strokeLinecap="round" />
      <path d="M30 16h10" stroke="#dbe4ff" strokeWidth="4" strokeLinecap="round" />
      <path d="M28 78l52 28 52-28V46H28v32z" fill="#2f6bff" />
      <path d="M28 46l52 30 52-30 8 6v8L80 96 20 60v-8l8-6z" fill="#1d4ed8" />
      <path d="M46 28h68a8 8 0 0 1 8 8v34L80 92 38 70V36a8 8 0 0 1 8-8z" fill="#f4f7ff" />
      <circle cx="80" cy="52" r="16" fill="#2450ff" />
      <path d="M73 52l5 5 10-11" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
