export type Clef = "treble" | "bass";
export type BaseDifficulty = "easy" | "medium" | "hard";
export type Difficulty =
  | BaseDifficulty
  | "easy-scales"
  | "medium-scales"
  | "hard-scales";
export type Notation = "pt" | "en";
export type Duration = "q" | "h" | "w";

export interface Note {
  letterIndex: number;
  accidental: -1 | 0 | 1;
  octave: number;
  diatonic: number;
  midi: number;
  duration: Duration;
  beats: number;
  start: number;
  naturalSign?: boolean;
}

export interface Song {
  id: string;
  title: string;
  composer: string;
  level: "Intermediária" | "Avançada";
  clef: Clef;
  hand: "Direita" | "Esquerda";
  notes: string;
}

export interface PracticeBatch {
  notes: Note[];
  scaleName: string | null;
  keySignature: KeySignature | null;
}

export interface KeySignature {
  kind: "sharp" | "flat";
  count: number;
}

interface ScaleDefinition {
  id: string;
  name: string;
  accidentals: Partial<Record<number, -1 | 1>>;
}

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;
const PORTUGUESE = ["Dó", "Ré", "Mi", "Fá", "Sol", "Lá", "Si"] as const;
const PITCH_CLASSES = [0, 2, 4, 5, 7, 9, 11] as const;
const SPELLING: ReadonlyArray<readonly [number, 0 | 1]> = [
  [0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [3, 0],
  [3, 1], [4, 0], [4, 1], [5, 0], [5, 1], [6, 0],
];
const FLAT_SPELLING: ReadonlyArray<readonly [number, -1 | 0]> = [
  [0, 0], [1, -1], [1, 0], [2, -1], [2, 0], [3, 0],
  [4, -1], [4, 0], [5, -1], [5, 0], [6, -1], [6, 0],
];

export const PIANO_RANGE = { low: 43, high: 84 };
export const CLEF_RANGES: Record<Clef, readonly [number, number]> = {
  // Fá3 a Si5: inclui notas abaixo do Dó central na clave de sol.
  treble: [24, 41],
  bass: [21, 32],
};
export const DIFFICULTY_JUMPS: Record<BaseDifficulty, readonly [number, number]> = {
  easy: [1, 2],
  medium: [3, 5],
  hard: [6, 9],
};

const SCALE_POOLS: Record<`${BaseDifficulty}-scales`, ScaleDefinition[]> = {
  "easy-scales": [
    { id: "c-major", name: "Dó maior", accidentals: {} },
    { id: "g-major", name: "Sol maior", accidentals: { 3: 1 } },
    { id: "f-major", name: "Fá maior", accidentals: { 6: -1 } },
  ],
  "medium-scales": [
    { id: "d-major", name: "Ré maior", accidentals: { 0: 1, 3: 1 } },
    { id: "bb-major", name: "Si♭ maior", accidentals: { 2: -1, 6: -1 } },
    { id: "a-major", name: "Lá maior", accidentals: { 0: 1, 3: 1, 4: 1 } },
    { id: "eb-major", name: "Mi♭ maior", accidentals: { 2: -1, 5: -1, 6: -1 } },
  ],
  "hard-scales": [
    { id: "e-major", name: "Mi maior", accidentals: { 0: 1, 1: 1, 3: 1, 4: 1 } },
    { id: "ab-major", name: "Lá♭ maior", accidentals: { 1: -1, 2: -1, 5: -1, 6: -1 } },
    { id: "b-major", name: "Si maior", accidentals: { 0: 1, 1: 1, 3: 1, 4: 1, 5: 1 } },
    { id: "db-major", name: "Ré♭ maior", accidentals: { 1: -1, 2: -1, 4: -1, 5: -1, 6: -1 } },
    { id: "fs-major", name: "Fá♯ maior", accidentals: { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 } },
  ],
};

export function parseNote(token: string): Omit<Note, "start"> {
  const [pitch, durationCode = "q"] = token.split(":");
  const match = /^([A-G])([#b]?)(\d)$/.exec(pitch);
  if (!match) throw new Error(`Nota inválida: ${token}`);

  const letterIndex = LETTERS.indexOf(match[1] as (typeof LETTERS)[number]);
  const accidental = (match[2] === "#" ? 1 : match[2] === "b" ? -1 : 0) as -1 | 0 | 1;
  const octave = Number(match[3]);
  const duration = durationCode as Duration;
  const beats = { q: 1, h: 2, w: 4 }[duration];
  if (!beats) throw new Error(`Duração inválida: ${durationCode}`);

  return {
    letterIndex,
    accidental,
    octave,
    diatonic: octave * 7 + letterIndex,
    midi: 12 * (octave + 1) + PITCH_CLASSES[letterIndex] + accidental,
    duration,
    beats,
  };
}

export function parseSequence(sequence: string): Note[] {
  let start = 0;
  return sequence.trim().split(/\s+/).map((token) => {
    const note = { ...parseNote(token), start };
    start += note.beats;
    return note;
  });
}

export function noteFromDiatonic(
  diatonic: number,
  start = 0,
  accidental: -1 | 0 | 1 = 0,
  naturalSign = false,
): Note {
  const letterIndex = ((diatonic % 7) + 7) % 7;
  const octave = Math.floor(diatonic / 7);
  const symbol = accidental === 1 ? "#" : accidental === -1 ? "b" : "";
  return {
    ...parseNote(`${LETTERS[letterIndex]}${symbol}${octave}`),
    start,
    naturalSign,
  };
}

export function spellMidi(midi: number) {
  const [letterIndex, accidental] = SPELLING[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return {
    letterIndex,
    accidental,
    octave,
    diatonic: octave * 7 + letterIndex,
  };
}

export function noteName(
  letterIndex: number,
  accidental: number,
  notation: Notation,
  naturalSign = false,
) {
  const base = notation === "pt" ? PORTUGUESE[letterIndex] : LETTERS[letterIndex];
  if (naturalSign) return `${base}♮`;
  const symbol = accidental > 0 ? "♯" : accidental < 0 ? "♭" : "";
  return `${base}${symbol}`;
}

export function midiName(midi: number, notation: Notation) {
  const note = spellMidi(midi);
  return noteName(note.letterIndex, note.accidental, notation);
}

export function midiKeyName(midi: number, notation: Notation) {
  const pitchClass = ((midi % 12) + 12) % 12;
  const sharp = spellMidi(midi);
  const sharpName = noteName(sharp.letterIndex, sharp.accidental, notation);
  if (sharp.accidental === 0) return sharpName;
  const [flatLetter, flatAccidental] = FLAT_SPELLING[pitchClass];
  return `${sharpName}/${noteName(flatLetter, flatAccidental, notation)}`;
}

export function generatePracticeNotes(
  clef: Clef,
  difficulty: Difficulty,
  count = 8,
  random: () => number = Math.random,
): Note[] {
  return generatePracticeBatch(clef, difficulty, count, random).notes;
}

export function generatePracticeBatch(
  clef: Clef,
  difficulty: Difficulty,
  count = 8,
  random: () => number = Math.random,
): PracticeBatch {
  const [low, high] = CLEF_RANGES[clef];
  const baseDifficulty = difficulty.replace("-scales", "") as BaseDifficulty;
  const [minJump, maxJump] = DIFFICULTY_JUMPS[baseDifficulty];
  const degrees: number[] = [
    low + Math.floor(random() * (high - low + 1)),
  ];

  while (degrees.length < count) {
    const previous = degrees.at(-1)!;
    const candidates: number[] = [];
    for (let degree = low; degree <= high; degree += 1) {
      const jump = Math.abs(degree - previous);
      if (jump >= minJump && jump <= maxJump) candidates.push(degree);
    }
    degrees.push(candidates[Math.floor(random() * candidates.length)]);
  }

  const usesScales = difficulty.endsWith("-scales");
  const scale = usesScales
    ? SCALE_POOLS[difficulty as `${BaseDifficulty}-scales`][
      Math.floor(random() * SCALE_POOLS[difficulty as `${BaseDifficulty}-scales`].length)
    ]
    : null;
  const accidentals: Array<-1 | 0 | 1> = scale
    ? degrees.map((degree) => scale.accidentals[((degree % 7) + 7) % 7] ?? 0)
    : randomAccidentals(degrees, random);
  const naturalSigns = scale
    ? addNaturalSigns(degrees, accidentals, random)
    : degrees.map(() => false);

  return {
    notes: degrees.map((degree, index) =>
      noteFromDiatonic(degree, index, accidentals[index], naturalSigns[index])),
    scaleName: scale?.name ?? null,
    keySignature: scale ? {
      kind: Object.values(scale.accidentals)[0] === -1 ? "flat" : "sharp",
      count: Object.keys(scale.accidentals).length,
    } : null,
  };
}

function addNaturalSigns(
  degrees: number[],
  accidentals: Array<-1 | 0 | 1>,
  random: () => number,
) {
  const naturalSigns = degrees.map(() => false);
  const candidates = degrees
    .map((degree, index) => ({ degree, index }))
    .filter(({ degree, index }) => {
      if (accidentals[index] === 0) return false;
      const measureEnd = Math.min(degrees.length, Math.floor(index / 4) * 4 + 4);
      return !degrees.slice(index + 1, measureEnd).some((next) =>
        ((next % 7) + 7) % 7 === ((degree % 7) + 7) % 7);
    });

  candidates.forEach(({ index }) => {
    if (random() < 0.2) {
      accidentals[index] = 0;
      naturalSigns[index] = true;
    }
  });
  if (candidates.length > 0 && !naturalSigns.some(Boolean)) {
    const { index } = candidates[Math.floor(random() * candidates.length)];
    accidentals[index] = 0;
    naturalSigns[index] = true;
  }
  return naturalSigns;
}

export function pitchDirection(played: number, expected: number) {
  return played < expected ? "mais aguda, procure à direita" : "mais grave, procure à esquerda";
}

function accidentalOptions(degree: number): Array<-1 | 1> {
  const letterIndex = ((degree % 7) + 7) % 7;
  const options: Array<-1 | 1> = [];
  const naturalPitch = PITCH_CLASSES[letterIndex];
  if ([1, 3, 6, 8, 10].includes((naturalPitch + 1) % 12)) options.push(1);
  if ([1, 3, 6, 8, 10].includes((naturalPitch + 11) % 12)) options.push(-1);
  return options;
}

function randomAccidentals(degrees: number[], random: () => number) {
  const accidentals: Array<-1 | 0 | 1> = degrees.map((degree) => {
    if (random() >= 0.35) return 0;
    const options = accidentalOptions(degree);
    return options[Math.floor(random() * options.length)];
  });
  ensureAccidental(accidentals, degrees, 1);
  ensureAccidental(accidentals, degrees, -1);
  return accidentals;
}

function ensureAccidental(
  accidentals: Array<-1 | 0 | 1>,
  degrees: number[],
  wanted: -1 | 1,
) {
  if (accidentals.includes(wanted)) return;
  const index = degrees.findIndex((degree, noteIndex) =>
    accidentals[noteIndex] !== -wanted && accidentalOptions(degree).includes(wanted));
  if (index >= 0) accidentals[index] = wanted;
}
