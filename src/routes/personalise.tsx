import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, MapPin, Megaphone, Mic, Music, Ticket, Users } from "lucide-react";
import { useState } from "react";
import { genres, places } from "@/lib/feed";
import { savePersonalisation } from "@/lib/platform.functions";

export const Route = createFileRoute("/personalise")({
  component: PersonalisePage,
});

const roles = [
  { id: "fan", label: "Music Fan", icon: Music },
  { id: "artist", label: "Artist", icon: Mic },
  { id: "organiser", label: "Event Organiser", icon: Ticket },
  { id: "advertiser", label: "Advertiser", icon: Megaphone },
  { id: "community", label: "Community Owner", icon: Users },
] as const;

function PersonalisePage() {
  const navigate = useNavigate();
  const [picked, setPicked] = useState<string[]>(["fan"]);
  const [liked, setLiked] = useState<string[]>(["Afrobeats"]);
  const [place, setPlace] = useState<string>(places[0]);

  function toggle(list: string[], id: string, set: (value: string[]) => void) {
    set(list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
  }

  async function finish(skip = false) {
    const roles = skip ? ["fan"] : picked;
    if (roles.length === 0) return;
    const [city, state] = place.split(",").map((part) => part.trim());
    window.localStorage.setItem("vibez.roles", JSON.stringify(roles));
    window.localStorage.setItem("vibez.genres", JSON.stringify(skip ? [] : liked));
    window.localStorage.setItem("vibez.city", place);
    await savePersonalisation({
      data: { roles, genres: skip ? [] : liked, city: city || place, state: state || "", country: "Nigeria" },
    }).catch(() => undefined);
    void navigate({ to: "/home" });
  }

  return (
    <main className="ob-page">
      <div className="ob">
        <header className="ob-head fd-personal">
          <button type="button" className="ob-back" aria-label="Back" onClick={() => void navigate({ to: "/verify", search: { email: "" } })}>
            <ArrowLeft />
          </button>
          <img className="ob-logo" src="/brand/vibez-mark.png" alt="Vibez" />
          <h1>Personalise Your Vibez Experience</h1>
          <p>Tell us what you’re into so we can show you the right music, events and opportunities.</p>
          <img className="fd-phones" src="/media/headphones.jpg" alt="" />
        </header>
        <section className="ob-form">
          <h2>What best describes you?</h2>
          <p className="ob-note">You can select more than one.</p>
          <div className="fd-roles">
            {roles.map((role) => {
              const on = picked.includes(role.id);
              return (
                <button key={role.id} type="button" className={on ? "is-on" : undefined} onClick={() => toggle(picked, role.id, setPicked)}>
                  {on ? <span className="tick"><Check size={12} /></span> : null}
                  <role.icon size={18} />
                  {role.label}
                </button>
              );
            })}
          </div>
          <h2>Your favourite music genres? <span>(Optional)</span></h2>
          <p className="ob-note">Select all that apply.</p>
          <div className="fd-genres">
            {genres.map((genre) => (
              <button key={genre} type="button" className={liked.includes(genre) ? "is-on" : undefined} onClick={() => toggle(liked, genre, setLiked)}>
                {genre} {liked.includes(genre) ? <Check size={14} /> : null}
              </button>
            ))}
          </div>
          <h2>Your location</h2>
          <p className="ob-note">Helps us show you relevant events and opportunities.</p>
          <label className="fd-place">
            <MapPin size={18} />
            <select value={place} onChange={(event) => setPlace(event.target.value)}>
              {places.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <button type="button" className="ob-primary" style={{ width: "100%", marginTop: 18 }} onClick={() => void finish(false)}>
            Continue <ArrowRight size={16} />
          </button>
          <button type="button" className="ob-ghost" style={{ width: "100%", marginTop: 10 }} onClick={() => void finish(true)}>
            Skip for now
          </button>
        </section>
      </div>
    </main>
  );
}
