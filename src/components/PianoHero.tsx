"use client";

import { useEffect, useState } from "react";
import { SONGS, SONG_BY_ID } from "@/data/songs";
import { usePianoGame } from "@/hooks/usePianoGame";
import type { Difficulty } from "@/lib/music";
import { Piano } from "./Piano";
import { Staff } from "./Staff";
import { StatsModal } from "./StatsModal";

const KEY_MAP: Record<string, number> = {
  a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7,
  y: 8, h: 9, u: 10, j: 11, k: 12, o: 13, l: 14,
  p: 15, "ç": 16, ";": 16,
};

const DIFFICULTY_LABELS = {
  easy: "Fácil · saltos de 1–2",
  medium: "Médio · saltos de 3–5",
  hard: "Difícil · saltos de 6–9",
  "easy-scales": "Fácil com escalas · até 1 acidente",
  "medium-scales": "Médio com escalas · 2–3 acidentes",
  "hard-scales": "Difícil com escalas · 4–6 acidentes",
} as const;

export function PianoHero() {
  const game = usePianoGame();
  const [hoverMidi, setHoverMidi] = useState<number | null>(null);
  const [statsOpen, setStatsOpen] = useState(false);
  const { clef, press } = game;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
      const target = event.target as HTMLElement;
      if (["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(target.tagName)) return;
      const offset = KEY_MAP[event.key.toLowerCase()];
      if (offset === undefined) return;
      event.preventDefault();
      press((clef === "treble" ? 60 : 48) + offset);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [clef, press]);

  const song = SONG_BY_ID[game.preferences.songId] ?? SONG_BY_ID["fur-elise"];
  const ghostMidi = game.wrongMidi ?? (
    game.preferences.preview ? hoverMidi : null
  );

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">LEITURA MUSICAL INTERATIVA</p>
          <h1>Piano<span>Hero</span></h1>
          <p className="lede">
            Leia a nota, encontre a tecla e construa sua sequência.
          </p>
        </div>
        <div className="hero-score" aria-label={`Pontuação: ${game.score}`}>
          <span>PONTOS</span>
          <strong>{game.score.toLocaleString("pt-BR")}</strong>
          <small>Recorde {game.currentRecord?.score?.toLocaleString("pt-BR") ?? 0}</small>
        </div>
      </header>

      <section className="control-panel" aria-label="Configurações da partida">
        <div className="mode-tabs" role="radiogroup" aria-label="Modo de jogo">
          <label>
            <input
              type="radio"
              name="mode"
              checked={game.preferences.mode === "songs"}
              onChange={() => game.changePreferences({ mode: "songs" })}
            />
            <span>Músicas</span>
          </label>
          <label>
            <input
              type="radio"
              name="mode"
              checked={game.preferences.mode === "practice"}
              onChange={() => game.changePreferences({ mode: "practice" })}
            />
            <span>Notas avulsas</span>
          </label>
        </div>

        <div className="control-fields">
          {game.preferences.mode === "songs" ? (
            <label className="field">
              <span>Música</span>
              <select
                value={game.preferences.songId}
                onChange={(event) => game.changePreferences({ songId: event.target.value })}
              >
                {(["Intermediária", "Avançada"] as const).map((level) => (
                  <optgroup key={level} label={level}>
                    {SONGS.filter((item) => item.level === level).map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title} · {item.composer} · mão {item.hand.toLowerCase()}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
          ) : (
            <>
              <label className="field">
                <span>Clave e mão</span>
                <select
                  value={game.preferences.clef}
                  onChange={(event) => game.changePreferences({
                    clef: event.target.value as "treble" | "bass",
                  })}
                >
                  <option value="treble">Clave de sol · mão direita</option>
                  <option value="bass">Clave de fá · mão esquerda</option>
                </select>
              </label>
              <label className="field">
                <span>Dificuldade</span>
                <select
                  value={game.preferences.difficulty}
                  onChange={(event) => game.changePreferences({
                    difficulty: event.target.value as Difficulty,
                  })}
                >
                  {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
            </>
          )}
        </div>

        <div className="actions">
          <button className="button secondary" type="button" onClick={game.listen}>
            {game.listening ? "Parar" : "Ouvir"}
          </button>
          <button className="button secondary" type="button" onClick={game.showHint}>
            Mostrar tecla
          </button>
          <button className="button primary" type="button" onClick={game.retry}>
            Recomeçar
          </button>
        </div>
      </section>

      <section className="sheet-card" aria-label="Partitura">
        <div className="sheet-heading">
          <div>
            <span className="sheet-kicker">
              {game.preferences.mode === "songs"
                ? `${song.composer} · ${song.level} · mão ${song.hand.toLowerCase()} · ${game.clef === "treble" ? "clave de sol" : "clave de fá"}`
                : `${game.clef === "treble" ? "Mão direita · clave de sol" : "Mão esquerda · clave de fá"}`}
            </span>
            <h2>{game.title}</h2>
          </div>
          <div className="stats" aria-label="Estatísticas da partida">
            <span><b>{game.hits}</b> acertos</span>
            <span><b>{game.misses}</b> erros</span>
            <span><b>{game.accuracy}%</b> precisão</span>
            <span><b>{game.streak}</b> sequência</span>
            <span><b>{game.bestStreak}</b> melhor</span>
            <button className="details-button" type="button" onClick={() => setStatsOpen(true)}>
              Ver detalhes
            </button>
          </div>
        </div>

        <Staff
          notes={game.notes}
          clef={game.clef}
          title={game.title}
          currentIndex={game.index}
          listeningIndex={game.listenIndex}
          listening={game.listening}
          complete={game.complete}
          notation={game.preferences.notation}
          showNames={game.preferences.staffNames}
          ghostMidi={ghostMidi}
          ghostBad={game.wrongMidi !== null}
          minimumMeasures={game.preferences.mode === "practice" ? 4 : 1}
          keySignature={game.keySignature}
        />

        <div className={`message is-${game.message.tone}`} aria-live="polite">
          <span>{game.message.text}</span>
          {game.complete && game.preferences.mode === "songs" && (
            <button className="button primary" type="button" onClick={game.retry}>
              Tocar de novo
            </button>
          )}
        </div>
      </section>

      <Piano
        notation={game.preferences.notation}
        showNames={game.preferences.keyNames}
        hintMidi={game.hintMidi}
        feedback={game.feedback}
        onPress={game.press}
        onHover={setHoverMidi}
      />

      <section className="options" aria-label="Opções de exibição">
        <label>
          <input
            type="checkbox"
            checked={game.preferences.keyNames}
            onChange={(event) => game.changePreferences({ keyNames: event.target.checked })}
          />
          Nomes nas teclas
        </label>
        <label>
          <input
            type="checkbox"
            checked={game.preferences.staffNames}
            onChange={(event) => game.changePreferences({ staffNames: event.target.checked })}
          />
          Nomes na partitura
        </label>
        <label className="preview-option">
          <input
            type="checkbox"
            checked={game.preferences.preview}
            onChange={(event) => game.changePreferences({ preview: event.target.checked })}
          />
          Prévia da tecla na pauta
        </label>
        <div className="notation-toggle" role="radiogroup" aria-label="Nomes das notas">
          <label>
            <input
              type="radio"
              name="notation"
              checked={game.preferences.notation === "pt"}
              onChange={() => game.changePreferences({ notation: "pt" })}
            />
            <span>Dó Ré Mi</span>
          </label>
          <label>
            <input
              type="radio"
              name="notation"
              checked={game.preferences.notation === "en"}
              onChange={() => game.changePreferences({ notation: "en" })}
            />
            <span>C D E</span>
          </label>
        </div>
      </section>

      <p className="keyboard-tip">
        Teclado: A S D F G H J K nas teclas brancas; W E T Y U nas pretas.
      </p>

      <details className="guide">
        <summary>Como ler as notas</summary>
        <div className="guide-grid">
          <article>
            <h3>Clave de sol</h3>
            <p>
              Usada pela mão direita. Linhas: Mi, Sol, Si, Ré, Fá.
              Espaços: Fá, Lá, Dó, Mi. O Dó central fica na linha extra inferior.
            </p>
          </article>
          <article>
            <h3>Clave de fá</h3>
            <p>
              Usada pela mão esquerda. Linhas: Sol, Si, Ré, Fá, Lá.
              Espaços: Lá, Dó, Mi, Sol. O Dó central fica na linha extra superior.
            </p>
          </article>
          <article>
            <h3>Pontuação</h3>
            <p>
              Acertos rápidos e sequências valem mais. Erros e dicas reduzem
              os pontos da nota, mas sua pontuação nunca diminui.
            </p>
            <h3>Sustenidos e bemóis</h3>
            <p>
              O ♯ sobe a nota meio tom e o ♭ desce meio tom. No piano, eles
              normalmente indicam as teclas pretas entre duas notas naturais.
              O ♮ cancela temporariamente o acidente indicado na armadura.
            </p>
          </article>
        </div>
      </details>

      <StatsModal
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        bestStreak={game.lifetimeBestStreak}
        notation={game.preferences.notation}
        notes={game.notePerformance}
        onReset={game.resetDetailedStats}
      />
    </main>
  );
}
