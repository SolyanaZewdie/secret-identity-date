import { supabase } from "./supabase";

/**
 * LELA accounts, couples and pairing.
 *
 * Authentication is handled by Supabase.
 * Couples and the prototype pairing layer still use localStorage for now.
 */

export type AccountKind = "member" | "guest";

export type User = {
  id: string;
  name: string;
  kind: AccountKind;
  email?: string;
  createdAt: string;
};

export type Couple = {
  id: string;
  code: string;
  aId: string;
  bId: string | null;
  createdAt: string;
  expiresAt?: string;
};

export type Slot = "A" | "B";

const COUPLES_KEY = "lela.couples";
const DEVICE_KEY = "lela.device";
const DEV_KEY = "lela.devmode";

const GUEST_TTL_MS = 1000 * 60 * 60 * 24 * 3;

const isBrowser = () => typeof window !== "undefined";

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* prototype degrades gracefully */
  }

  window.dispatchEvent(new Event("lela:change"));
}

export function notifyChange() {
  if (isBrowser()) {
    window.dispatchEvent(new Event("lela:change"));
  }
}

/* ---------------- local prototype collections ---------------- */

export function allCouples(): Couple[] {
  return read<Couple[]>(COUPLES_KEY, []);
}

function putCouple(couple: Couple) {
  const next = [
    ...allCouples().filter((c) => c.id !== couple.id),
    couple,
  ];

  write(COUPLES_KEY, next);
}

/* ---------------- Supabase user ---------------- */

/**
 * Converts the Supabase auth user + profile into the User shape
 * expected by the rest of the LELA application.
 */
async function getSupabaseUser(): Promise<User | null> {
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name, created_at")
    .eq("id", authUser.id)
    .maybeSingle();

  if (error) {
    console.error("Failed to load profile:", error);
  }

  return {
    id: authUser.id,
    name:
      profile?.display_name ||
      authUser.user_metadata?.display_name ||
      authUser.email?.split("@")[0] ||
      "LELA member",
    kind: "member",
    email: authUser.email ?? undefined,
    createdAt: profile?.created_at ?? authUser.created_at,
  };
}

/**
 * Returns the currently authenticated Supabase user.
 *
 * Guests still use the prototype localStorage system.
 */
export async function currentUserAsync(): Promise<User | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user) {
    return getSupabaseUser();
  }

  if (isBrowser()) {
    const guestId = window.localStorage.getItem(DEVICE_KEY);

    if (guestId?.startsWith("gst_")) {
      return {
        id: guestId,
        name: "Guest",
        kind: "guest",
        createdAt: new Date().toISOString(),
      };
    }
  }

  return null;
}

/**
 * Synchronous compatibility helper.
 *
 * This is retained temporarily because the existing couple prototype
 * expects a synchronous current user ID.
 */
export function currentUserId(): string | null {
  if (!isBrowser()) return null;

  return window.localStorage.getItem(DEVICE_KEY);
}

/**
 * Synchronous compatibility helper.
 *
 * Supabase-authenticated users are represented by DEVICE_KEY after
 * successful authentication. Guest users continue to use the same key.
 */
export function currentUser(): User | null {
  if (!isBrowser()) return null;

  const id = window.localStorage.getItem(DEVICE_KEY);

  if (!id) return null;

  if (id.startsWith("gst_")) {
    return {
      id,
      name: "Guest",
      kind: "guest",
      createdAt: new Date().toISOString(),
    };
  }

  return null;
}

export function setCurrentUser(id: string | null) {
  if (!isBrowser()) return;

  if (id) {
    window.localStorage.setItem(DEVICE_KEY, id);
  } else {
    window.localStorage.removeItem(DEVICE_KEY);
  }

  notifyChange();
}

/* ---------------- sign up / sign in ---------------- */

export type AuthResult =
  | { ok: true; user: User }
  | { ok: false; error: string };

