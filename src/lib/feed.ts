export const tracks = [
  { slug: "omo-naija", title: "Omo Naija", artist: "Rexxie", image: "/media/track-rexxie.jpg", duration: "2:56", genre: "Afrobeats" },
  { slug: "pressure", title: "Pressure", artist: "Ayra Starr", image: "/media/track-ayra.jpg", duration: "3:21", genre: "Afrobeats" },
  { slug: "e-no-easy", title: "E No Easy", artist: "Asake", image: "/media/track-asake.jpg", duration: "2:48", genre: "Afrobeats" },
  { slug: "higher", title: "Higher", artist: "Burna Boy", image: "/media/track-burna.jpg", duration: "3:48", genre: "Afrobeats" },
] as const;

export const playlists = [
  { slug: "naija-hits", title: "Naija Hits", count: "50 songs", image: "/media/track-rexxie.jpg" },
  { slug: "party-vibez", title: "Party Vibez", count: "40 songs", image: "/media/concert-benin.jpg" },
  { slug: "chill-vibes", title: "Chill Vibes", count: "35 songs", image: "/media/track-asake.jpg" },
  { slug: "love-rnb", title: "Love & R&B", count: "30 songs", image: "/media/track-ayra.jpg" },
] as const;

export const artists = [
  { slug: "rexxie", name: "Rexxie", image: "/media/artist-rexxie.jpg" },
  { slug: "ayra-starr", name: "Ayra Starr", image: "/media/artist-ayra.jpg" },
  { slug: "asake", name: "Asake", image: "/media/artist-asake.jpg" },
  { slug: "burna-boy", name: "Burna Boy", image: "/media/artist-burna.jpg" },
  { slug: "tems", name: "Tems", image: "/media/artist-tems.jpg" },
] as const;

export const spotlight = {
  title: "Vibez Live Concert 2026",
  when: "Sat, Dec 12, 2026",
  city: "Benin City, Edo",
  tag: "Live Music",
  image: "/media/concert-benin.jpg",
} as const;

export const places = [
  "Benin City, Edo State",
  "Lagos, Lagos State",
  "Abuja, FCT",
  "Port Harcourt, Rivers",
  "Ibadan, Oyo",
  "Enugu, Enugu",
  "Kano, Kano",
  "Abeokuta, Ogun",
  "Calabar, Cross River",
  "Uyo, Akwa Ibom",
] as const;

export const genres = [
  "Afrobeats",
  "Hip-Hop",
  "Amapiano",
  "R&B",
  "Gospel",
  "Pop",
  "Fuji",
  "Highlife",
  "Reggae",
  "Rock",
  "EDM",
  "Other",
] as const;
