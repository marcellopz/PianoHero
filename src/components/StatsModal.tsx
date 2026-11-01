"use client";

import { useEffect, useMemo } from "react";
import type { NotePerformance } from "@/hooks/usePianoGame";
import { noteName, type Notation } from "@/lib/music";

interface StatsModalProps {
  open: boolean;
  onClose: () => void;
  score: number;
  hits: number;
  misses: number;
  accuracy: number;
  streak: number;
  bestStreak: number;
  notation: Notation;
  notes: NotePerformance[];
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
  score,
  hits,
  misses,
  accuracy,
  streak,
  bestStreak,
  notation,
  notes,
}: StatsModalProps) {
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
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
    const attempts = hits + misses;
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
      hints,
      averageResponse: hits ? responseMs / hits / 1000 : 0,
      sorted,
      mastered,
      needsPractice,
    };
  }, [hits, misses, notes]);

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
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
          <button className="modal-close" type="button" onClick={onClose} aria-label="Fechar estatísticas">
            ×
          </button>
        </header>

        <div className="summary-grid">
          <div><span>Pontos</span><strong>{score.toLocaleString("pt-BR")}</strong></div>
          <div><span>Precisão</span><strong>{accuracy}%</strong></div>
          <div><span>Tentativas</span><strong>{details.attempts}</strong></div>
          <div><span>Melhor sequência</span><strong>{bestStreak}</strong></div>
          <div><span>Tempo médio</span><strong>{details.averageResponse.toFixed(1)}s</strong></div>
          <div><span>Dicas usadas</span><strong>{details.hints}</strong></div>
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
            <span>Sequência atual</span>
            <strong>{streak}</strong>
            <small>{hits} notas acertadas na sessão</small>
          </article>
        </div>

        <div className="note-stats-section">
          <h3>Desempenho por nota</h3>
          {details.sorted.length === 0 ? (
            <p className="empty-stats">As estatísticas aparecerão depois da primeira tentativa.</p>
          ) : (
            <div className="stats-table-scroll">
              <table className="note-stats-table">
                <thead>
                  <tr>
                    <th>Nota</th>
                    <th>Acertos</th>
                    <th>Erros</th>
                    <th>Precisão</th>
                    <th>Tempo médio</th>
                    <th>Dicas</th>
                  </tr>
                </thead>
                <tbody>
                  {details.sorted.map((note) => (
                    <tr key={note.key}>
                      <th>{displayName(note, notation)}</th>
                      <td>{note.hits}</td>
                      <td>{note.misses}</td>
                      <td>{noteAccuracy(note)}%</td>
                      <td>{note.hits ? `${(note.totalResponseMs / note.hits / 1000).toFixed(1)}s` : "—"}</td>
                      <td>{note.hints}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
