import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Link2,
  Megaphone,
  Music,
  QrCode,
  Ticket,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  component: Welcome,
});

const slides = [
  {
    title: "Your World of Music, Events & Entertainment.",
    body: "Discover music, follow your favourite artists, explore events and experience entertainment in one place.",
    photo: "/media/onboard-tickets.jpg",
    alt: "Artist in sunglasses at a blue-lit show",
  },
  {
    title: "Your Sound Deserves to Be Heard.",
    body: "Promote your music, reach entertainment communities, secure music placements and grow your audience with Vibez.",
    photo: "/media/onboard-sound.jpg",
    alt: "Artist in headphones and a blue hoodie",
  },
  {
    title: "Discover. Experience. Connect.",
    body: "Find exciting events around you, discover new experiences and secure your tickets with Vibez.",
    photo: "/media/onboard-discover.jpg",
    alt: "Artist laughing in front of a concert stage",
  },
] as const;

function Welcome() {
  const navigate = useNavigate();
  const [splash, setSplash] = useState(true);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setSplash(false), reduce ? 350 : 1500);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="ob-page">
      {splash ? (
        <div className="ob-splash" role="status" aria-label="Vibez">
          <img src="/brand/vibez-mark.png" alt="Vibez" />
        </div>
      ) : null}
      <div className="ob">
        <section className="ob-hero">
          <div className="ob-top">
            <img className="ob-logo" src="/brand/vibez-mark.png" alt="Vibez" />
            <button type="button" className="ob-skip" onClick={() => void navigate({ to: "/home" })}>
              Skip
            </button>
          </div>
          <div className="ob-stage">
            <h1>{slides[slide].title}</h1>
            {slide > 0 ? <div className="ob-rule" /> : null}
            <p>{slides[slide].body}</p>
            <img className="ob-photo" src={slides[slide].photo} alt="" />
          </div>
        </section>
        <section className="ob-sheet">
          {slide === 0 ? <Tiles /> : null}
          {slide === 1 ? <SoundList /> : null}
          {slide === 2 ? <DiscoverList /> : null}
          <div className="ob-dots" role="tablist" aria-label="Introduction">
            {slides.map((item, index) => (
              <button
                key={item.title}
                type="button"
                className={index === slide ? "is-on" : undefined}
                aria-label={`Screen ${index + 1}`}
                onClick={() => setSlide(index)}
              />
            ))}
          </div>
          {slide === 0 ? (
            <div className="ob-actions">
              <Link to="/register" className="ob-primary">
                Create Account
              </Link>
              <Link to="/login" className="ob-ghost">
                Log In
              </Link>
            </div>
          ) : (
            <div className="ob-nav">
              <button type="button" className="ob-ghost" onClick={() => setSlide((value) => value - 1)}>
                <ArrowLeft size={16} /> Back
              </button>
              {slide === 1 ? (
                <button type="button" className="ob-primary" onClick={() => setSlide(2)}>
                  Continue <ArrowRight size={16} />
                </button>
              ) : (
                <Link to="/register" className="ob-primary">
                  Get Started <ArrowRight size={16} />
                </Link>
              )}
            </div>
          )}
          {slide === 0 ? (
            <p className="ob-legal">
              By continuing, you agree to our <Link to="/terms">Terms of Service</Link> and{" "}
              <Link to="/privacy">Privacy Policy</Link>.
            </p>
          ) : null}
        </section>
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
      <Row icon={Music} title="Music Placements & Artist Profiles" body="Get featured, build your artist page and reach more listeners." />
      <Row icon={Users} title="Community Music Push" body="Promote your releases through active entertainment communities." />
      <Row icon={Megaphone} title="Advertising Campaigns" body="Run targeted ads for your music, events or brand on Vibez." />
    </div>
  );
}

function DiscoverList() {
  return (
    <div className="ob-list">
      <Row icon={Ticket} title="Event Tickets" body="Buy tickets securely for concerts, shows, festivals and more." />
      <Row icon={Calendar} title="Discover Events" body="Explore upcoming events in your city and across Nigeria." />
      <Row icon={QrCode} title="Digital Entry" body="Access your tickets with unique QR codes at the venue." />
    </div>
  );
}

function Row({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Music;
  title: string;
  body: string;
}) {
  return (
    <article className="ob-row">
      <span className="ob-ico">
        <Icon size={26} strokeWidth={1.75} />
      </span>
      <div>
        <h2>{title}</h2>
        <p>{body}</p>
      </div>
      <ArrowRight className="chev" size={18} />
    </article>
  );
}
