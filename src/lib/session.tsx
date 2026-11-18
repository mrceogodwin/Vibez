import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";

export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  username: string;
  roles: string[];
  balanceKobo: number;
  balanceLabel: string;
  credits: number;
  plusUntil: string | null;
  followers: number;
  following: number;
  posts: number;
};

type SessionValue = {
  user: SessionUser | null;
  ready: boolean;
  refresh: () => Promise<void>;
  setUser: (user: SessionUser | null) => void;
};

const SessionContext = createContext<SessionValue>({
  user: null,
  ready: false,
  refresh: async () => {},
  setUser: () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
  async function refresh() {
    try {
      const data = await api<{ user: SessionUser | null }>("/api/auth/session");
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setReady(true);
    }
  }
  useEffect(() => {
    let cancelled = false;
    api<{ user: SessionUser | null }>("/api/auth/session")
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return <SessionContext.Provider value={{ user, ready, refresh, setUser }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
