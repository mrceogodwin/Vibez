import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Calendar, Link2, Megaphone, Music, QrCode, Ticket, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  component: Welcome,
});

const slides = [
  {
    kicker: "Welcome to Vibez",
    title: "Your World of Music, Events & Entertainment.",
    body: "Discover music, follow your favourite artists, explore events and experience entertainment in one place.",
    photo: "/media/onboard-headphones.jpg",
    alt: "A young woman smiling with white headphones on",
    cta: "Get Started",
    kind: "tiles" as const,
  },
  {
    kicker: "Create. Promote. Grow.",
    title: "Your Sound Deserves to Be Heard.",
    body: "Promote music, reach communities, secure placements and grow your audience.",
    photo: "/media/onboard-stage.jpg",
    alt: "A guitarist performing under blue stage lights",
    cta: "Continue",
    kind: "promote" as const,
  },
  {
    kicker: "Discover. Experience. Connect.",
    title: "Discover. Experience. Connect.",
    body: "Explore concerts, festivals, parties and entertainment experiences.",
    photo: "/media/onboard-crowd.jpg",
    alt: "A concert crowd under coloured lights",
    cta: "Get Started",
    kind: "discover" as const,
  },
];

function Welcome() {
  const navigate = useNavigate();
  const scroller = useRef<HTMLDivElement>(null);
  const [splash, setSplash] = useState(true);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setSplash(false), reduce ? 200 : 1200);
    return () => window.clearTimeout(timer);
  }, []);

  function go(index: number) {
    const node = scroller.current;
    const next = Math.max(0, Math.min(slides.length - 1, index));
    if (!node) {
      setSlide(next);
      return;
    }
    node.scrollTo({ left: next * node.clientWidth, behavior: "smooth" });
    setSlide(next);
  }

  function onScroll() {
    const node = scroller.current;
    if (!node || node.clientWidth === 0) return;
    setSlide(Math.round(node.scrollLeft / node.clientWidth));
  }

  function advance() {
    if (slide >= slides.length - 1) {
      void navigate({ to: "/register" });
      return;
    }
    go(slide + 1);
  }

  return (
    <main className="ob-page">
      {splash ? (
        <div className="ob-splash" role="status" aria-label="Vibez">
          <img src="/brand/vibez-mark.png" alt="Vibez" />
        </div>
      ) : null}
      <div className="ob ob-carousel-app">
        <div className="ob-top ob-top-float">
          <img className="ob-logo" src="/brand/vibez-mark.png" alt="Vibez" />
          <button type="button" className="ob-skip" onClick={() => void navigate({ to: "/home" })}>
            Skip
          </button>
        </div>
        <div
          className="ob-carousel"
          ref={scroller}
          onScroll={onScroll}
          tabIndex={0}
          aria-label="Introduction"
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") go(slide + 1);
            if (event.key === "ArrowLeft") go(slide - 1);
          }}
        >
          {slides.map((item) => (
            <section className="ob-slide" key={item.title} aria-roledescription="slide">
              <div className="ob-hero">
                <div className="ob-stage">
                  <p className="ob-kicker">{item.kicker}</p>
                  <h1>{item.title}</h1>
                  <p>{item.body}</p>
                  <img className="ob-photo" src={item.photo} alt={item.alt} />
                </div>
              </div>
              <div className="ob-sheet">
                {item.kind === "tiles" ? <Tiles /> : null}
                {item.kind === "promote" ? <SoundList /> : null}
                {item.kind === "discover" ? <DiscoverList /> : null}
              </div>
            </section>
          ))}
        </div>
        <div className="ob-dock">
          <div className="ob-dots" role="tablist" aria-label="Onboarding screens">
            {slides.map((item, index) => (
              <button
                key={item.title}
                type="button"
                role="tab"
                aria-selected={index === slide}
                className={index === slide ? "is-on" : undefined}
                aria-label={`Show screen ${index + 1}: ${item.kicker}`}
                onClick={() => go(index)}
              >
                <i />
              </button>
            ))}
          </div>
          <button type="button" className="ob-primary" onClick={advance}>
            {slides[slide].cta} <ArrowRight size={16} />
          </button>
          <p className="ob-legal">
            <Link to="/login">Log in</Link>
            {" · "}
            By continuing, you agree to our <Link to="/legal/$doc" params={{ doc: "terms" }}>Terms</Link> and{" "}
            <Link to="/legal/$doc" params={{ doc: "privacy" }}>Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </main>
  );
}

function Tiles() {
  const items = [
    { icon: Ticket, label: "Event Tickets" },
    { icon: Music, label: "Music Placements" },
    { icon: Megaphone, label: "Advertising" },
    { icon: Users, label: "Community Music Push" },
    { icon: Link2, label: "Vibez Artist Link" },
  ];
  return (
    <div className="ob-tiles">
      {items.map((item) => (
        <div key={item.label} className="ob-tile">
          <item.icon strokeWidth={1.75} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function SoundList() {
  return (
    <div className="ob-list">
      <Row icon={Music} title="Music Placements" body="Feature a release. Editorial approval stays independent of payment." />
      <Row icon={Users} title="Community Music Push" body="Invite communities that choose to promote. No member lists." />
      <Row icon={Megaphone} title="Advertising Campaigns" body="Book a placement. Live ads are labelled Sponsored." />
    </div>
  );
}

function DiscoverList() {
  return (
    <div className="ob-list">
      <Row icon={Calendar} title="Discover Events" body="Concerts, festivals and parties, with sample listings marked." />
      <Row icon={Ticket} title="Secure Tickets" body="Paystack confirms the payment before a ticket exists." />
      <Row icon={QrCode} title="Digital Entry" body="A wallet pass with a QR code the gate checks on the server." />
    </div>
  );
}

function Row({ icon: Icon, title, body }: { icon: typeof Music; title: string; body: string }) {
  return (
    <article className="ob-row">
      <span className="ob-ico"><Icon size={26} strokeWidth={1.75} /></span>
      <div>
        <h2>{title}</h2>
        <p>{body}</p>
      </div>
    </article>
  );
}
