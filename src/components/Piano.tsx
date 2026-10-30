"use client";

import { useEffect, useMemo, useRef } from "react";
import type { KeyFeedback } from "@/hooks/usePianoGame";
import {
  noteName,
  PIANO_RANGE,
  spellMidi,
  type Notation,
} from "@/lib/music";

interface PianoProps {
  notation: Notation;
  showNames: boolean;
  hintMidi: number | null;
  feedback: KeyFeedback | null;
  onPress: (midi: number) => void;
  onHover: (midi: number | null) => void;
}

export function Piano({
  notation,
  showNames,
  hintMidi,
  feedback,
  onPress,
  onHover,
}: PianoProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const keyRefs = useRef<Record<number, HTMLButtonElement | null>>({});
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

  useEffect(() => {
    if (hintMidi === null) return;
    keyRefs.current[hintMidi]?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [hintMidi]);

  return (
    <section className="piano-shell" aria-label="Piano">
      <div className="keys-scroll" ref={scrollRef}>
        <div className="piano-keys">
          {keys.map((midi) => {
            const spelling = spellMidi(midi);
            const black = spelling.accidental === 1;
            const whiteBefore = black ? whiteKeys.indexOf(midi - 1) : -1;
            const feedbackClass = feedback?.midi === midi
              ? ` is-${feedback.kind}`
              : "";
            const hintClass = hintMidi === midi ? " is-hint" : "";
            const style = black ? {
              left: `${((whiteBefore + 1) / whiteKeys.length) * 100 - (0.31 / whiteKeys.length) * 100}%`,
              width: `${(0.62 / whiteKeys.length) * 100}%`,
            } : undefined;
            const name = noteName(spelling.letterIndex, spelling.accidental, notation);
            return (
              <button
                key={midi}
                ref={(element) => { keyRefs.current[midi] = element; }}
                type="button"
                className={`${black ? "black-key" : "white-key"}${feedbackClass}${hintClass}${midi === 60 ? " middle-c" : ""}`}
                style={style}
                aria-label={`${name} ${spelling.octave}${midi === 60 ? ", Dó central" : ""}`}
                onPointerDown={(event) => {
                  if (event.button === 0) onPress(midi);
                }}
                onClick={(event) => {
                  if (event.detail === 0) onPress(midi);
                }}
                onPointerEnter={(event) => {
                  if (event.pointerType === "mouse") onHover(midi);
                }}
                onPointerLeave={() => onHover(null)}
              >
                {!black && (
                  <span className="key-label">
                    <span className={showNames ? "" : "visually-hidden"}>{name}</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
