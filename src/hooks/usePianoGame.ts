"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SONG_BY_ID } from "@/data/songs";
import { playMidi } from "@/lib/audio";
import {
  accuracyPercent,
  completionBonus,
  DEFAULT_PREFERENCES,
  loadPreferences,
  loadRecords,
  type Preferences,
  savePreferences,
  saveRecords,
  scoreNote,
  sessionKey,
  type Records,
} from "@/lib/game";
import {
  generatePracticeBatch,
  midiName,
  noteName,
  parseSequence,
  pitchDirection,
  type KeySignature,
  type Note,
} from "@/lib/music";

type MessageTone = "neutral" | "good" | "bad";

interface Message {
  text: string;
  tone: MessageTone;
}

export interface KeyFeedback {
  midi: number;
  kind: "down" | "good" | "bad" | "play";
  id: number;
}

export interface NotePerformance {
  key: string;
  letterIndex: number;
  accidental: number;
  naturalSign: boolean;
  octave: number;
  hits: number;
  misses: number;
  hints: number;
  totalResponseMs: number;
}

const initialNotes = parseSequence(SONG_BY_ID.escala.notes);

function performanceKey(note: Note) {
  return `${note.letterIndex}:${note.accidental}:${note.naturalSign ? 1 : 0}:${note.octave}`;
}

function nowMs() {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}

