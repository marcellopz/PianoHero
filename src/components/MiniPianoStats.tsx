"use client";

import { useMemo } from "react";
import type { NotePerformance } from "@/lib/game";
import {
  midiKeyName,
  noteName,
  PIANO_RANGE,
  spellMidi,
  type Notation,
} from "@/lib/music";

interface MiniPianoStatsProps {
  notes: NotePerformance[];
  notation: Notation;
}

interface MidiPerformance {
  hits: number;
  misses: number;
  hints: number;
}

const NATURAL_PITCHES = [0, 2, 4, 5, 7, 9, 11];

function accuracy(performance: MidiPerformance) {
  const attempts = performance.hits + performance.misses;
  return attempts ? Math.round((performance.hits / attempts) * 100) : 0;
}

function heatGradient(value: number, black: boolean) {
  const hue = value * 1.2;
  const topLightness = black ? 39 : 57;
  const bottomLightness = black ? 24 : 37;
  return `linear-gradient(180deg, hsl(${hue} 78% ${topLightness}%), hsl(${hue} 76% ${bottomLightness}%))`;
}

export function MiniPianoStats({ notes, notation }: MiniPianoStatsProps) {
  const performanceByMidi = useMemo(() => {
    const result = new Map<number, MidiPerformance>();
    notes.forEach((note) => {
      const midi = Number.isFinite(note.midi)
        ? note.midi
        : 12 * (note.octave + 1) + NATURAL_PITCHES[note.letterIndex] + note.accidental;
      const current = result.get(midi) ?? { hits: 0, misses: 0, hints: 0 };
      current.hits += note.hits;
      current.misses += note.misses;
      current.hints += note.hints;
      result.set(midi, current);
    });
    return result;
  }, [notes]);
  const keys = useMemo(
    () => Array.from(
      { length: PIANO_RANGE.high - PIANO_RANGE.low + 1 },
      (_, index) => PIANO_RANGE.low + index,
    ),
    [],
  );
  const whiteKeys = useMemo(
    () => keys.filter((midi) => spellMidi(midi).accidental === 0),
    [keys],
  );

  return (
    <div className="heatmap-wrap">
      <div className="heatmap-legend" aria-label="Legenda de desempenho">
        <span>Mais erros</span>
        <i className="legend-gradient" />
        <span>Mais acertos</span>
        <span className="legend-empty"><i /> Sem dados</span>
      </div>
      <div className="mini-piano-scroll">
        <div className="mini-piano" role="list" aria-label="Desempenho por tecla do piano">
          {keys.map((midi) => {
            const spelling = spellMidi(midi);
            const black = spelling.accidental === 1;
            const whiteBefore = black ? whiteKeys.indexOf(midi - 1) : -1;
            const performance = performanceByMidi.get(midi);
            const noteAccuracy = performance ? accuracy(performance) : 0;
            const name = midiKeyName(midi, notation);
            const style = black ? {
              left: `${((whiteBefore + 1) / whiteKeys.length) * 100 - (0.31 / whiteKeys.length) * 100}%`,
              width: `${(0.62 / whiteKeys.length) * 100}%`,
              ...(performance ? { background: heatGradient(noteAccuracy, true) } : {}),
            } : performance ? { background: heatGradient(noteAccuracy, false) } : undefined;
            const description = performance
              ? `${name}: ${performance.hits} acertos, ${performance.misses} erros, ${noteAccuracy}% de precisão`
              : `${name}: sem dados`;
            return (
              <div
                key={midi}
                role="listitem"
                className={`${black ? "mini-black-key" : "mini-white-key"}${performance ? " has-data" : ""}`}
                style={style}
                title={description}
                aria-label={description}
              >
                {!black && (
                  <span>
                    {noteName(spelling.letterIndex, 0, notation)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
