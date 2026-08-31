/**
 * LELA accounts, couples and pairing — prototype layer.
 *
 * Everything lives in localStorage so the whole two-device flow can be
 * simulated in one browser. The shapes below mirror what a real backend
 * would store, so this can be swapped for a service later:
 *
 *   User    { id, name, kind, email? }
 *   Couple  { id, code, aId, bId, createdAt, expiresAt? }
 *   Date    -> see session.ts (DateSession, carries coupleId)
 *   PrivateCharacterAssignment -> DateSession.A / DateSession.B, only ever
 *   read for the slot belonging to the signed-in user.
 */

export type AccountKind = "member" | "guest";

export type User = {
  id: string;
  name: string;
  kind: AccountKind;
  email?: string;
  password?: string;
  photo?: string;
  createdAt: string;
};

export type Couple = {
  id: string;
  code: string;
  aId: string;
  bId: string | null;
  createdAt: string;
  /** Guest couples are temporary. */
  expiresAt?: string;
};

export type Slot = "A" | "B";

const USERS_KEY = "lela.users";
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
  if (isBrowser()) window.dispatchEvent(new Event("lela:change"));
}

/* ---------------- collections ---------------- */

export function allUsers(): User[] {
  return read<User[]>(USERS_KEY, []);
}

export function allCouples(): Couple[] {
  return read<Couple[]>(COUPLES_KEY, []);
}

function putUser(user: User) {
  const next = [...allUsers().filter((u) => u.id !== user.id), user];
  write(USERS_KEY, next);
}

function putCouple(couple: Couple) {
  const next = [...allCouples().filter((c) => c.id !== couple.id), couple];
  write(COUPLES_KEY, next);
}

export function getUser(id: string | null): User | null {
  if (!id) return null;
  return allUsers().find((u) => u.id === id) ?? null;
}

/* ---------------- device session (simulated sign-in) ---------------- */

export function currentUserId(): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(DEVICE_KEY);
}

export function currentUser(): User | null {
  return getUser(currentUserId());
}

export function setCurrentUser(id: string | null) {
  if (!isBrowser()) return;
  if (id) window.localStorage.setItem(DEVICE_KEY, id);
  else window.localStorage.removeItem(DEVICE_KEY);
  notifyChange();
}

export function signOut() {
  setCurrentUser(null);
}

/* ---------------- sign up / in ---------------- */

const id = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export type AuthResult = { ok: true; user: User } | { ok: false; error: string };

