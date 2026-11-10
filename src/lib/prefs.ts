import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Profile = { name: string; email: string; city: string };

export type Draft = {
  id: string;
  title: string;
  category: string;
  city: string;
  venue: string;
  when: string;
  description: string;
  ticketName: string;
  priceNaira: string;
  quantity: string;
};

export type Hold = {
  id: string;
  eventSlug: string;
  eventTitle: string;
  tierName: string;
  qty: number;
  amountKobo: number;
  buyer: string;
  email: string;
  phone: string;
  createdAt: string;
};

type Prefs = {
  saved: string[];
  following: string[];
  profile: Profile | null;
  drafts: Draft[];
  holds: Hold[];
  toggleSaved: (slug: string) => void;
  toggleFollow: (slug: string) => void;
  setProfile: (profile: Profile) => void;
  clearProfile: () => void;
  addDraft: (draft: Draft) => void;
  removeDraft: (id: string) => void;
  addHold: (hold: Hold) => void;
  removeHold: (id: string) => void;
};

export const usePrefs = create<Prefs>()(
  persist(
    (set, get) => ({
      saved: [],
      following: [],
      profile: null,
      drafts: [],
      holds: [],
      toggleSaved: (slug) => {
        const saved = get().saved;
        set({
          saved: saved.includes(slug) ? saved.filter((item) => item !== slug) : [slug, ...saved],
        });
      },
      toggleFollow: (slug) => {
        const following = get().following;
        set({
          following: following.includes(slug)
            ? following.filter((item) => item !== slug)
            : [slug, ...following],
        });
      },
      setProfile: (profile) => set({ profile }),
      clearProfile: () => set({ profile: null }),
      addDraft: (draft) => set({ drafts: [draft, ...get().drafts] }),
      removeDraft: (id) => set({ drafts: get().drafts.filter((draft) => draft.id !== id) }),
      addHold: (hold) => set({ holds: [hold, ...get().holds] }),
      removeHold: (id) => set({ holds: get().holds.filter((hold) => hold.id !== id) }),
    }),
    { name: "vibez-prefs" },
  ),
);

export function refCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "VZ-";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}
