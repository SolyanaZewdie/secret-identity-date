import { CHARACTERS, type Character, type Vibe } from "./characters";
import { MISSIONS, SCENARIOS, type Scenario } from "./data";

/**
 * Pure character/mission generation, shared by the guest (local) flow and the
 * server-side generator used for signed-in couples. No storage, no window.
 */

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

export type GeneratedPair = {
  a: { characterId: string; missions: string[] };
  b: { characterId: string; missions: string[] };
  scenario: Scenario | null;
};

export function generatePair(vibe: Vibe): GeneratedPair {
  const pool = poolFor(vibe);
  const a = pick(pool);
  let b = pick(pool);
  let guard = 0;
  while (b.id === a.id && guard++ < 50) b = pick(CHARACTERS);

  return {
    a: { characterId: a.id, missions: rollMissions() },
    b: { characterId: b.id, missions: rollMissions() },
    scenario: Math.random() < 0.5 ? pick(SCENARIOS) : null,
  };
}
