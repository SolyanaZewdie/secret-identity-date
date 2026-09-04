import { supabase } from "../supabase";

/**
 * LELA accounts, couples and pairing.
 *
 * Two modes live side by side:
 *
 * - Members  → Supabase Auth + the `profiles` / `couples` tables. Pairing works
 *              across devices and survives refresh.
 * - Guests   → the original local prototype flow (one device, one phone that
 *              gets handed back and forth). Untouched on purpose.
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
  /** Display name of the other partner (members only). */
  partnerName?: string;
  source: "cloud" | "local";
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
/* Users                                                                      */
/* -------------------------------------------------------------------------- */

/** Guests are the only users that can be reconstructed synchronously. */
export function allUsers(): User[] {
  if (!isBrowser()) return [];
  const currentId = window.localStorage.getItem(DEVICE_KEY);
  if (currentId?.startsWith("gst_")) {
    return [
      { id: currentId, name: "Guest", kind: "guest", createdAt: new Date().toISOString() },
    ];
  }
  return [];
}

/* -------------------------------------------------------------------------- */
/* Local (guest) couple storage                                               */
/* -------------------------------------------------------------------------- */

export function allCouples(): Couple[] {
  return read<Couple[]>(COUPLES_KEY, []).map((c) => ({ ...c, source: "local" }));
}

function putCouple(couple: Couple) {
  write(COUPLES_KEY, [...allCouples().filter((c) => c.id !== couple.id), couple]);
}

/* -------------------------------------------------------------------------- */
/* Supabase profile                                                           */
/* -------------------------------------------------------------------------- */

function metaName(meta: Record<string, unknown> | undefined): string | null {
  const value = meta?.["display_name"];
  return typeof value === "string" && value.trim() ? value : null;
}

export async function getSupabaseUser(): Promise<User | null> {
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, created_at")
    .eq("id", authUser.id)
    .maybeSingle();

  const email = authUser.email ?? null;

  const user: User = {
    id: authUser.id,
    name:
      profile?.display_name ||
      metaName(authUser.user_metadata) ||
      email?.split("@")[0] ||
      "LELA member",
    kind: "member",
    createdAt: profile?.created_at ?? authUser.created_at,
  };

  return email ? { ...user, email } : user;
}

/* -------------------------------------------------------------------------- */
/* Current user                                                               */
/* -------------------------------------------------------------------------- */

export async function currentUserAsync(): Promise<User | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user) return getSupabaseUser();

  return localGuest();
}

function localGuest(): User | null {
  if (!isBrowser()) return null;
  const guestId = window.localStorage.getItem(DEVICE_KEY);
  if (guestId?.startsWith("gst_")) {
    return { id: guestId, name: "Guest", kind: "guest", createdAt: new Date().toISOString() };
  }
  return null;
}

export async function currentUserIdAsync(): Promise<string | null> {
  const user = await currentUserAsync();
  return user?.id ?? null;
}

/** Synchronous helper — resolves guests only. Members use currentUserAsync(). */
export function currentUserId(): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(DEVICE_KEY);
}

/** Synchronous helper — resolves guests only. Members use currentUserAsync(). */
export function currentUser(): User | null {
  return localGuest();
}

export function setCurrentUser(id: string | null) {
  if (!isBrowser()) return;
  if (id) window.localStorage.setItem(DEVICE_KEY, id);
  else window.localStorage.removeItem(DEVICE_KEY);
  notifyChange();
}

/* -------------------------------------------------------------------------- */
/* Auth                                                                       */
/* -------------------------------------------------------------------------- */

export type AuthResult = { ok: true; user: User } | { ok: false; error: string };

export async function signUp(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();

  if (!name) return { ok: false, error: "Tell us what to call you." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return { ok: false, error: "That email doesn't look right." };
  if (input.password.length < 6)
    return { ok: false, error: "Use at least 6 characters for your password." };

  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: { data: { display_name: name } },
  });

  if (error) return { ok: false, error: error.message };
  if (!data.user) return { ok: false, error: "We couldn't create your account." };
  if (!data.session)
    return {
      ok: false,
      error: "Check your email to confirm your account, then sign in.",
    };

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: data.user.id, display_name: name }, { onConflict: "id" });

  if (profileError) return { ok: false, error: profileError.message };

  setCurrentUser(data.user.id);
  notifyChange();

  return {
    ok: true,
    user: { id: data.user.id, name, kind: "member", email, createdAt: data.user.created_at },
  };
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return { ok: false, error: "Enter your email." };
  if (!password) return { ok: false, error: "Enter your password." };

  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (error) return { ok: false, error: error.message };
  if (!data.user) return { ok: false, error: "We couldn't sign you in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.from("profiles").upsert(
      {
        id: data.user.id,
        display_name:
          metaName(data.user.user_metadata) ?? data.user.email?.split("@")[0] ?? "LELA member",
      },
      { onConflict: "id" },
    );
  }

  const user = await getSupabaseUser();
  if (!user)
    return { ok: false, error: "Your account exists, but we couldn't load your profile." };

  setCurrentUser(user.id);
  notifyChange();

  return { ok: true, user };
}

