export type Clef = "treble" | "bass";
export type Difficulty = "easy" | "medium" | "hard";
export type Notation = "pt" | "en";
export type Duration = "q" | "h" | "w";

export interface Note {
  letterIndex: number;
  accidental: 0 | 1;
  octave: number;
  diatonic: number;
  midi: number;
  duration: Duration;
  beats: number;
  start: number;
}

export interface Song {
  id: string;
  title: string;
  clef: Clef;
  hand: "Direita" | "Esquerda";
  notes: string;
}

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;
const PORTUGUESE = ["Dó", "Ré", "Mi", "Fá", "Sol", "Lá", "Si"] as const;
const PITCH_CLASSES = [0, 2, 4, 5, 7, 9, 11] as const;
const SPELLING: ReadonlyArray<readonly [number, 0 | 1]> = [
  [0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [3, 0],
  [3, 1], [4, 0], [4, 1], [5, 0], [5, 1], [6, 0],
];

export const PIANO_RANGE = { low: 48, high: 84 };
export const CLEF_RANGES: Record<Clef, readonly [number, number]> = {
  treble: [28, 42],
  bass: [21, 32],
};
export const DIFFICULTY_JUMPS: Record<Difficulty, readonly [number, number]> = {
  easy: [1, 2],
  medium: [3, 5],
  hard: [6, 9],
};

export function parseNote(token: string): Omit<Note, "start"> {
  const [pitch, durationCode = "q"] = token.split(":");
  const match = /^([A-G])(#?)(\d)$/.exec(pitch);
  if (!match) throw new Error(`Nota inválida: ${token}`);

  const letterIndex = LETTERS.indexOf(match[1] as (typeof LETTERS)[number]);
  const accidental = match[2] ? 1 : 0;
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

export function noteFromDiatonic(diatonic: number, start = 0): Note {
  const letterIndex = ((diatonic % 7) + 7) % 7;
  const octave = Math.floor(diatonic / 7);
  return { ...parseNote(`${LETTERS[letterIndex]}${octave}`), start };
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
) {
  const base = notation === "pt" ? PORTUGUESE[letterIndex] : LETTERS[letterIndex];
  return `${base}${accidental ? "♯" : ""}`;
}

export function midiName(midi: number, notation: Notation) {
  const note = spellMidi(midi);
  return noteName(note.letterIndex, note.accidental, notation);
}

export function generatePracticeNotes(
  clef: Clef,
  difficulty: Difficulty,
  count = 8,
  random: () => number = Math.random,
): Note[] {
  const [low, high] = CLEF_RANGES[clef];
  const [minJump, maxJump] = DIFFICULTY_JUMPS[difficulty];
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

  return degrees.map((degree, index) => noteFromDiatonic(degree, index));
}

export function pitchDirection(played: number, expected: number) {
  return played < expected ? "mais aguda, procure à direita" : "mais grave, procure à esquerda";
}
