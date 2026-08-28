import type { Vibe } from "./characters";

export type Intensity = "light" | "medium" | "full";
export type DateStyle = "dinner" | "coffee" | "walk" | "activity" | "surprise" | "plans";

export type Option<T extends string> = {
  value: T;
  emoji: string;
  label: string;
  note?: string;
  sub?: string;
};

export const VIBES: Option<Vibe>[] = [
  { value: "surprise", emoji: "🎭", label: "Surprise Me" },
  { value: "funny", emoji: "😂", label: "Funny" },
  { value: "romantic", emoji: "💕", label: "Romantic" },
  { value: "mysterious", emoji: "🕵️", label: "Mysterious" },
  { value: "cinematic", emoji: "🎬", label: "Cinematic" },
  { value: "weird", emoji: "🤪", label: "Weird" },
  { value: "wholesome", emoji: "✨", label: "Wholesome" },
];

export const INTENSITIES: Option<Intensity>[] = [
  {
    value: "light",
    emoji: "🌱",
    label: "Light",
    note: "Just add a little character.",
    sub: "Small changes to how you talk and behave.",
  },
  {
    value: "medium",
    emoji: "🎭",
    label: "Medium",
    note: "Stay in character.",
    sub: "Let the persona shape the whole date.",
  },
  {
    value: "full",
    emoji: "🎪",
    label: "Full",
    note: "Commit to the bit.",
    sub: "Outfit, personality, mannerisms, everything.",
  },
];

export const DATE_STYLES: Option<DateStyle>[] = [
  { value: "dinner", emoji: "🍽️", label: "Dinner" },
  { value: "coffee", emoji: "☕", label: "Coffee" },
  { value: "walk", emoji: "🚶", label: "Walk" },
  { value: "activity", emoji: "🎨", label: "Activity" },
  { value: "surprise", emoji: "🎲", label: "Surprise Me" },
  { value: "plans", emoji: "✨", label: "We already have plans" },
];

export type Scenario = { title: string; body: string };

export const SCENARIOS: Scenario[] = [
  {
    title: "The Secret Meeting",
    body: "You've both been asked to meet someone here tonight. You don't know that the other person received the same assignment.",
  },
  {
    title: "The Wrong Identity",
    body: "You're both pretending to be someone you're not. Neither of you knows the other's real identity.",
  },
  {
    title: "The Suspicious Stranger",
    body: "You have a feeling your partner knows something you don't. Tonight you intend to find out what.",
  },
  {
    title: "The Last Night In Town",
    body: "You're leaving in the morning and neither of you has mentioned it.",
  },
  {
    title: "The Accidental Reunion",
    body: "You are pretending you've met before. You cannot agree on where.",
  },
];

export const MISSIONS: string[] = [
  "Make your partner laugh without breaking character.",
  "Get your partner to say the word “pineapple” naturally.",
  "Tell your partner a completely fictional story about your childhood.",
  "Make a dramatic accusation about something completely ordinary.",
  "Convince your partner that you have met a famous person.",
  "Give your partner a nickname and use it all night.",
  "Compliment something nobody would ever compliment.",
  "Order for your partner, in character.",
  "Work the word “destiny” into conversation without irony.",
  "Ask a stranger a question your character would ask.",
];

export const LOADING_LINES: string[] = [
  "Searching the archives…",
  "Finding your identities…",
  "Choosing someone you definitely weren't expecting…",
  "Sealing the envelopes…",
  "Almost ready…",
];

export const DATE_PROMPTS: string[] = [
  "Make an observation about your surroundings as if you're conducting a scientific experiment.",
  "Tell them one thing about your character's past. Make it very specific.",
  "Ask them a question your character desperately wants answered.",
  "Compliment them the way your character would.",
  "Take a moment. Notice something nobody else in the room noticed.",
  "Change the subject dramatically, for no reason at all.",
  "Say something your character believes and you absolutely do not.",
];

export const REPEAT_ANSWERS = ["Absolutely", "Probably", "Maybe", "Not tonight"] as const;
export type RepeatAnswer = (typeof REPEAT_ANSWERS)[number];

export function labelOf<T extends string>(options: Option<T>[], value: T) {
  return options.find((o) => o.value === value)?.label ?? value;
}

export function emojiOf<T extends string>(options: Option<T>[], value: T) {
  return options.find((o) => o.value === value)?.emoji ?? "";
}
