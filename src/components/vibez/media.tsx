import { useState } from "react";

export function Media({ src, alt = "", rounded = false }: { src?: string | null; alt?: string; rounded?: boolean }) {
  const [failed, setFailed] = useState(!src);
  const letter = (alt || "V").trim().charAt(0).toUpperCase();
  return (
    <span className="media" style={rounded ? { borderRadius: "inherit" } : undefined}>
      {failed ? <span className="media-fallback">{letter}</span> : (
        <img src={src ?? undefined} alt={alt} onError={() => setFailed(true)} />
      )}
    </span>
  );
}

export function Sample({ on = false }: { on?: boolean }) {
  if (!on) return null;
  return <em className="pill sample">Sample</em>;
}