export async function updateDisplayName(name: string): Promise<AuthResult> {
  const clean = name.trim();
  if (!clean) return { ok: false, error: "Tell us what to call you." };

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return { ok: false, error: "You're not signed in." };

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: clean })
    .eq("id", authUser.id);

  if (error) return { ok: false, error: error.message };

  const user = await getSupabaseUser();
  notifyChange();
  return user ? { ok: true, user } : { ok: false, error: "Couldn't reload your profile." };
}

export async function signOut() {
  await supabase.auth.signOut();
  setCurrentUser(null);
  notifyChange();
}

/* -------------------------------------------------------------------------- */
/* Guest                                                                      */
/* -------------------------------------------------------------------------- */

const guestId = () =>
  `gst_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

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

export async function convertGuest(input: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  const me = currentUser();
  if (!me || me.kind !== "guest")
    return { ok: false, error: "Nobody is signed in as a guest on this device." };

  return signUp({ name: input.name.trim() || me.name, email: input.email, password: input.password });
}

/* -------------------------------------------------------------------------- */
/* Couples — shared helpers                                                   */
/* -------------------------------------------------------------------------- */

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const id = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function makeCode(): string {
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return allCouples().some((c) => c.code === out) ? makeCode() : out;
}

export function isExpired(couple: Couple): boolean {
  return Boolean(couple.expiresAt && new Date(couple.expiresAt).getTime() < Date.now());
}

export function slotOf(couple: Couple | null, userId: string | null): Slot | null {
  if (!couple || !userId) return null;
  if (couple.aId === userId) return "A";
  if (couple.bId === userId) return "B";
  return null;
}

export function isConnected(couple: Couple | null): boolean {
  return Boolean(couple && couple.bId && !isExpired(couple));
}

export function partnerOf(couple: Couple | null, userId: string | null): User | null {
  if (!couple || !userId) return null;

  const otherId = couple.aId === userId ? couple.bId : couple.aId;
  if (!otherId) return null;

  if (otherId.startsWith("gst_")) {
    return { id: otherId, name: "Guest", kind: "guest", createdAt: new Date().toISOString() };
  }

  return {
    id: otherId,
    name: couple.partnerName || "Your partner",
    kind: "member",
    createdAt: couple.createdAt,
  };
}

/* -------------------------------------------------------------------------- */
/* Couples — cloud row mapping                                                */
/* -------------------------------------------------------------------------- */

type CoupleRow = {
  id: string;
  code: string;
  a_id: string;
  b_id: string | null;
  created_at: string;
  partner_name?: string | null;
};

function mapCouple(row: CoupleRow): Couple {
  const base: Couple = {
    id: row.id,
    code: row.code,
    aId: row.a_id,
    bId: row.b_id,
    createdAt: row.created_at,
    source: "cloud",
  };
  return row.partner_name ? { ...base, partnerName: row.partner_name } : base;
}

/* -------------------------------------------------------------------------- */
/* Couples — lookup                                                           */
/* -------------------------------------------------------------------------- */

/** Local (guest) couple lookup. Members must use coupleOfAsync(). */
export function coupleOf(userId: string | null | undefined): Couple | null {
  if (!userId) return null;
  return allCouples().find((c) => c.aId === userId || c.bId === userId) ?? null;
}

export async function coupleOfAsync(user: User | null): Promise<Couple | null> {
  if (!user) return null;
  if (user.kind === "guest") return coupleOf(user.id);

  const { data, error } = await supabase.rpc("lela_my_couple");
  if (error || !data || data.length === 0) return null;
  return mapCouple(data[0] as CoupleRow);
}

/* -------------------------------------------------------------------------- */
/* Invite creation                                                            */
/* -------------------------------------------------------------------------- */

export async function createInvite(user?: User | null): Promise<Couple | null> {
  const me = user ?? (await currentUserAsync());
  if (!me) return null;

  if (me.kind === "member") {
    const { data, error } = await supabase.rpc("lela_create_invite");
    if (error || !data || data.length === 0) return null;
    notifyChange();
    return mapCouple(data[0] as CoupleRow);
  }

  const existing = coupleOf(me.id);
  if (existing && !isExpired(existing)) return existing;

  const couple: Couple = {
    id: id("cpl"),
    code: makeCode(),
    aId: me.id,
    bId: null,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + GUEST_TTL_MS).toISOString(),
    source: "local",
  };

  putCouple(couple);
  return couple;
}

export async function refreshInvite(user?: User | null): Promise<Couple | null> {
  const me = user ?? (await currentUserAsync());
  if (!me) return null;

  if (me.kind === "member") {
    const { data, error } = await supabase.rpc("lela_refresh_invite");
    if (error || !data || data.length === 0) return null;
    notifyChange();
    return mapCouple(data[0] as CoupleRow);
  }

  const existing = coupleOf(me.id);
  if (existing) {
    write(COUPLES_KEY, allCouples().filter((c) => c.id !== existing.id));
  }
  return createInvite(me);
}

/* -------------------------------------------------------------------------- */
/* Invite lookup                                                              */
/* -------------------------------------------------------------------------- */

export type InviteLookup =
  | { state: "invalid" }
  | { state: "expired" }
  | { state: "full" }
  | { state: "mine" }
  | { state: "open"; code: string; hostName: string | null };

export async function lookupInvite(rawCode: string, user?: User | null): Promise<InviteLookup> {
  const code = rawCode.trim().toUpperCase();
  const me = user ?? (await currentUserAsync());

  if (me?.kind === "member") {
    const { data, error } = await supabase.rpc("lela_lookup_invite", { p_code: code });
    if (error || !data || data.length === 0) return { state: "invalid" };
    const row = data[0] as { state: string; code: string | null; host_name: string | null };
    if (row.state === "mine") return { state: "mine" };
    if (row.state === "full") return { state: "full" };
    if (row.state === "open")
      return { state: "open", code: row.code ?? code, hostName: row.host_name };
    return { state: "invalid" };
  }

  const couple = allCouples().find((c) => c.code === code);
  if (!couple) return { state: "invalid" };
  if (isExpired(couple)) return { state: "expired" };

  const meId = me?.id ?? currentUserId();
  if (meId && (couple.aId === meId || couple.bId === meId)) return { state: "mine" };
  if (couple.bId) return { state: "full" };

  return { state: "open", code: couple.code, hostName: "Guest" };
}

/* -------------------------------------------------------------------------- */
/* Join couple                                                                */
/* -------------------------------------------------------------------------- */

export type JoinResult = { ok: true; couple: Couple } | { ok: false; error: string };

export async function joinCouple(rawCode: string, user?: User | null): Promise<JoinResult> {
  const me = user ?? (await currentUserAsync());
  if (!me) return { ok: false, error: "Nobody is on this device yet." };

  if (me.kind === "member") {
    const { data, error } = await supabase.rpc("lela_join_couple", {
      p_code: rawCode.trim().toUpperCase(),
    });

    if (error) return { ok: false, error: error.message };

    const row = (data?.[0] ?? null) as { state: string; couple_id: string | null } | null;
    if (!row || row.state === "invalid")
      return { ok: false, error: "That invite doesn't seem to work." };
    if (row.state === "full") return { ok: false, error: "That couple already has two people." };

    const couple = await coupleOfAsync(me);
    notifyChange();
    return couple
      ? { ok: true, couple }
      : { ok: false, error: "We paired you but couldn't load the couple." };
  }

  const found = await lookupInvite(rawCode, me);
  if (found.state === "invalid") return { ok: false, error: "That invite doesn't seem to work." };
  if (found.state === "expired") return { ok: false, error: "This invitation has expired." };
  if (found.state === "full") return { ok: false, error: "That couple already has two people." };

  const existing = coupleOf(me.id);
  if (found.state === "mine")
    return existing
      ? { ok: true, couple: existing }
      : { ok: false, error: "That invite doesn't seem to work." };

  const target = allCouples().find((c) => c.code === found.code);
  if (!target) return { ok: false, error: "That invite doesn't seem to work." };

  if (existing && existing.id !== target.id) await leaveCouple(me);

  const joined: Couple = { ...target, bId: me.id };
  putCouple(joined);
  return { ok: true, couple: joined };
}

/* -------------------------------------------------------------------------- */
/* Leave couple                                                               */
/* -------------------------------------------------------------------------- */

export async function leaveCouple(user?: User | null) {
  const me = user ?? (await currentUserAsync());
  if (!me) return;

  if (me.kind === "member") {
    await supabase.rpc("lela_leave_couple");
    notifyChange();
    return;
  }

  const couple = coupleOf(me.id);
  if (!couple) return;

  const remaining = allCouples().filter((c) => c.id !== couple.id);

  if (couple.aId === me.id && !couple.bId) {
    write(COUPLES_KEY, remaining);
    return;
  }

  if (couple.aId === me.id && couple.bId) {
    write(COUPLES_KEY, [...remaining, { ...couple, aId: couple.bId, bId: null }]);
    return;
  }

  write(COUPLES_KEY, [...remaining, { ...couple, bId: null }]);
}

/* -------------------------------------------------------------------------- */
/* Pairing links                                                              */
/* -------------------------------------------------------------------------- */

export function joinUrl(code: string): string {
  const origin = isBrowser() ? window.location.origin : "https://lela.app";
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
  return window.localStorage.getItem(DEV_KEY) === "1";
}

export function setDevMode(on: boolean) {
  if (!isBrowser()) return;
  if (on) window.localStorage.setItem(DEV_KEY, "1");
  else window.localStorage.removeItem(DEV_KEY);
  notifyChange();
}

/* -------------------------------------------------------------------------- */
/* Reset                                                                      */
/* -------------------------------------------------------------------------- */

export function resetEverything() {
  if (!isBrowser()) return;
  for (const key of [COUPLES_KEY, DEVICE_KEY, "lela.current", "lela.saved", "lela.viewer"]) {
    window.localStorage.removeItem(key);
  }
  notifyChange();
}
