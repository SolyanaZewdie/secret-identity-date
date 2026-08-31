import { CHARACTERS, type Character, type Vibe } from "./characters";
import {
  MISSIONS,
  SCENARIOS,
  type DateStyle,
  type Intensity,
  type RepeatAnswer,
  type Scenario,
} from "./data";

export type Partner = "A" | "B";

export type PartnerAssignment = {
  characterId: string;
  missions: string[];
  seen: boolean;
};

export type DateSession = {
  id: string;
  createdAt: string;
  /** Couple this date belongs to (absent on legacy one-phone sessions). */
  coupleId?: string;
  /** Slot of the partner who started the date. */
  creatorSlot?: Partner;
  vibe: Vibe;
  intensity: Intensity;
  style: DateStyle;
  scenario: Scenario | null;
  A: PartnerAssignment;
  B: PartnerAssignment;
  started: boolean;
  ended: boolean;
  /** Both partners must join before identities are handed out. */
  joined: { A: boolean; B: boolean };
  /** Each partner reveals their own character after the date. */
  revealed: { A: boolean; B: boolean };
  completedMissions: string[];
  rating?: number;
  again?: RepeatAnswer;
  note?: string;
};

export type SavedDate = DateSession & { savedAt: string };

const CURRENT_KEY = "lela.current";
const SAVED_KEY = "lela.saved";

const isBrowser = () => typeof window !== "undefined";

function read<T>(key: string): T | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — prototype degrades gracefully */
  }
  window.dispatchEvent(new Event("lela:change"));
}

/** Fills in fields added after the first prototype build. */
function normalize(session: DateSession | null): DateSession | null {
  if (!session) return null;
  return {
    ...session,
    joined: session.joined ?? { A: true, B: true },
    revealed: session.revealed ?? { A: session.ended, B: session.ended },
    completedMissions: session.completedMissions ?? [],
  };
}

export function loadCurrent(): DateSession | null {
  return normalize(read<DateSession>(CURRENT_KEY));
}

export function saveCurrent(session: DateSession) {
  write(CURRENT_KEY, session);
}

export function clearCurrent() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(CURRENT_KEY);
  window.dispatchEvent(new Event("lela:change"));
}

export function loadSaved(coupleId?: string | null): SavedDate[] {
  const all = (read<SavedDate[]>(SAVED_KEY) ?? []).map((d) => normalize(d) as SavedDate);
  if (!coupleId) return all;
  return all.filter((d) => d.coupleId === coupleId);
}

export function saveToHistory(session: DateSession) {
  const all = loadSaved();
  
  const next = [{ ...session, savedAt: new Date().toISOString() }, ...all];
  write(SAVED_KEY, next);
}

export function removeFromHistory(id: string) {
  write(
    SAVED_KEY,
    loadSaved().filter((d) => d.id !== id),
  );
}

/* ---------- generation (mock; swappable for a real generator) ---------- */

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)] as T;
}

function shuffle<T>(list: T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i] as T;
    copy[i] = copy[j] as T;
    copy[j] = tmp;
  }
  return copy;
}

/** Vibe biases the pool but true randomness always stays in the mix. */
function poolFor(vibe: Vibe): Character[] {
  if (vibe === "surprise") return CHARACTERS;
  const onVibe = CHARACTERS.filter((c) => c.tags.includes(vibe));
  const wildcards = shuffle(CHARACTERS.filter((c) => !c.tags.includes(vibe))).slice(0, 6);
  return [...onVibe, ...onVibe, ...wildcards];
}

function rollMissions(): string[] {
  const roll = Math.random();
  const count = roll < 0.35 ? 0 : roll < 0.65 ? 1 : roll < 0.88 ? 2 : 3;
  return shuffle(MISSIONS).slice(0, count);
}

export type GenerateInput = {
  vibe: Vibe;
  intensity: Intensity;
  style: DateStyle;
  coupleId?: string;
  creatorSlot?: Partner;
};

export function generateSession(input: GenerateInput): DateSession {
  const pool = poolFor(input.vibe);
  const a = pick(pool);
  let b = pick(pool);
  let guard = 0;
  while (b.id === a.id && guard++ < 50) b = pick(CHARACTERS);

  return {
    id: `${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...(input.coupleId ? { coupleId: input.coupleId } : {}),
    ...(input.creatorSlot ? { creatorSlot: input.creatorSlot } : {}),
    vibe: input.vibe,
    intensity: input.intensity,
    style: input.style,
    scenario: Math.random() < 0.5 ? pick(SCENARIOS) : null,
    A: { characterId: a.id, missions: rollMissions(), seen: false },
    B: { characterId: b.id, missions: rollMissions(), seen: false },
    started: false,
    ended: false,
    joined: input.creatorSlot
      ? { A: input.creatorSlot === "A", B: input.creatorSlot === "B" }
      : { A: true, B: true },
    revealed: { A: false, B: false },
    completedMissions: [],
  };
}

/* ---------- who is holding the phone ---------- */

const VIEWER_KEY = "lela.viewer";

export function getViewer(): Partner | null {
  if (!isBrowser()) return null;
  const v = window.localStorage.getItem(VIEWER_KEY);
  return v === "A" || v === "B" ? v : null;
}

export function setViewer(partner: Partner | null) {
  if (!isBrowser()) return;
  if (partner) window.localStorage.setItem(VIEWER_KEY, partner);
  else window.localStorage.removeItem(VIEWER_KEY);
  window.dispatchEvent(new Event("lela:change"));
}
