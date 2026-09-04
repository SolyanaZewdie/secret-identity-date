import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabase";
import type { Vibe } from "./characters";
import type { DateStyle, Intensity, RepeatAnswer, Scenario } from "./data";
import type { Slot } from "./account";

/**
 * The signed-in date layer. State lives in the `dates` table so both devices
 * see the same date after a refresh; each partner's character lives in
 * `date_assignments` and is protected by row-level security.
 */

export type CloudDate = {
  id: string;
  coupleId: string;
  creatorSlot: Slot;
  vibe: Vibe;
  intensity: Intensity;
  style: DateStyle;
  scenario: Scenario | null;
  started: boolean;
  ended: boolean;
  archived: boolean;
  joined: { A: boolean; B: boolean };
  seen: { A: boolean; B: boolean };
  revealed: { A: boolean; B: boolean };
  completedMissions: string[];
  rating: number | null;
  again: RepeatAnswer | null;
  note: string | null;
  createdAt: string;
};

export type CloudAssignment = {
  slot: Slot;
  characterId: string;
  missions: string[];
};

type DateRow = {
  id: string;
  couple_id: string;
  creator_slot: string;
  vibe: string;
  intensity: string;
  style: string;
  scenario: unknown;
  started: boolean;
  ended: boolean;
  archived: boolean;
  joined_a: boolean;
  joined_b: boolean;
  seen_a: boolean;
  seen_b: boolean;
  revealed_a: boolean;
  revealed_b: boolean;
  completed_missions: string[];
  rating: number | null;
  again: string | null;
  note: string | null;
  created_at: string;
};

function mapDate(row: DateRow): CloudDate {
  return {
    id: row.id,
    coupleId: row.couple_id,
    creatorSlot: row.creator_slot as Slot,
    vibe: row.vibe as Vibe,
    intensity: row.intensity as Intensity,
    style: row.style as DateStyle,
    scenario: (row.scenario as Scenario | null) ?? null,
    started: row.started,
    ended: row.ended,
    archived: row.archived,
    joined: { A: row.joined_a, B: row.joined_b },
    seen: { A: row.seen_a, B: row.seen_b },
    revealed: { A: row.revealed_a, B: row.revealed_b },
    completedMissions: row.completed_missions ?? [],
    rating: row.rating,
    again: (row.again as RepeatAnswer | null) ?? null,
    note: row.note,
    createdAt: row.created_at,
  };
}

const DATE_COLUMNS =
  "id, couple_id, creator_slot, vibe, intensity, style, scenario, started, ended, archived, joined_a, joined_b, seen_a, seen_b, revealed_a, revealed_b, completed_missions, rating, again, note, created_at";

/* -------------------------------------------------------------------------- */
/* Reads                                                                      */
/* -------------------------------------------------------------------------- */

export async function loadActiveDate(coupleId: string): Promise<CloudDate | null> {
  const { data, error } = await supabase
    .from("dates")
    .select(DATE_COLUMNS)
    .eq("couple_id", coupleId)
    .eq("archived", false)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) return null;
  return mapDate(data[0] as DateRow);
}

export async function loadDate(dateId: string): Promise<CloudDate | null> {
  const { data, error } = await supabase
    .from("dates")
    .select(DATE_COLUMNS)
    .eq("id", dateId)
    .maybeSingle();

  if (error || !data) return null;
  return mapDate(data as DateRow);
}

export async function loadArchivedDates(coupleId: string): Promise<CloudDate[]> {
  const { data, error } = await supabase
    .from("dates")
    .select(DATE_COLUMNS)
    .eq("couple_id", coupleId)
    .eq("archived", true)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as DateRow[]).map(mapDate);
}

/** Row-level security only ever returns rows this user is allowed to read. */
export async function loadAssignments(dateId: string): Promise<CloudAssignment[]> {
  const { data, error } = await supabase
    .from("date_assignments")
    .select("slot, character_id, missions")
    .eq("date_id", dateId);

  if (error || !data) return [];
  return data.map((row) => ({
    slot: row.slot as Slot,
    characterId: row.character_id,
    missions: row.missions ?? [],
  }));
}

