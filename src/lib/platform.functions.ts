import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";

async function platform() {
  return import("@/lib/platform/data.server");
}

async function caller() {
  const { getSessionUser } = await import("@/lib/auth/verify.server");
  return getSessionUser();
}

export const loadHome = createServerFn({ method: "GET" }).handler(async () => {
  const api = await platform();
  return api.loadHome();
});

export const loadDiscover = createServerFn({ method: "GET" })
  .validator((input: { q?: string }) => ({ q: input?.q ?? "" }))
  .handler(async ({ data }) => {
    const api = await platform();
    return api.loadDiscover(data.q);
  });

export const loadArtistPage = createServerFn({ method: "GET" })
  .validator((input: { username: string }) => input)
  .handler(async ({ data }) => {
    const api = await platform();
    return api.loadArtist(data.username);
  });

export const loadSongPage = createServerFn({ method: "GET" })
  .validator((input: { username: string; slug: string }) => input)
  .handler(async ({ data }) => {
    const api = await platform();
    return api.loadSong(data.username, data.slug);
  });

export const loadEventsPage = createServerFn({ method: "GET" }).handler(async () => {
  const api = await platform();
  return api.loadEvents();
});

export const loadSession = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const api = await platform();
    const user = await caller();
    return api.profileBundle(context.userId, user?.email);
  });

export const savePersonalisation = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: {
    roles: string[];
    genres: string[];
    city: string;
    state?: string;
    country?: string;
    interests?: string[];
    eventInterests?: string[];
  }) => input)
  .handler(async ({ data, context }) => {
    const api = await platform();
    return api.savePersonalisation(context.userId, {
      roles: data.roles,
      genres: data.genres,
      city: data.city,
      state: data.state ?? "",
      country: data.country ?? "Nigeria",
      interests: data.interests ?? [],
      eventInterests: data.eventInterests ?? [],
    });
  });

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: {
    displayName: string;
    username: string;
    bio: string;
    city: string;
    state: string;
    country: string;
    avatarUrl: string;
  }) => input)
  .handler(async ({ data, context }) => {
    const api = await platform();
    return api.updateProfile(context.userId, data);
  });

export const sendVerification = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { email: string }) => input)
  .handler(async ({ data }) => {
    const api = await platform();
    return api.requestCode(data.email, "verify");
  });

export const confirmVerification = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { email: string; code: string }) => input)
  .handler(async ({ data, context }) => {
    const api = await platform();
    return api.confirmCode(data.email, "verify", data.code, context.userId);
  });

export const sendReset = createServerFn({ method: "POST" })
  .validator((input: { email: string }) => input)
  .handler(async ({ data }) => {
    const api = await platform();
    await api.assertRate(`reset-ip:${data.email.trim().toLowerCase()}`, 5, 60 * 60 * 1000);
    return api.requestCode(data.email, "reset");
  });

export const confirmReset = createServerFn({ method: "POST" })
  .validator((input: { email: string; code: string; password: string }) => input)
  .handler(async ({ data }) => {
    const api = await platform();
    return api.resetPassword(data.email, data.code, data.password);
  });

export const guardLogin = createServerFn({ method: "POST" })
  .validator((input: { email: string }) => input)
  .handler(async ({ data }) => {
    const api = await platform();
    await api.assertRate(`login:${data.email.trim().toLowerCase()}`, 8, 15 * 60 * 1000);
    return { ok: true as const };
  });

export const saveNotificationPrefs = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { email: boolean; releases: boolean; events: boolean; campaigns: boolean }) => input)
  .handler(async ({ data, context }) => {
    const api = await platform();
    return api.setNotifications(context.userId, data);
  });

export const askDeletion = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const api = await platform();
    return api.requestDeletion(context.userId);
  });

export const followArtist = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { username: string }) => input)
  .handler(async ({ data, context }) => {
    const api = await platform();
    return api.toggleFollow(context.userId, data.username);
  });

export const saveTrack = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { releaseId: string }) => input)
  .handler(async ({ data, context }) => {
    const api = await platform();
    return api.toggleSaveTrack(context.userId, data.releaseId);
  });

export const saveEvent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { slug: string }) => input)
  .handler(async ({ data, context }) => {
    const api = await platform();
    return api.toggleSaveEvent(context.userId, data.slug);
  });

export const loadLibrary = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const api = await platform();
    return api.myLibrary(context.userId);
  });

export const loadActivity = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const api = await platform();
    return api.listNotifications(context.userId);
  });

export const readActivity = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const api = await platform();
    return api.markNotificationsRead(context.userId);
  });

