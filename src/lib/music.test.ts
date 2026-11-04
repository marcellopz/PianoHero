import { describe, expect, it } from "vitest";
import { SONGS } from "@/data/songs";
import {
  DIFFICULTY_JUMPS,
  generatePracticeBatch,
  generatePracticeNotes,
  noteName,
  parseNote,
  parseSequence,
  PIANO_RANGE,
  type BaseDifficulty,
} from "./music";
import { accuracyPercent, completionBonus, scoreNote } from "./game";

function seededRandom(seed = 12345) {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

describe("teoria musical", () => {
  it("converte altura, oitava e duração para MIDI e tempos", () => {
    expect(parseNote("C4")).toMatchObject({ midi: 60, beats: 1, diatonic: 28 });
    expect(parseNote("F#4:h")).toMatchObject({ midi: 66, beats: 2, accidental: 1 });
    expect(parseNote("Bb4")).toMatchObject({ midi: 70, beats: 1, accidental: -1 });
    expect(noteName(3, 0, "pt", true)).toBe("Fá♮");
    expect(parseSequence("C4 D4:h E4:w").map((note) => note.start)).toEqual([0, 1, 3]);
  });

  it.each(["easy", "medium", "hard"] as BaseDifficulty[])(
    "respeita os saltos definidos no nível %s",
    (difficulty) => {
      const notes = generatePracticeNotes("treble", difficulty, 50, seededRandom());
      const [minimum, maximum] = DIFFICULTY_JUMPS[difficulty];
      notes.slice(1).forEach((note, index) => {
        const jump = Math.abs(note.diatonic - notes[index].diatonic);
        expect(jump).toBeGreaterThanOrEqual(minimum);
        expect(jump).toBeLessThanOrEqual(maximum);
      });
      expect(notes.some((note) => note.accidental === 1)).toBe(true);
      expect(notes.some((note) => note.accidental === -1)).toBe(true);
    },
  );

  it("inclui a região abaixo do Dó central na clave de sol", () => {
    const notes = generatePracticeNotes("treble", "easy", 16, () => 0);
    expect(notes.some((note) => note.midi < 60)).toBe(true);
  });

  it("oferece repertório monofônico intermediário e avançado válido", () => {
    expect(SONGS).toHaveLength(13);
    SONGS.forEach((song) => {
      const notes = parseSequence(song.notes);
      notes.forEach((note) => {
        expect(note.midi).toBeGreaterThanOrEqual(PIANO_RANGE.low);
        expect(note.midi).toBeLessThanOrEqual(PIANO_RANGE.high);
      });
    });
  });

  it.each(["easy-scales", "medium-scales", "hard-scales"] as const)(
    "gera uma tonalidade identificada no nível %s",
    (difficulty) => {
      const batch = generatePracticeBatch("treble", difficulty, 16, seededRandom());
      expect(batch.notes).toHaveLength(16);
      expect(batch.scaleName).not.toBeNull();
    },
  );

  it.each(["medium-scales", "hard-scales"] as const)(
    "inclui bequadro para cancelar a armadura em %s",
    (difficulty) => {
      const batch = generatePracticeBatch("treble", difficulty, 16, seededRandom());
      expect(batch.notes.some((note) => note.naturalSign)).toBe(true);
    },
  );
});

describe("pontuação", () => {
  it("premia sequências e aplica penalidades sem ficar negativa", () => {
    expect(scoreNote(0, 0, false)).toBe(100);
    expect(scoreNote(4, 0, false)).toBe(140);
    expect(scoreNote(0, 1, true)).toBe(35);
    expect(scoreNote(0, 99, true)).toBe(20);
  });

  it("calcula precisão e bônus de conclusão", () => {
    expect(accuracyPercent(8, 2)).toBe(80);
    expect(completionBonus(8, 2)).toBe(460);
    expect(completionBonus(10, 0)).toBe(500);
  });
});
