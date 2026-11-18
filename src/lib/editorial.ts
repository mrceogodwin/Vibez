export function memberLabel(count: number) {
  const total = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  return `${total.toLocaleString("en-NG")} ${total === 1 ? "member" : "members"}`;
}

const kindLabel: Record<string, string> = {
  music_share: "Playlist",
  podcast_share: "Podcast",
  game_activity: "Live Room",
  event_share: "Event",
  community_update: "Community",
  photo: "Post",
  carousel: "Post",
  text: "Post",
};

export function kindSubtitle(kind: string) {
  return kindLabel[kind] ?? "On Vibez";
}
