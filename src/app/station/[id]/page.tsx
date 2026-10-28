"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Station = { id: string; name: string; tagline: string; genre: string };

export default function StationPage() {
  const params = useParams<{ id: string }>();
  const [station, setStation] = useState<Station | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stations/" + encodeURIComponent(params.id))
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Station not found.");
        return data.station as Station;
      })
      .then((value) => { if (!cancelled) setStation(value); })
      .catch((reason) => { if (!cancelled) setError(reason instanceof Error ? reason.message : "Could not load station."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [params.id]);

  return (
    <main className="shell" style={{ minHeight: "100vh", paddingTop: 36, paddingBottom: 64 }}>
      <header className="nav">
        <a className="brand" href="/"><span className="brandmark">v.</span> vibez<span className="brand-dot">●</span></a>
        <a className="login" href="/login">Log in</a>
      </header>
      <section style={{ maxWidth: 720, margin: "72px auto", padding: 28, border: "1px solid #292929", borderRadius: 12, background: "#141414" }}>
        <div className="eyebrow">VIBEZ STATION</div>
        {loading ? <h1>Finding your frequency…</h1> : error ? <><h1>Station unavailable</h1><p>{error}</p><a className="primary" href="/">Explore stations →</a></> : station ? <><h1 style={{ fontSize: 48, marginTop: 20 }}>{station.name}</h1><p style={{ color: "#aaa" }}>{station.tagline || "A creator station on Vibez"}</p><p className="eyebrow">{station.genre}</p><div style={{ marginTop: 28, padding: 20, background: "#090909", borderRadius: 8 }}><b>Playback is coming soon</b><p style={{ color: "#aaa" }}>This station profile is public. Live audio will be available once the streaming provider is connected.</p></div><a className="primary" style={{ marginTop: 24 }} href="/studio">Create your own station →</a></> : null}
      </section>
    </main>
  );
}
