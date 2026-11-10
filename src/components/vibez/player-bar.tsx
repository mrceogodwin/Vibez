import { Link } from "@tanstack/react-router";
import { Pause, Play } from "lucide-react";
import { useEffect, useRef } from "react";
import { usePlayer } from "@/lib/player-store";

export function PlayerBar() {
  const queue = usePlayer((state) => state.queue);
  const index = usePlayer((state) => state.index);
  const playing = usePlayer((state) => state.playing);
  const seekRequest = usePlayer((state) => state.seekRequest);
  const toggle = usePlayer((state) => state.toggle);
  const clearSeek = usePlayer((state) => state.clearSeek);
  const next = usePlayer((state) => state.next);
  const audio = useRef<HTMLAudioElement | null>(null);
  const track = queue[index];

  useEffect(() => {
    const node = audio.current;
    if (!node || !track?.previewUrl) return;
    if (node.src !== new URL(track.previewUrl, window.location.href).href) node.src = track.previewUrl;
    if (playing) void node.play().catch(() => undefined);
    else node.pause();
  }, [track?.id, track?.previewUrl, playing]);

  useEffect(() => {
    if (seekRequest == null || !audio.current) return;
    audio.current.currentTime = seekRequest;
    clearSeek();
  }, [seekRequest, clearSeek]);

  if (!track) return null;

  return (
    <>
      <audio ref={audio} preload="none" onEnded={next} />
      <Link
        className="mini"
        to="/$username/$slug"
        params={{ username: `@${track.username}`, slug: track.slug }}
        aria-label={`Now playing ${track.title}`}
      >
        <span className="media"><img src={track.artwork} alt="" className="is-in" /></span>
        <span>
          <strong>{track.title}</strong>
          <em>{track.previewUrl ? track.artist : `${track.artist} · No licensed preview`}</em>
        </span>
        <button
          type="button"
          aria-label={playing ? "Pause" : "Play"}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            toggle();
          }}
        >
          {playing ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
        </button>
      </Link>
    </>
  );
}
