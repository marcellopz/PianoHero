"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  noteName,
  spellMidi,
  type Clef,
  type Note,
  type Notation,
} from "@/lib/music";

interface StaffProps {
  notes: Note[];
  clef: Clef;
  title: string;
  currentIndex: number;
  listeningIndex: number;
  listening: boolean;
  complete: boolean;
  notation: Notation;
  showNames: boolean;
  ghostMidi: number | null;
  ghostBad: boolean;
  minimumMeasures?: number;
}

interface PositionedNote extends Note {
  row: number;
  x: number;
  y: number;
}

export function Staff({
  notes,
  clef,
  title,
  currentIndex,
  listeningIndex,
  listening,
  complete,
  notation,
  showNames,
  ghostMidi,
  ghostBad,
  minimumMeasures = 1,
}: StaffProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(760);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.max(300, entry.contentRect.width));
    });
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  const layout = useMemo(() => {
    const viewWidth = Math.max(300, width);
    const staffStart = 70;
    const available = viewWidth - staffStart - 10;
    const measures = Math.max(
      minimumMeasures,
      Math.ceil(((notes.at(-1)?.start ?? 0) + (notes.at(-1)?.beats ?? 1)) / 4),
    );
    const measuresPerRow = Math.max(1, Math.min(4, Math.floor(available / 130)));
    const measureWidth = available / measuresPerRow;
    const rows = Math.max(1, Math.ceil(measures / measuresPerRow));
    const systemHeight = 132;
    const staffTop = 46;
    const bottomDegree = clef === "treble" ? 30 : 18;
    const yFor = (degree: number, row: number) =>
      row * systemHeight + staffTop + 40 - (degree - bottomDegree) * 5;
    const positioned: PositionedNote[] = notes.map((note) => {
      const measure = Math.floor(note.start / 4);
      const row = Math.floor(measure / measuresPerRow);
      const column = measure % measuresPerRow;
      const beat = note.start - measure * 4;
      return {
        ...note,
        row,
        x: staffStart + column * measureWidth + 20 + beat * ((measureWidth - 32) / 4),
        y: yFor(note.diatonic, row),
      };
    });
    return {
      viewWidth,
      measures,
      measuresPerRow,
      measureWidth,
      rows,
      systemHeight,
      staffTop,
      staffStart,
      bottomDegree,
      yFor,
      positioned,
      height: rows * systemHeight,
    };
  }, [clef, minimumMeasures, notes, width]);

  const focusIndex = listening ? listeningIndex : complete ? -1 : currentIndex;
  const focusNote = focusIndex >= 0 ? layout.positioned[focusIndex] : null;

  function ledgerLines(note: { x: number; row: number; diatonic: number }) {
    const lines: React.ReactNode[] = [];
    const topDegree = layout.bottomDegree + 8;
    for (let degree = layout.bottomDegree - 2; degree >= note.diatonic; degree -= 2) {
      const y = layout.yFor(degree, note.row);
      lines.push(<line key={`below-${degree}`} className="ledger-line" x1={note.x - 11} x2={note.x + 11} y1={y} y2={y} />);
    }
    for (let degree = topDegree + 2; degree <= note.diatonic; degree += 2) {
      const y = layout.yFor(degree, note.row);
      lines.push(<line key={`above-${degree}`} className="ledger-line" x1={note.x - 11} x2={note.x + 11} y1={y} y2={y} />);
    }
    return lines;
  }

  return (
    <div className="staff-scroll" ref={hostRef}>
      <svg
        className="staff-svg"
        viewBox={`0 0 ${layout.viewWidth} ${layout.height}`}
        role="img"
        aria-label={`Partitura de ${title}, ${clef === "treble" ? "clave de sol" : "clave de fá"}`}
      >
        {Array.from({ length: layout.rows }, (_, row) => {
          const top = row * layout.systemHeight + layout.staffTop;
          const rowMeasureStart = row * layout.measuresPerRow;
          const measureCount = Math.min(
            layout.measuresPerRow,
            layout.measures - rowMeasureStart,
          );
          const end = layout.staffStart + measureCount * layout.measureWidth;
          return (
            <g key={`row-${row}`}>
              {Array.from({ length: 5 }, (__, line) => (
                <line key={line} className="staff-line" x1={4} x2={end} y1={top + line * 10} y2={top + line * 10} />
              ))}
              <line className="bar-line" x1={4} x2={4} y1={top} y2={top + 40} />
              <text className="clef-symbol" x={13} y={top + (clef === "treble" ? 40 : 31)}>
                {clef === "treble" ? "𝄞" : "𝄢"}
              </text>
              {row === 0 && (
                <g className="time-signature">
                  <text x={55} y={top + 18}>4</text>
                  <text x={55} y={top + 38}>4</text>
                </g>
              )}
              {Array.from({ length: measureCount }, (__, column) => {
                const absoluteMeasure = rowMeasureStart + column;
                const x = layout.staffStart + (column + 1) * layout.measureWidth;
                const last = absoluteMeasure === layout.measures - 1;
                return last ? (
                  <g key={column}>
                    <line className="bar-line" x1={x - 6} x2={x - 6} y1={top} y2={top + 40} />
                    <line className="final-bar" x1={x - 2} x2={x - 2} y1={top} y2={top + 40} />
                  </g>
                ) : (
                  <line key={column} className="bar-line" x1={x} x2={x} y1={top} y2={top + 40} />
                );
              })}
            </g>
          );
        })}

        {focusNote && (
          <rect
            className="note-highlight"
            x={focusNote.x - 14}
            y={focusNote.row * layout.systemHeight + layout.staffTop - 30}
            width={28}
            height={100}
            rx={7}
          />
        )}

        {layout.positioned.map((note, noteIndex) => {
          const done = noteIndex < currentIndex;
          const current = noteIndex === focusIndex;
          const stemUp = note.diatonic < layout.bottomDegree + 4;
          const hollow = note.duration !== "q";
          const staffBottom = note.row * layout.systemHeight + layout.staffTop + 40;
          const labelY = Math.max(staffBottom + 18, (stemUp ? note.y + 18 : note.y + 46));
          return (
            <g
              key={`${note.start}-${note.midi}`}
              className={`staff-note${done ? " is-done" : ""}${current ? " is-current" : ""}`}
            >
              {ledgerLines(note)}
              {note.accidental === 1 && <text className="accidental" x={note.x - 16} y={note.y + 5}>♯</text>}
              {note.duration !== "w" && (
                <line
                  className="note-stem"
                  x1={stemUp ? note.x + 5.5 : note.x - 5.5}
                  x2={stemUp ? note.x + 5.5 : note.x - 5.5}
                  y1={stemUp ? note.y - 1 : note.y + 1}
                  y2={stemUp ? note.y - 34 : note.y + 34}
                />
              )}
              <ellipse
                className={`note-head${hollow ? " is-hollow" : ""}`}
                cx={note.x}
                cy={note.y}
                rx={note.duration === "w" ? 7 : 6.1}
                ry={4.4}
                transform={`rotate(-22 ${note.x} ${note.y})`}
              />
              {(showNames || done) && (
                <text className="staff-note-name" x={note.x} y={labelY}>
                  {noteName(note.letterIndex, note.accidental, notation)}
                </text>
              )}
            </g>
          );
        })}

        {ghostMidi !== null && layout.positioned[Math.min(currentIndex, notes.length - 1)] && (() => {
          const reference = layout.positioned[Math.min(currentIndex, notes.length - 1)];
          const spelling = spellMidi(ghostMidi);
          const y = layout.yFor(spelling.diatonic, reference.row);
          const ghost = { ...reference, diatonic: spelling.diatonic, y };
          return (
            <g className={`ghost-note${ghostBad ? " is-bad" : ""}`} aria-hidden="true">
              {ledgerLines(ghost)}
              {spelling.accidental === 1 && <text className="accidental" x={reference.x - 16} y={y + 5}>♯</text>}
              <ellipse className="note-head" cx={reference.x} cy={y} rx={6.1} ry={4.4} transform={`rotate(-22 ${reference.x} ${y})`} />
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