export const becomeOrganiser = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { displayName: string }) => input)
  .handler(async ({ data, context }) => {
    const api = await platform();
    return api.applyOrganiser(context.userId, data.displayName);
  });

export const submitEvent = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: {
    title: string;
    category: string;
    city: string;
    venue: string;
    address: string;
    start: string;
    end: string;
    description: string;
    cover: string;
    ageNote: string;
    refundPolicy: string;
    tickets: { name: string; priceNaira: number; quantity: number; detail: string }[];
  }) => input)
  .handler(async ({ data, context }) => {
    const api = await platform();
    return api.createEventDraft(context.userId, data);
  });

export const beginCheckout = createServerFn({ method: "POST" })
  .validator((input: {
    eventSlug: string;
    tierCode: string;
    qty: number;
    buyerName: string;
    buyerEmail: string;
    buyerPhone: string;
  }) => input)
  .handler(async ({ data }) => {
    const api = await platform();
    const user = await caller();
    return api.startCheckout(user?.id ?? null, data);
  });

export const verifyPayment = createServerFn({ method: "POST" })
  .validator((input: { reference: string }) => input)
  .handler(async ({ data }) => {
    const api = await platform();
    return api.fulfillReference(data.reference);
  });

export const loadTickets = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const api = await platform();
    return api.myTickets(context.userId);
  });

export const loadTicket = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: { code: string }) => input)
  .handler(async ({ data, context }) => {
    const api = await platform();
    return api.ticketDetail(context.userId, data.code);
  });

export const checkInTicket = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { token: string; eventSlug: string }) => input)
  .handler(async ({ data, context }) => {
    const api = await platform();
    return api.scanTicket(context.userId, data.token, data.eventSlug);
  });

export const submitRelease = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: {
    artistName: string;
    title: string;
    genre: string;
    listeningUrl: string;
    artworkUrl: string;
    description: string;
    placementCode: string;
  }) => input)
  .handler(async ({ data, context }) => {
    const api = await platform();
    return api.submitMusic(context.userId, data);
  });

export const loadStudio = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const api = await platform();
    return api.studioData(context.userId);
  });

export const loadCommunities = createServerFn({ method: "GET" }).handler(async () => {
  const api = await platform();
  return api.communityBoard();
});

export const submitCommunity = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: {
    name: string;
    description: string;
    category: string;
    city: string;
    platform: string;
    audience: string;
    priceNaira: number;
  }) => input)
  .handler(async ({ data, context }) => {
    const api = await platform();
    return api.applyCommunity(context.userId, data);
  });

export const submitPush = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { title: string; listeningUrl: string; note: string; communityIds: string[] }) => input)
  .handler(async ({ data, context }) => {
    const api = await platform();
    return api.createCommunityCampaign(context.userId, data);
  });

export const loadMyCommunity = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const api = await platform();
    return api.myCommunity(context.userId);
  });

export const answerInvite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string; accept: boolean }) => input)
  .handler(async ({ data, context }) => {
    const api = await platform();
    return api.respondAssignment(context.userId, data.id, data.accept);
  });

export const sendEvidence = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string; note: string; url: string }) => input)
  .handler(async ({ data, context }) => {
    const api = await platform();
    return api.submitEvidence(context.userId, data.id, data.note, data.url);
  });

export const loadAdInventory = createServerFn({ method: "GET" }).handler(async () => {
  const api = await platform();
  return api.adInventory();
});

export const submitAd = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: {
    name: string;
    objective: string;
    placement: string;
    headline: string;
    body: string;
    imageUrl: string;
    destinationUrl: string;
    startsOn: string;
    endsOn: string;
    businessName: string;
  }) => input)
  .handler(async ({ data, context }) => {
    const api = await platform();
    return api.createAd(context.userId, data);
  });

export const loadMyAds = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const api = await platform();
    return api.myAds(context.userId);
  });

export const trackAd = createServerFn({ method: "POST" })
  .validator((input: { id: string; kind: "impression" | "click" }) => input)
  .handler(async ({ data }) => {
    const api = await platform();
    return api.recordAdEvent(data.id, data.kind);
  });

export const loadOrganiser = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const api = await platform();
    return api.organiserHome(context.userId);
  });

export const loadControl = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const api = await platform();
    const user = await caller();
    return api.controlOverview(context.userId, user?.email);
  });

export const runControl = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { action: string; target: string; note?: string }) => input)
  .handler(async ({ data, context }) => {
    const api = await platform();
    const user = await caller();
    return api.controlAct(context.userId, user?.email ?? null, data.action, data.target, data.note ?? "");
  });
