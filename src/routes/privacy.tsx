import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="ob-page">
      <div className="ob">
        <header className="ob-head">
          <img className="ob-logo" src="/brand/vibez-mark.png" alt="Vibez" style={{ margin: "12px auto 0" }} />
          <h1>Privacy Policy</h1>
        </header>
        <section className="ob-discover">
          <p className="ob-note">
            Account email and name are stored so you can sign in. Role choices on the create-account screen stay on
            this device until profiles are saved to the database. Vibez does not ask community owners for member
            phone numbers, and it does not store card numbers.
          </p>
          <p className="ob-switch">
            <Link to="/">Back</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
