import type { Clef, Difficulty, Notation } from "./music";

export type GameMode = "songs" | "practice";

export interface Preferences {
  mode: GameMode;
  songId: string;
  clef: Clef;
  difficulty: Difficulty;
  notation: Notation;
  keyNames: boolean;
  staffNames: boolean;
  preview: boolean;
}

export interface RecordEntry {
  score: number;
  accuracy: number;
  bestStreak: number;
}

export type Records = Record<string, RecordEntry>;

export interface NotePerformance {
  key: string;
  midi: number;
  letterIndex: number;
  accidental: number;
  naturalSign: boolean;
  octave: number;
  hits: number;
  misses: number;
  hints: number;
  totalResponseMs: number;
}

export interface DetailedStats {
  notes: Record<string, NotePerformance>;
  bestStreak: number;
}

export const DEFAULT_PREFERENCES: Preferences = {
  mode: "songs",
  songId: "fur-elise",
  clef: "treble",
  difficulty: "easy",
  notation: "pt",
  keyNames: true,
  staffNames: false,
  preview: true,
};

const PREFS_KEY = "piano-hero-preferences-v1";
const RECORDS_KEY = "piano-hero-records-v1";
const DETAILED_STATS_KEY = "piano-hero-detailed-stats-v1";

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? { ...fallback, ...JSON.parse(value) } : fallback;
  } catch {
    return fallback;
  }
}

export function loadPreferences() {
  return loadJson(PREFS_KEY, DEFAULT_PREFERENCES);
}

export function savePreferences(preferences: Preferences) {
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(preferences));
  } catch {
    // The app remains usable when storage is unavailable.
  }
}

export function loadRecords(): Records {
  return loadJson(RECORDS_KEY, {});
}

export function saveRecords(records: Records) {
  try {
    window.localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  } catch {
    // The app remains usable when storage is unavailable.
  }
}

export function loadDetailedStats(): DetailedStats {
  return loadJson(DETAILED_STATS_KEY, { notes: {}, bestStreak: 0 });
}

export function saveDetailedStats(stats: DetailedStats) {
  try {
    window.localStorage.setItem(DETAILED_STATS_KEY, JSON.stringify(stats));
  } catch {
    // The app remains usable when storage is unavailable.
  }
}

export function scoreNote(
  streakBeforeHit: number,
  wrongAttempts: number,
  usedHint: boolean,
) {
  const base = Math.max(20, 100 - wrongAttempts * 25 - (usedHint ? 40 : 0));
  const streakBonus = Math.min(streakBeforeHit * 10, 100);
  return base + streakBonus;
}

export function completionBonus(hits: number, misses: number) {
  const attempts = hits + misses;
  const accuracy = attempts ? hits / attempts : 0;
  return Math.round(300 + 200 * accuracy);
}

export function accuracyPercent(hits: number, misses: number) {
  const attempts = hits + misses;
  return attempts ? Math.round((hits / attempts) * 100) : 100;
}

export function sessionKey(
  mode: GameMode,
  songId: string,
  clef: Clef,
  difficulty: Difficulty,
) {
  return mode === "songs" ? `song:${songId}` : `practice:${clef}:${difficulty}`;
}