export async function signUp(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();

  if (!name) {
    return {
      ok: false,
      error: "Tell us what to call you.",
    };
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return {
      ok: false,
      error: "That email doesn't look right.",
    };
  }

  if (input.password.length < 6) {
    return {
      ok: false,
      error: "Use at least 6 characters for your password.",
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      data: {
        display_name: name,
      },
    },
  });

  if (error) {
    return {
      ok: false,
      error: error.message,
    };
  }

  if (!data.user) {
    return {
      ok: false,
      error: "We couldn't create your account.",
    };
  }

  /**
   * Create the user's profile.
   *
   * We do this here instead of relying on a database trigger,
   * because the profiles table already exists.
   */
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({
      id: data.user.id,
      display_name: name,
    });

  if (profileError) {
    return {
      ok: false,
      error: profileError.message,
    };
  }

  const user: User = {
    id: data.user.id,
    name,
    kind: "member",
    email,
    createdAt: data.user.created_at,
  };

  setCurrentUser(user.id);

  return {
    ok: true,
    user,
  };
}

export async function signIn(
  email: string,
  password: string,
): Promise<AuthResult> {
  const cleanEmail = email.trim().toLowerCase();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (error) {
    return {
      ok: false,
      error: error.message,
    };
  }

  if (!data.user) {
    return {
      ok: false,
      error: "We couldn't sign you in.",
    };
  }

  const user = await getSupabaseUser();

  if (!user) {
    return {
      ok: false,
      error: "Your account exists, but we couldn't load your profile.",
    };
  }

  setCurrentUser(user.id);

  return {
    ok: true,
    user,
  };
}

export async function signOut() {
  await supabase.auth.signOut();
  setCurrentUser(null);
}

/* ---------------- guest ---------------- */

const guestId = () =>
  `gst_${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}`;

export function createGuest(name = "Guest"): User {
  const user: User = {
    id: guestId(),
    name: name.trim() || "Guest",
    kind: "guest",
    createdAt: new Date().toISOString(),
  };

  setCurrentUser(user.id);

  return user;
}

/**
 * Turns the signed-in guest into a member.
 *
 * This now creates a real Supabase account instead of storing
 * the password in localStorage.
 */
export async function convertGuest(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  const me = currentUser();

  if (!me || me.kind !== "guest") {
    return {
      ok: false,
      error: "Nobody is signed in as a guest on this device.",
    };
  }

  return signUp({
    name: input.name.trim() || me.name,
    email: input.email,
    password: input.password,
  });
}

