import { create } from "zustand";

export type Playable = {
  id: string;
  title: string;
  artist: string;
  artwork: string;
  username: string;
  slug: string;
  previewUrl: string | null;
  durationSeconds: number | null;
  sample: boolean;
};

type PlayerState = {
  queue: Playable[];
  index: number;
  playing: boolean;
  shuffle: boolean;
  repeat: "off" | "one" | "all";
  play: (track: Playable, queue?: Playable[]) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  progress: number;
  duration: number;
  setTimes: (progress: number, duration: number) => void;
  jump: (index: number) => void;
  seekRequest: number | null;
  requestSeek: (seconds: number) => void;
  clearSeek: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  current: () => Playable | null;
};

export const usePlayer = create<PlayerState>((set, get) => ({
  queue: [],
  index: 0,
  playing: false,
  shuffle: false,
  repeat: "off",
  progress: 0,
  duration: 0,
  seekRequest: null,
  setTimes: (progress, duration) => set({ progress, duration }),
  jump: (index) => {
    const track = get().queue[index];
    if (!track) return;
    set({ index, playing: Boolean(track.previewUrl), seekRequest: 0, progress: 0 });
  },
  play: (track, queue) => {
    const list = queue?.length ? queue : [track];
    const index = Math.max(0, list.findIndex((item) => item.id === track.id));
    set({ queue: list, index, playing: Boolean(track.previewUrl) });
  },
  toggle: () => {
    const current = get().queue[get().index];
    if (!current?.previewUrl) return;
    set({ playing: !get().playing });
  },
  next: () => {
    const { queue, index, shuffle, repeat } = get();
    if (!queue.length) return;
    if (repeat === "one") {
      set({ seekRequest: 0, playing: Boolean(queue[index]?.previewUrl) });
      return;
    }
    const nextIndex = shuffle
      ? Math.floor(Math.random() * queue.length)
      : index + 1 >= queue.length
        ? repeat === "all"
          ? 0
          : index
        : index + 1;
    set({ index: nextIndex, playing: Boolean(queue[nextIndex]?.previewUrl), seekRequest: 0 });
  },
  prev: () => {
    const { queue, index } = get();
    if (!queue.length) return;
    const nextIndex = index === 0 ? 0 : index - 1;
    set({ index: nextIndex, playing: Boolean(queue[nextIndex]?.previewUrl), seekRequest: 0 });
  },
  requestSeek: (seconds) => set({ seekRequest: seconds }),
  clearSeek: () => set({ seekRequest: null }),
  toggleShuffle: () => set({ shuffle: !get().shuffle }),
  cycleRepeat: () => set({ repeat: get().repeat === "off" ? "all" : get().repeat === "all" ? "one" : "off" }),
  current: () => get().queue[get().index] ?? null,
}));
