import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
});

function TermsPage() {
  return (
    <main className="ob-page">
      <div className="ob">
        <header className="ob-head">
          <img className="ob-logo" src="/brand/vibez-mark.png" alt="Vibez" style={{ margin: "12px auto 0" }} />
          <h1>Terms of Service</h1>
        </header>
        <section className="ob-discover">
          <p className="ob-note">
            Vibez is an entertainment marketplace for music, events and promotion in Nigeria. Creating an account
            does not buy a ticket, place an ad, or guarantee streams. Paid products only complete after a verified
            payment. Sponsored placements are labelled and are not editorial endorsements.
          </p>
          <p className="ob-switch">
            <Link to="/">Back</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
