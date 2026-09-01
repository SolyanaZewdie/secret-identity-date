import { supabase } from "../supabase";

/**
 * LELA accounts, couples and pairing.
 *
 * Authentication is handled by Supabase Auth.
 *
 * Member profiles are stored in the `profiles` table.
 *
 * Guests remain local-only for now.
 *
 * NOTE:
 * Couples are still using localStorage in this stage of the migration.
 * We will move couples to Supabase after authentication is working correctly.
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

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

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
    /* Storage unavailable — prototype degrades gracefully. */
  }

  notifyChange();
}

export function notifyChange() {
  if (!isBrowser()) return;

  window.dispatchEvent(new Event("lela:change"));
}

/* -------------------------------------------------------------------------- */
/* Local prototype couple storage                                             */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Supabase profile                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Loads the currently authenticated Supabase user and their LELA profile.
 */
export async function getSupabaseUser(): Promise<User | null> {
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name, created_at")
    .eq("id", authUser.id)
    .maybeSingle();

  if (profileError) {
    console.error("Failed to load profile:", profileError);
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

/* -------------------------------------------------------------------------- */
/* Current user                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Asynchronously gets the real current user.
 *
 * Supabase Auth is the source of truth for members.
 * Guests continue to use localStorage.
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
 * Returns the current Supabase auth user ID when available.
 *
 * This function is intentionally asynchronous because Supabase Auth
 * is asynchronous.
 */
export async function currentUserIdAsync(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return user.id;
  }

  if (isBrowser()) {
    const guestId = window.localStorage.getItem(DEVICE_KEY);

    if (guestId?.startsWith("gst_")) {
      return guestId;
    }
  }

  return null;
}

/**
 * Temporary synchronous compatibility helper.
 *
 * Existing prototype couple code still expects a synchronous user ID.
 *
 * For Supabase members, the ID is mirrored into DEVICE_KEY after
 * successful authentication. Supabase remains the real source of truth.
 */
export function currentUserId(): string | null {
  if (!isBrowser()) return null;

  return window.localStorage.getItem(DEVICE_KEY);
}

/**
 * Temporary synchronous compatibility helper.
 *
 * Guests can be returned synchronously.
 * Supabase members should use currentUserAsync().
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

/**
 * Mirrors the authenticated user ID locally for the existing prototype
 * couple layer.
 *
 * This does NOT replace Supabase Auth.
 */
export function setCurrentUser(id: string | null) {
  if (!isBrowser()) return;

  if (id) {
    window.localStorage.setItem(DEVICE_KEY, id);
  } else {
    window.localStorage.removeItem(DEVICE_KEY);
  }

  notifyChange();
}

/* -------------------------------------------------------------------------- */
/* Sign up                                                                    */
/* -------------------------------------------------------------------------- */

export type AuthResult =
  | {
      ok: true;
      user: User;
    }
  | {
      ok: false;
      error: string;
    };

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

  /*
   * The profiles table already exists.
   *
   * We create/update the profile here rather than creating another
   * database table or trigger.
   */
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: data.user.id,
        display_name: name,
      },
      {
        onConflict: "id",
      },
    );

  if (profileError) {
    console.error("Failed to create profile:", profileError);

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

  notifyChange();

  return {
    ok: true,
    user,
  };
}

/* -------------------------------------------------------------------------- */
/* Sign in                                                                    */
/* -------------------------------------------------------------------------- */

export async function signIn(
  email: string,
  password: string,
): Promise<AuthResult> {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail) {
    return {
      ok: false,
      error: "Enter your email.",
    };
  }

  if (!password) {
    return {
      ok: false,
      error: "Enter your password.",
    };
  }

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

  /*
   * Make sure a profile exists.
   *
   * This also makes the application resilient if a user was created
   * before the profile creation logic existed.
   */
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, created_at")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile) {
    const displayName =
      data.user.user_metadata?.display_name ||
      data.user.email?.split("@")[0] ||
      "LELA member";

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: data.user.id,
          display_name: displayName,
        },
        {
          onConflict: "id",
        },
      );

    if (profileError) {
      console.error("Failed to create missing profile:", profileError);
    }
  }

  const user = await getSupabaseUser();

  if (!user) {
    return {
      ok: false,
      error: "Your account exists, but we couldn't load your profile.",
    };
  }

  setCurrentUser(user.id);

  notifyChange();

  return {
    ok: true,
    user,
  };
}

/* -------------------------------------------------------------------------- */
/* Sign out                                                                   */
/* -------------------------------------------------------------------------- */

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Supabase sign out failed:", error);
  }

  setCurrentUser(null);

  notifyChange();
}

/* -------------------------------------------------------------------------- */
/* Guest                                                                      */
/* -------------------------------------------------------------------------- */

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
 * Converts the local guest into a real Supabase member account.
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

/* -------------------------------------------------------------------------- */
/* Couples                                                                    */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Invite creation                                                            */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Invite lookup                                                              */
/* -------------------------------------------------------------------------- */

export type InviteLookup =
  | {
      state: "invalid";
    }
  | {
      state: "expired";
      couple: Couple;
    }
  | {
      state: "full";
      couple: Couple;
    }
  | {
      state: "mine";
      couple: Couple;
    }
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
    return {
      state: "invalid",
    };
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

  /*
   * Host information is optional because the host may now be a
   * Supabase-authenticated member rather than a localStorage user.
   */
  let host: User | null = null;

  if (couple.aId.startsWith("gst_")) {
    host = {
      id: couple.aId,
      name: "Guest",
      kind: "guest",
      createdAt: new Date().toISOString(),
    };
  }

  return {
    state: "open",
    couple,
    host,
  };
}

/* -------------------------------------------------------------------------- */
/* Join couple                                                                */
/* -------------------------------------------------------------------------- */

export type JoinResult =
  | {
      ok: true;
      couple: Couple;
    }
  | {
      ok: false;
      error: string;
    };

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

/* -------------------------------------------------------------------------- */
/* Partner                                                                    */
/* -------------------------------------------------------------------------- */

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

  /*
   * Supabase members cannot be synchronously loaded here.
   *
   * The useAccount hook will handle the authenticated member
   * separately in the next migration step.
   */
  return null;
}

/* -------------------------------------------------------------------------- */
/* Connection state                                                           */
/* -------------------------------------------------------------------------- */

export function isConnected(
  couple: Couple | null,
): boolean {
  return Boolean(
    couple &&
      couple.bId &&
      !isExpired(couple),
  );
}

/* -------------------------------------------------------------------------- */
/* Leave couple                                                               */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Pairing links                                                              */
/* -------------------------------------------------------------------------- */

export function joinUrl(code: string): string {
  const origin = isBrowser()
    ? window.location.origin
    : "https://lela.app";

  return `${origin}/join/${code}`;
}

export function inviteMessage(code: string): string {
  return `I made us a LELA date. Join me — we each get a secret character and find out at the table. ${joinUrl(code)} (code ${code})`;
}

/* -------------------------------------------------------------------------- */
/* Prototype device switcher                                                  */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Reset                                                                      */
/* -------------------------------------------------------------------------- */

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