export async function loadMyAssignment(dateId: string): Promise<CloudAssignment | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("date_assignments")
    .select("slot, character_id, missions")
    .eq("date_id", dateId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;
  return {
    slot: data.slot as Slot,
    characterId: data.character_id,
    missions: data.missions ?? [],
  };
}

/* -------------------------------------------------------------------------- */
/* Writes                                                                     */
/* -------------------------------------------------------------------------- */

type DatePatch = Partial<{
  started: boolean;
  ended: boolean;
  archived: boolean;
  joined_a: boolean;
  joined_b: boolean;
  seen_a: boolean;
  seen_b: boolean;
  revealed_a: boolean;
  revealed_b: boolean;
  completed_missions: string[];
  rating: number;
  again: string;
  note: string;
}>;

async function patch(dateId: string, values: DatePatch) {
  const { error } = await supabase.from("dates").update(values).eq("id", dateId);
  if (error) throw new Error(error.message);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("lela:change"));
}

const lower = (slot: Slot) => (slot === "A" ? "a" : "b");

export const markJoined = (dateId: string, slot: Slot) =>
  patch(dateId, { [`joined_${lower(slot)}`]: true } as DatePatch);

export const markSeen = (dateId: string, slot: Slot) =>
  patch(dateId, { [`seen_${lower(slot)}`]: true } as DatePatch);

export const markRevealed = (dateId: string, slot: Slot) =>
  patch(dateId, { [`revealed_${lower(slot)}`]: true } as DatePatch);

export const startDate = (dateId: string) => patch(dateId, { started: true });

export const endDate = (dateId: string) => patch(dateId, { ended: true });

export const toggleCompletedMission = (
  dateId: string,
  completed: string[],
  mission: string,
) =>
  patch(dateId, {
    completed_missions: completed.includes(mission)
      ? completed.filter((m) => m !== mission)
      : [...completed, mission],
  });

export const archiveDate = (
  dateId: string,
  recap: { rating?: number; again?: RepeatAnswer; note?: string },
) =>
  patch(dateId, {
    archived: true,
    ...(recap.rating ? { rating: recap.rating } : {}),
    ...(recap.again ? { again: recap.again } : {}),
    ...(recap.note ? { note: recap.note } : {}),
  });

export const discardDate = async (dateId: string) => {
  const { error } = await supabase.from("dates").delete().eq("id", dateId);
  if (error) throw new Error(error.message);
  if (typeof window !== "undefined") window.dispatchEvent(new Event("lela:change"));
};

/* -------------------------------------------------------------------------- */
/* Hook                                                                       */
/* -------------------------------------------------------------------------- */

export type CloudDateState = {
  ready: boolean;
  date: CloudDate | null;
  mine: CloudAssignment | null;
  refresh: () => void;
};

/** Polls the shared date so both devices stay in step. */
export function useCloudDate(
  coupleId: string | null | undefined,
  enabled = true,
  intervalMs = 3000,
): CloudDateState {
  const [date, setDate] = useState<CloudDate | null>(null);
  const [mine, setMine] = useState<CloudAssignment | null>(null);
  const [ready, setReady] = useState(false);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!coupleId || !enabled) {
      setDate(null);
      setMine(null);
      setReady(true);
      return;
    }

    let cancelled = false;

    const sync = async () => {
      const active = await loadActiveDate(coupleId);
      if (cancelled) return;
      setDate(active);
      setMine(active ? await loadMyAssignment(active.id) : null);
      if (!cancelled) setReady(true);
    };

    void sync();

    const timer = window.setInterval(() => void sync(), intervalMs);
    const onChange = () => void sync();
    window.addEventListener("lela:change", onChange);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("lela:change", onChange);
    };
  }, [coupleId, enabled, intervalMs, tick]);

  return { ready, date, mine, refresh };
}