/* ---------------- couples & pairing ---------------- */

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const id = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}`;

function makeCode(): string {
  let out = "";

  for (let i = 0; i < 6; i++) {
    out +=
      CODE_ALPHABET[
        Math.floor(Math.random() * CODE_ALPHABET.length)
      ];
  }

  const taken = allCouples().some((c) => c.code === out);

  return taken ? makeCode() : out;
}

export function coupleOf(
  userId: string | null | undefined,
): Couple | null {
  if (!userId) return null;

  return (
    allCouples().find(
      (c) => c.aId === userId || c.bId === userId,
    ) ?? null
  );
}

export function currentCouple(): Couple | null {
  return coupleOf(currentUserId());
}

export function isExpired(couple: Couple): boolean {
  return Boolean(
    couple.expiresAt &&
      new Date(couple.expiresAt).getTime() < Date.now(),
  );
}

export function slotOf(
  couple: Couple | null,
  userId: string | null,
): Slot | null {
  if (!couple || !userId) return null;

  if (couple.aId === userId) return "A";

  if (couple.bId === userId) return "B";

  return null;
}

/**
 * Creates (or reuses) the couple invitation for the current user.
 */
export function createInvite(): Couple | null {
  const me = currentUser();

  if (!me) return null;

  const existing = coupleOf(me.id);

  if (existing && !isExpired(existing)) {
    return existing;
  }

  const couple: Couple = {
    id: id("cpl"),
    code: makeCode(),
    aId: me.id,
    bId: null,
    createdAt: new Date().toISOString(),
    ...(me.kind === "guest"
      ? {
          expiresAt: new Date(
            Date.now() + GUEST_TTL_MS,
          ).toISOString(),
        }
      : {}),
  };

  putCouple(couple);

  return couple;
}

export function refreshInvite(): Couple | null {
  const me = currentUser();

  if (!me) return null;

  const existing = coupleOf(me.id);

  if (existing) {
    write(
      COUPLES_KEY,
      allCouples().filter(
        (c) => c.id !== existing.id,
      ),
    );
  }

  return createInvite();
}

export type InviteLookup =
  | { state: "invalid" }
  | { state: "expired"; couple: Couple }
  | { state: "full"; couple: Couple }
  | { state: "mine"; couple: Couple }
  | {
      state: "open";
      couple: Couple;
      host: User | null;
    };

export function lookupInvite(
  rawCode: string,
): InviteLookup {
  const code = rawCode.trim().toUpperCase();

  const couple = allCouples().find(
    (c) => c.code === code,
  );

  if (!couple) {
    return { state: "invalid" };
  }

  if (isExpired(couple)) {
    return {
      state: "expired",
      couple,
    };
  }

  const meId = currentUserId();

  if (
    meId &&
    (couple.aId === meId || couple.bId === meId)
  ) {
    return {
      state: "mine",
      couple,
    };
  }

  if (couple.bId) {
    return {
      state: "full",
      couple,
    };
  }

  return {
    state: "open",
    couple,
    host: null,
  };
}

export type JoinResult =
  | { ok: true; couple: Couple }
  | { ok: false; error: string };

export function joinCouple(
  rawCode: string,
): JoinResult {
  const me = currentUser();

  if (!me) {
    return {
      ok: false,
      error: "Nobody is on this device yet.",
    };
  }

  const found = lookupInvite(rawCode);

  if (found.state === "invalid") {
    return {
      ok: false,
      error: "That invite doesn't seem to work.",
    };
  }

  if (found.state === "expired") {
    return {
      ok: false,
      error: "This invitation has expired.",
    };
  }

  if (found.state === "full") {
    return {
      ok: false,
      error: "That couple already has two people.",
    };
  }

  if (found.state === "mine") {
    return {
      ok: true,
      couple: found.couple,
    };
  }

  const previous = coupleOf(me.id);

  if (
    previous &&
    previous.id !== found.couple.id
  ) {
    leaveCouple();
  }

  const joined: Couple = {
    ...found.couple,
    bId: me.id,
  };

  putCouple(joined);

  return {
    ok: true,
    couple: joined,
  };
}

export function partnerOf(
  couple: Couple | null,
  userId: string | null,
): User | null {
  if (!couple || !userId) return null;

  const otherId =
    couple.aId === userId
      ? couple.bId
      : couple.aId;

  if (!otherId) return null;

  if (otherId.startsWith("gst_")) {
    return {
      id: otherId,
      name: "Guest",
      kind: "guest",
      createdAt: new Date().toISOString(),
    };
  }

  return null;
}

export function isConnected(
  couple: Couple | null,
): boolean {
  return Boolean(
    couple &&
      couple.bId &&
      !isExpired(couple),
  );
}

export function leaveCouple() {
  const me = currentUserId();
  const couple = coupleOf(me);

  if (!couple || !me) return;

  const remaining = allCouples().filter(
    (c) => c.id !== couple.id,
  );

  if (couple.aId === me && !couple.bId) {
    write(COUPLES_KEY, remaining);
    return;
  }

  if (couple.aId === me && couple.bId) {
    write(COUPLES_KEY, [
      ...remaining,
      {
        ...couple,
        aId: couple.bId,
        bId: null,
      },
    ]);

    return;
  }

  write(COUPLES_KEY, [
    ...remaining,
    {
      ...couple,
      bId: null,
    },
  ]);
}

/* ---------------- pairing links ---------------- */

export function joinUrl(code: string): string {
  const origin = isBrowser()
    ? window.location.origin
    : "https://lela.app";

  return `${origin}/join/${code}`;
}

export function inviteMessage(code: string): string {
  return `I made us a LELA date. Join me — we each get a secret character and find out at the table. ${joinUrl(code)} (code ${code})`;
}

/* ---------------- prototype device switcher ---------------- */

export function devModeEnabled(): boolean {
  if (!isBrowser()) return false;

  return (
    window.localStorage.getItem(DEV_KEY) === "1"
  );
}

export function setDevMode(on: boolean) {
  if (!isBrowser()) return;

  if (on) {
    window.localStorage.setItem(DEV_KEY, "1");
  } else {
    window.localStorage.removeItem(DEV_KEY);
  }

  notifyChange();
}

export function resetEverything() {
  if (!isBrowser()) return;

  for (const key of [
    COUPLES_KEY,
    DEVICE_KEY,
    "lela.current",
    "lela.saved",
    "lela.viewer",
  ]) {
    window.localStorage.removeItem(key);
  }

  notifyChange();
}
