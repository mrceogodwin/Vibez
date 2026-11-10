import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Dock } from "@/components/vibez/dock";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUser } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const user = useCurrentUser();
  const [roles, setRoles] = useState<string[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [city, setCity] = useState("");

  useEffect(() => {
    setRoles(readList("vibez.roles"));
    setGenres(readList("vibez.genres"));
    setCity(window.localStorage.getItem("vibez.city") ?? "");
  }, []);

  return (
    <main className="fd-light">
      <div className="fd">
        <h1>Profile</h1>
        <p className="fd-sub">{user?.displayName || "Your Vibez account"}</p>
        <p className="fd-sub">{user?.primaryEmail}</p>
        <div className="ob-user"><UserButton /></div>
        {city ? <p className="fd-sub">Location: {city}</p> : null}
        {roles.length ? <p className="fd-sub">Roles: {roles.join(", ")}</p> : null}
        {genres.length ? <p className="fd-sub">Genres: {genres.join(", ")}</p> : null}
        <div className="fd-menu">
          <Link to="/account">Tickets and saved events</Link>
          <Link to="/events">Browse events</Link>
          <Link to="/create">List an event</Link>
          <Link to="/personalise">Edit preferences</Link>
        </div>
        <Dock tone="light" />
      </div>
    </main>
  );
}

function readList(key: string) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
  } catch {
    return [];
  }
}
