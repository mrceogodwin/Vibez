import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  component: Welcome,
});

const slides = [
  {
    title: "Your world of music.",
    sub: "Events and culture, together.",
    photo: "/media/onboard-headphones.jpg",
    alt: "A young woman smiling in white headphones",
    cta: "Get Started",
  },
  {
    title: "Be heard.",
    sub: "Promote it. Grow it.",
    photo: "/media/onboard-stage.jpg",
    alt: "A guitarist on a blue-lit stage",
    cta: "Continue",
  },
  {
    title: "Go out.",
    sub: "Shows and tickets, one place.",
    photo: "/media/onboard-crowd.jpg",
    alt: "A concert crowd under coloured lights",
    cta: "Get Started",
  },
];

function Welcome() {
  const navigate = useNavigate();
  const scroller = useRef<HTMLDivElement>(null);
  const [splash, setSplash] = useState(true);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setSplash(false), reduce ? 200 : 900);
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
    <main className="ob2">
      {splash ? (
        <div className="ob-splash" role="status" aria-label="Vibez">
          <img src="/brand/vibez-mark.png" alt="Vibez" />
        </div>
      ) : null}
      <div className="ob2-top">
        <img src="/brand/vibez-mark.png" alt="Vibez" />
        <button type="button" onClick={() => void navigate({ to: "/home" })}>Skip</button>
      </div>
      <div
        className="ob2-track"
        ref={scroller}
        onScroll={onScroll}
        aria-label="Introduction"
      >
        {slides.map((item) => (
          <section className="ob2-slide" key={item.title}>
            <img src={item.photo} alt={item.alt} />
            <div className="ob2-veil" />
            <div className="ob2-copy">
              <h1>{item.title}</h1>
              <p>{item.sub}</p>
            </div>
          </section>
        ))}
      </div>
      <div className="ob2-bar">
        <div className="ob-dots" role="tablist" aria-label="Onboarding">
          {slides.map((item, index) => (
            <button
              key={item.title}
              type="button"
              role="tab"
              aria-selected={index === slide}
              className={index === slide ? "is-on" : undefined}
              aria-label={`Screen ${index + 1}`}
              onClick={() => go(index)}
            >
              <i />
            </button>
          ))}
        </div>
        <button type="button" className="ob-primary" onClick={advance}>
          {slides[slide].cta} <ArrowRight size={16} />
        </button>
        <p className="ob2-legal">
          <Link to="/login">Log in</Link>
          <span> · </span>
          <Link to="/legal/$doc" params={{ doc: "terms" }}>Terms</Link>
          <span> and </span>
          <Link to="/legal/$doc" params={{ doc: "privacy" }}>Privacy</Link>
        </p>
      </div>
    </main>
  );
}
