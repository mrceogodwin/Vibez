const editorialArt = {
  "editorial/hero-naija.webp": require("../../assets/images/editorial/hero-naija-960.webp"),
  "editorial/hero-rooms.webp": require("../../assets/images/editorial/weekend-games-960.webp"),
  "editorial/hero-fest.webp": require("../../assets/images/editorial/vibez-fest-960.webp"),
  "editorial/afrobeats.webp": require("../../assets/images/editorial/afrobeats-480.webp"),
  "editorial/vibez-cast.webp": require("../../assets/images/editorial/vibez-cast-480.webp"),
  "editorial/weekend-games.webp": require("../../assets/images/editorial/weekend-games-480.webp"),
  "editorial/vibez-fest.webp": require("../../assets/images/editorial/vibez-fest-480.webp"),
  "editorial/music-lovers.webp": require("../../assets/images/editorial/music-lovers-480.webp"),
  "editorial/silhouettes.webp": require("../../assets/images/editorial/silhouettes-480.webp"),
} as const;

type EditorialKey = keyof typeof editorialArt;

export function artFor(key: string | null | undefined) {
  if (!key) return null;
  return key in editorialArt ? editorialArt[key as EditorialKey] : null;
}