export function usePianoGame() {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [index, setIndex] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [usedHint, setUsedHint] = useState(false);
  const [hintMidi, setHintMidi] = useState<number | null>(null);
  const [complete, setComplete] = useState(false);
  const [message, setMessage] = useState<Message>({
    text: "Toque no piano a nota destacada em azul.",
    tone: "neutral",
  });
  const [records, setRecords] = useState<Records>({});
  const [listening, setListening] = useState(false);
  const [listenIndex, setListenIndex] = useState(-1);
  const [feedback, setFeedback] = useState<KeyFeedback | null>(null);
  const [wrongMidi, setWrongMidi] = useState<number | null>(null);
  const [practiceScale, setPracticeScale] = useState<string | null>(null);
  const [keySignature, setKeySignature] = useState<KeySignature | null>(null);
  const [notePerformance, setNotePerformance] = useState<Record<string, NotePerformance>>({});
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const feedbackId = useRef(0);
  const hydrated = useRef(false);
  const noteStartedAt = useRef(nowMs());

  const stopListening = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setListening(false);
    setListenIndex(-1);
    noteStartedAt.current = nowMs();
  }, []);

  const contentFor = useCallback((nextPreferences: Preferences) => {
    if (nextPreferences.mode === "practice") {
      return generatePracticeBatch(nextPreferences.clef, nextPreferences.difficulty, 16);
    }
    const song = SONG_BY_ID[nextPreferences.songId] ?? SONG_BY_ID.escala;
    return { notes: parseSequence(song.notes), scaleName: null, keySignature: null };
  }, []);

  const resetSession = useCallback((
    nextPreferences = preferences,
    preserveStats = false,
  ) => {
    stopListening();
    const content = contentFor(nextPreferences);
    setNotes(content.notes);
    setPracticeScale(content.scaleName);
    setKeySignature(content.keySignature);
    setIndex(0);
    setWrongAttempts(0);
    setUsedHint(false);
    setHintMidi(null);
    setWrongMidi(null);
    setFeedback(null);
    setComplete(false);
    noteStartedAt.current = nowMs();
    if (!preserveStats) {
      setHits(0);
      setMisses(0);
      setStreak(0);
      setBestStreak(0);
      setScore(0);
      setNotePerformance({});
    }
    setMessage({
      text: nextPreferences.mode === "practice"
        ? "Toque a nota destacada. Uma nova rodada chega após 16 acertos."
        : "Toque no piano a nota destacada em azul.",
      tone: "neutral",
    });
    noteStartedAt.current = nowMs();
  }, [contentFor, preferences, stopListening]);

  useEffect(() => {
    const saved = loadPreferences();
    if (!SONG_BY_ID[saved.songId]) saved.songId = "escala";
    // Hydration is the boundary where browser-only preferences enter the app.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreferences(saved);
    setRecords(loadRecords());
    const content = contentFor(saved);
    setNotes(content.notes);
    setPracticeScale(content.scaleName);
    setKeySignature(content.keySignature);
    setMessage({
      text: saved.mode === "practice"
        ? "Toque a nota destacada. Uma nova rodada chega após 16 acertos."
        : "Toque no piano a nota destacada em azul.",
      tone: "neutral",
    });
    setTimeout(() => {
      hydrated.current = true;
    }, 0);
  }, [contentFor]);

  useEffect(() => () => stopListening(), [stopListening]);

  useEffect(() => {
    if (hydrated.current) savePreferences(preferences);
  }, [preferences]);

  const updateRecord = useCallback((
    finalScore: number,
    finalHits: number,
    finalMisses: number,
    finalBestStreak: number,
  ) => {
    const key = sessionKey(
      preferences.mode,
      preferences.songId,
      preferences.clef,
      preferences.difficulty,
    );
    setRecords((current) => {
      const previous = current[key];
      const candidate = {
        score: Math.max(previous?.score ?? 0, finalScore),
        accuracy: Math.max(previous?.accuracy ?? 0, accuracyPercent(finalHits, finalMisses)),
        bestStreak: Math.max(previous?.bestStreak ?? 0, finalBestStreak),
      };
      const next = { ...current, [key]: candidate };
      saveRecords(next);
      return next;
    });
  }, [preferences]);

  const startNextPracticeBatch = useCallback(() => {
    const content = generatePracticeBatch(
      preferences.clef,
      preferences.difficulty,
      16,
    );
    setNotes(content.notes);
    setPracticeScale(content.scaleName);
    setKeySignature(content.keySignature);
    setIndex(0);
    setWrongAttempts(0);
    setUsedHint(false);
    setHintMidi(null);
    setComplete(false);
    noteStartedAt.current = nowMs();
    setMessage({
      text: content.scaleName
        ? `Novas notas em ${content.scaleName}. Continue!`
        : "Novas notas. Continue!",
      tone: "neutral",
    });
  }, [preferences.clef, preferences.difficulty]);

  const press = useCallback((midi: number) => {
    playMidi(midi);
    if (listening || complete) return;
    const current = notes[index];
    if (!current) return;

    if (midi === current.midi) {
      const responseMs = Math.min(60_000, Math.max(0, nowMs() - noteStartedAt.current));
      const statKey = performanceKey(current);
      setNotePerformance((performance) => {
        const previous = performance[statKey] ?? {
          key: statKey,
          letterIndex: current.letterIndex,
          accidental: current.accidental,
          naturalSign: Boolean(current.naturalSign),
          octave: current.octave,
          hits: 0,
          misses: 0,
          hints: 0,
          totalResponseMs: 0,
        };
        return {
          ...performance,
          [statKey]: {
            ...previous,
            hits: previous.hits + 1,
            totalResponseMs: previous.totalResponseMs + responseMs,
          },
        };
      });
      const earned = scoreNote(streak, wrongAttempts, usedHint);
      const nextHits = hits + 1;
      const nextStreak = streak + 1;
      const nextBestStreak = Math.max(bestStreak, nextStreak);
      const isLast = index === notes.length - 1;
      let nextScore = score + earned;

      setHits(nextHits);
      setStreak(nextStreak);
      setBestStreak(nextBestStreak);
      setScore(nextScore);
      setWrongAttempts(0);
      setUsedHint(false);
      setHintMidi(null);
      setFeedback({ midi, kind: "good", id: ++feedbackId.current });
      timers.current.push(setTimeout(() => setFeedback(null), 420));

      if (isLast) {
        setIndex(notes.length);
        if (preferences.mode === "songs") {
          const bonus = completionBonus(nextHits, misses);
          nextScore += bonus;
          setScore(nextScore);
          setComplete(true);
          setMessage({
            text: `Música completa: ${nextScore} pontos, ${accuracyPercent(nextHits, misses)}% de precisão e ${misses} ${misses === 1 ? "erro" : "erros"}. Bônus de ${bonus} pontos.`,
            tone: "good",
          });
          updateRecord(nextScore, nextHits, misses, nextBestStreak);
        } else {
          setComplete(true);
          setMessage({
            text: `Rodada completa! ${earned} pontos na última nota.`,
            tone: "good",
          });
          updateRecord(nextScore, nextHits, misses, nextBestStreak);
          timers.current.push(setTimeout(startNextPracticeBatch, 900));
        }
      } else {
        setIndex((currentIndex) => currentIndex + 1);
        noteStartedAt.current = nowMs();
        setMessage({
          text: `Isso! ${noteName(current.letterIndex, current.accidental, preferences.notation, current.naturalSign)} valeu ${earned} pontos.`,
          tone: "good",
        });
      }
    } else {
      const statKey = performanceKey(current);
      setNotePerformance((performance) => {
        const previous = performance[statKey] ?? {
          key: statKey,
          letterIndex: current.letterIndex,
          accidental: current.accidental,
          naturalSign: Boolean(current.naturalSign),
          octave: current.octave,
          hits: 0,
          misses: 0,
          hints: 0,
          totalResponseMs: 0,
        };
        return {
          ...performance,
          [statKey]: { ...previous, misses: previous.misses + 1 },
        };
      });
      setMisses((value) => value + 1);
      setStreak(0);
      setWrongAttempts((value) => value + 1);
      setHintMidi(null);
      setFeedback({ midi, kind: "bad", id: ++feedbackId.current });
      setWrongMidi(midi);
      timers.current.push(setTimeout(() => setFeedback(null), 520));
      timers.current.push(setTimeout(() => setWrongMidi(null), 1_300));
      const played = midiName(midi, preferences.notation);
      const octaveMessage = midi % 12 === current.midi % 12
        ? " O nome está certo, mas a oitava não."
        : "";
      setMessage({
        text: `Você tocou ${played}.${octaveMessage} A nota é ${pitchDirection(midi, current.midi)}.`,
        tone: "bad",
      });
    }
  }, [
    bestStreak, complete, hits, index, listening, misses, notes, preferences.mode,
    preferences.notation, score, startNextPracticeBatch, streak, updateRecord,
    usedHint, wrongAttempts,
  ]);

  const showHint = useCallback(() => {
    if (complete || listening || !notes[index]) return;
    const current = notes[index];
    if (!usedHint) {
      const statKey = performanceKey(current);
      setNotePerformance((performance) => {
        const previous = performance[statKey] ?? {
          key: statKey,
          letterIndex: current.letterIndex,
          accidental: current.accidental,
          naturalSign: Boolean(current.naturalSign),
          octave: current.octave,
          hits: 0,
          misses: 0,
          hints: 0,
          totalResponseMs: 0,
        };
        return {
          ...performance,
          [statKey]: { ...previous, hints: previous.hints + 1 },
        };
      });
    }
    setUsedHint(true);
    setHintMidi(current.midi);
    setMessage({
      text: `A tecla de ${noteName(current.letterIndex, current.accidental, preferences.notation, current.naturalSign)} está piscando.`,
      tone: "neutral",
    });
  }, [complete, index, listening, notes, preferences.notation, usedHint]);

  const listen = useCallback(() => {
    if (listening) {
      stopListening();
      return;
    }
    setListening(true);
    const beatMs = 600;
    notes.forEach((note, noteIndex) => {
      timers.current.push(setTimeout(() => {
        playMidi(note.midi, Math.max(0.5, note.beats * beatMs / 1000) + 0.25);
        setListenIndex(noteIndex);
        setFeedback({ midi: note.midi, kind: "play", id: ++feedbackId.current });
        timers.current.push(setTimeout(() => setFeedback(null), 380));
      }, note.start * beatMs));
    });
    const last = notes.at(-1)!;
    timers.current.push(setTimeout(
      stopListening,
      (last.start + last.beats) * beatMs + 150,
    ));
  }, [listening, notes, stopListening]);

  const changePreferences = useCallback((patch: Partial<Preferences>) => {
    const next = { ...preferences, ...patch };
    setPreferences(next);
    const restartsGame = (["mode", "songId", "clef", "difficulty"] as const)
      .some((key) => key in patch && next[key] !== preferences[key]);
    if (restartsGame) resetSession(next);
  }, [preferences, resetSession]);

  const retry = useCallback(() => resetSession(preferences), [preferences, resetSession]);

  const difficultyLabel = {
    easy: "Fácil",
    medium: "Médio",
    hard: "Difícil",
    "easy-scales": "Fácil com escalas",
    "medium-scales": "Médio com escalas",
    "hard-scales": "Difícil com escalas",
  }[preferences.difficulty];
  const title = preferences.mode === "songs"
    ? (SONG_BY_ID[preferences.songId] ?? SONG_BY_ID.escala).title
    : `Notas avulsas · ${difficultyLabel}${practiceScale ? ` · ${practiceScale}` : ""}`;
  const clef = preferences.mode === "songs"
    ? (SONG_BY_ID[preferences.songId] ?? SONG_BY_ID.escala).clef
    : preferences.clef;
  const currentRecord = records[sessionKey(
    preferences.mode,
    preferences.songId,
    preferences.clef,
    preferences.difficulty,
  )];

  return {
    preferences,
    changePreferences,
    notes,
    index,
    hits,
    misses,
    streak,
    bestStreak,
    score,
    accuracy: accuracyPercent(hits, misses),
    message,
    complete,
    listening,
    listenIndex,
    feedback,
    wrongMidi,
    hintMidi,
    keySignature,
    notePerformance: Object.values(notePerformance),
    title,
    clef,
    currentRecord,
    press,
    showHint,
    listen,
    retry,
  };
}
