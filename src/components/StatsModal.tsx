"use client";

import { useEffect, useMemo, useState } from "react";
import type { NotePerformance } from "@/lib/game";
import { noteName, type Notation } from "@/lib/music";
import { MiniPianoStats } from "./MiniPianoStats";

interface StatsModalProps {
  open: boolean;
  onClose: () => void;
  bestStreak: number;
  notation: Notation;
  notes: NotePerformance[];
  onReset: () => void;
}

function noteAccuracy(note: NotePerformance) {
  const attempts = note.hits + note.misses;
  return attempts ? Math.round((note.hits / attempts) * 100) : 0;
}

function displayName(note: NotePerformance, notation: Notation) {
  return `${noteName(
    note.letterIndex,
    note.accidental,
    notation,
    note.naturalSign,
  )}${note.octave}`;
}

export function StatsModal({
  open,
  onClose,
  bestStreak,
  notation,
  notes,
  onReset,
}: StatsModalProps) {
  const [resetArmed, setResetArmed] = useState(false);
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setResetArmed(false);
        onClose();
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, open]);

  const details = useMemo(() => {
    const hits = notes.reduce((sum, note) => sum + note.hits, 0);
    const misses = notes.reduce((sum, note) => sum + note.misses, 0);
    const attempts = hits + misses;
    const accuracy = attempts ? Math.round((hits / attempts) * 100) : 100;
    const hints = notes.reduce((sum, note) => sum + note.hints, 0);
    const responseMs = notes.reduce((sum, note) => sum + note.totalResponseMs, 0);
    const sorted = [...notes].sort((a, b) =>
      b.misses - a.misses ||
      noteAccuracy(a) - noteAccuracy(b) ||
      b.hits - a.hits);
    const mastered = [...notes]
      .filter((note) => note.hits > 0)
      .sort((a, b) =>
        b.hits - a.hits ||
        noteAccuracy(b) - noteAccuracy(a))[0];
    const needsPractice = sorted.find((note) => note.misses > 0);
    return {
      attempts,
      hits,
      misses,
      accuracy,
      hints,
      averageResponse: hits ? responseMs / hits / 1000 : 0,
      sorted,
      mastered,
      needsPractice,
    };
  }, [notes]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          setResetArmed(false);
          onClose();
        }
      }}
    >
      <section
        className="stats-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="stats-modal-title"
      >
        <header className="modal-header">
          <div>
            <span className="sheet-kicker">DESEMPENHO DA SESSÃO</span>
            <h2 id="stats-modal-title">Estatísticas detalhadas</h2>
          </div>
          <button
            className="modal-close"
            type="button"
            onClick={() => {
              setResetArmed(false);
              onClose();
            }}
            aria-label="Fechar estatísticas"
          >
            ×
          </button>
        </header>

        <div className="summary-grid">
          <div><span>Acertos</span><strong>{details.hits}</strong></div>
          <div><span>Erros</span><strong>{details.misses}</strong></div>
          <div><span>Precisão</span><strong>{details.accuracy}%</strong></div>
          <div><span>Tentativas</span><strong>{details.attempts}</strong></div>
          <div><span>Melhor sequência</span><strong>{bestStreak}</strong></div>
          <div><span>Tempo médio</span><strong>{details.averageResponse.toFixed(1)}s</strong></div>
          <div><span>Dicas usadas</span><strong>{details.hints}</strong></div>
          <div><span>Notas praticadas</span><strong>{notes.length}</strong></div>
        </div>

        <div className="insight-grid">
          <article>
            <span>Nota mais acertada</span>
            <strong>
              {details.mastered ? displayName(details.mastered, notation) : "—"}
            </strong>
            <small>
              {details.mastered
                ? `${noteAccuracy(details.mastered)}% de precisão`
                : "Toque algumas notas para descobrir"}
            </small>
          </article>
          <article>
            <span>Precisa de mais treino</span>
            <strong>
              {details.needsPractice ? displayName(details.needsPractice, notation) : "—"}
            </strong>
            <small>
              {details.needsPractice
                ? `${details.needsPractice.misses} ${details.needsPractice.misses === 1 ? "erro" : "erros"}`
                : "Nenhum erro até agora"}
            </small>
          </article>
          <article>
            <span>Histórico acumulado</span>
            <strong>{details.attempts}</strong>
            <small>tentativas desde o último reset</small>
          </article>
        </div>

        <div className="note-stats-section">
          <h3>Mapa de desempenho por tecla</h3>
          {details.sorted.length === 0 ? (
            <p className="empty-stats">As estatísticas aparecerão depois da primeira tentativa.</p>
          ) : (
            <MiniPianoStats notes={notes} notation={notation} />
          )}
        </div>

        <footer className="stats-modal-footer">
          <p>Estas estatísticas são independentes da pontuação e ficam salvas neste dispositivo.</p>
          <button
            className={`reset-stats-button${resetArmed ? " is-armed" : ""}`}
            type="button"
            onClick={() => {
              if (resetArmed) {
                onReset();
                setResetArmed(false);
              } else {
                setResetArmed(true);
              }
            }}
          >
            {resetArmed ? "Confirmar reset" : "Resetar estatísticas"}
          </button>
        </footer>
      </section>
    </div>
  );
}