export function signUp(input: {
  name: string;
  email: string;
  password: string;
  photo?: string;
}): AuthResult {
  const email = input.email.trim().toLowerCase();
  if (!input.name.trim()) return { ok: false, error: "Tell us what to call you." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return { ok: false, error: "That email doesn't look right." };
  if (input.password.length < 6)
    return { ok: false, error: "Use at least 6 characters for your password." };
  if (allUsers().some((u) => u.email === email))
    return { ok: false, error: "Someone is already here with that email." };

  const user: User = {
    id: id("usr"),
    name: input.name.trim(),
    kind: "member",
    email,
    password: input.password,
    createdAt: new Date().toISOString(),
    ...(input.photo ? { photo: input.photo } : {}),
  };
  putUser(user);
  setCurrentUser(user.id);
  return { ok: true, user };
}

export function signIn(email: string, password: string): AuthResult {
  const found = allUsers().find(
    (u) => u.kind === "member" && u.email === email.trim().toLowerCase(),
  );
  if (!found) return { ok: false, error: "We don't know that email yet." };
  if (found.password !== password) return { ok: false, error: "That password doesn't match." };
  setCurrentUser(found.id);
  return { ok: true, user: found };
}

export function createGuest(name = "Guest"): User {
  const user: User = {
    id: id("gst"),
    name: name.trim() || "Guest",
    kind: "guest",
    createdAt: new Date().toISOString(),
  };
  putUser(user);
  setCurrentUser(user.id);
  return user;
}

/** Turns the signed-in guest into a member, keeping couple + date history. */
export function convertGuest(input: {
  name: string;
  email: string;
  password: string;
}): AuthResult {
  const me = currentUser();
  if (!me) return { ok: false, error: "Nobody is signed in on this device." };
  const email = input.email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return { ok: false, error: "That email doesn't look right." };
  if (input.password.length < 6)
    return { ok: false, error: "Use at least 6 characters for your password." };
  if (allUsers().some((u) => u.id !== me.id && u.email === email))
    return { ok: false, error: "Someone is already here with that email." };

  const upgraded: User = {
    ...me,
    name: input.name.trim() || me.name,
    kind: "member",
    email,
    password: input.password,
  };
  putUser(upgraded);

  // A converted member makes the couple permanent.
  const couple = coupleOf(upgraded.id);
  if (couple && couple.expiresAt) {
    const { expiresAt: _drop, ...permanent } = couple;
    putCouple(permanent);
  }
  setCurrentUser(upgraded.id);
  return { ok: true, user: upgraded };
}

/* ---------------- couples & pairing ---------------- */

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function makeCode(): string {
  let out = "";
  for (let i = 0; i < 6; i++)
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  const taken = allCouples().some((c) => c.code === out);
  return taken ? makeCode() : out;
}

export function coupleOf(userId: string | null | undefined): Couple | null {
  if (!userId) return null;
  return allCouples().find((c) => c.aId === userId || c.bId === userId) ?? null;
}

export function currentCouple(): Couple | null {
  return coupleOf(currentUserId());
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

/** Creates (or reuses) the couple invitation for the signed-in user. */
export function createInvite(): Couple | null {
  const me = currentUser();
  if (!me) return null;
  const existing = coupleOf(me.id);
  if (existing && !isExpired(existing)) return existing;

  const couple: Couple = {
    id: id("cpl"),
    code: makeCode(),
    aId: me.id,
    bId: null,
    createdAt: new Date().toISOString(),
    ...(me.kind === "guest"
      ? { expiresAt: new Date(Date.now() + GUEST_TTL_MS).toISOString() }
      : {}),
  };
  putCouple(couple);
  return couple;
}

export function refreshInvite(): Couple | null {
  const me = currentUser();
  if (!me) return null;
  const existing = coupleOf(me.id);
  if (existing) write(COUPLES_KEY, allCouples().filter((c) => c.id !== existing.id));
  return createInvite();
}

export type InviteLookup =
  | { state: "invalid" }
  | { state: "expired"; couple: Couple }
  | { state: "full"; couple: Couple }
  | { state: "mine"; couple: Couple }
  | { state: "open"; couple: Couple; host: User | null };

export function lookupInvite(rawCode: string): InviteLookup {
  const code = rawCode.trim().toUpperCase();
  const couple = allCouples().find((c) => c.code === code);
  if (!couple) return { state: "invalid" };
  if (isExpired(couple)) return { state: "expired", couple };
  const meId = currentUserId();
  if (meId && (couple.aId === meId || couple.bId === meId)) return { state: "mine", couple };
  if (couple.bId) return { state: "full", couple };
  return { state: "open", couple, host: getUser(couple.aId) };
}

export type JoinResult = { ok: true; couple: Couple } | { ok: false; error: string };

/** Connects the signed-in user (member or guest) to an invitation. */
export function joinCouple(rawCode: string): JoinResult {
  const me = currentUser();
  if (!me) return { ok: false, error: "Nobody is on this device yet." };
  const found = lookupInvite(rawCode);
  if (found.state === "invalid") return { ok: false, error: "That invite doesn't seem to work." };
  if (found.state === "expired") return { ok: false, error: "This invitation has expired." };
  if (found.state === "full")
    return { ok: false, error: "That couple already has two people." };
  if (found.state === "mine") return { ok: true, couple: found.couple };

  // Leaving any previous couple keeps the model to two people.
  const previous = coupleOf(me.id);
  if (previous && previous.id !== found.couple.id) leaveCouple();

  const joined: Couple = { ...found.couple, bId: me.id };
  putCouple(joined);
  return { ok: true, couple: joined };
}

export function partnerOf(couple: Couple | null, userId: string | null): User | null {
  if (!couple || !userId) return null;
  const otherId = couple.aId === userId ? couple.bId : couple.aId;
  return getUser(otherId ?? null);
}

export function isConnected(couple: Couple | null): boolean {
  return Boolean(couple && couple.bId && !isExpired(couple));
}

export function leaveCouple() {
  const me = currentUserId();
  const couple = coupleOf(me);
  if (!couple || !me) return;
  const remaining = allCouples().filter((c) => c.id !== couple.id);
  if (couple.aId === me && !couple.bId) {
    write(COUPLES_KEY, remaining);
    return;
  }
  if (couple.aId === me && couple.bId) {
    write(COUPLES_KEY, [...remaining, { ...couple, aId: couple.bId, bId: null }]);
    return;
  }
  write(COUPLES_KEY, [...remaining, { ...couple, bId: null }]);
}

/* ---------------- pairing links ---------------- */

export function joinUrl(code: string): string {
  const origin = isBrowser() ? window.location.origin : "https://lela.app";
  return `${origin}/join/${code}`;
}

export function inviteMessage(code: string): string {
  return `I made us a LELA date. Join me — we each get a secret character and find out at the table. ${joinUrl(code)} (code ${code})`;
}

/* ---------------- prototype device switcher ---------------- */

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

export function resetEverything() {
  if (!isBrowser()) return;
  for (const key of [
    USERS_KEY,
    COUPLES_KEY,
    DEVICE_KEY,
    "lela.current",
    "lela.saved",
    "lela.viewer",
  ])
    window.localStorage.removeItem(key);
  notifyChange();
}
