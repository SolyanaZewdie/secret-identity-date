import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Vibe } from "./characters";
import type { DateStyle, Intensity } from "./data";
import { generatePair } from "./generate";

type CreateInput = { vibe: Vibe; intensity: Intensity; style: DateStyle };

/**
 * Characters are generated on the server and written straight into
 * `date_assignments`, one row per partner. The creator's client never receives
 * the other partner's character — the only way to read a row is to own it (or
 * to be in the couple after the date has ended).
 */
export const createCloudDate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: CreateInput) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: couples, error: coupleError } = await supabase
      .from("couples")
      .select("id, a_id, b_id")
      .or(`a_id.eq.${userId},b_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(1);

    if (coupleError) throw new Error(coupleError.message);

    const couple = couples?.[0];
    if (!couple) throw new Error("You're not paired with anyone yet.");
    if (!couple.b_id) throw new Error("Your partner hasn't joined yet.");

    const creatorSlot = couple.a_id === userId ? "A" : "B";
    const pair = generatePair(data.vibe);

    // Only one live date per couple.
    await supabase
      .from("dates")
      .update({ archived: true })
      .eq("couple_id", couple.id)
      .eq("archived", false);

    const { data: row, error } = await supabase
      .from("dates")
      .insert({
        couple_id: couple.id,
        creator_slot: creatorSlot,
        vibe: data.vibe,
        intensity: data.intensity,
        style: data.style,
        scenario: pair.scenario as unknown as null,
        joined_a: creatorSlot === "A",
        joined_b: creatorSlot === "B",
      })
      .select("id")
      .single();

    if (error || !row) throw new Error(error?.message ?? "We couldn't create the date.");

    const { error: assignError } = await supabase.from("date_assignments").insert([
      {
        date_id: row.id,
        slot: "A",
        user_id: couple.a_id,
        character_id: pair.a.characterId,
        missions: pair.a.missions,
      },
      {
        date_id: row.id,
        slot: "B",
        user_id: couple.b_id,
        character_id: pair.b.characterId,
        missions: pair.b.missions,
      },
    ]);

    if (assignError) throw new Error(assignError.message);

    return { dateId: row.id };
  });
