import type { Song } from "@/lib/music";

export const SONGS: Song[] = [
  {
    id: "escala",
    title: "Escala de Dó",
    clef: "treble",
    hand: "Direita",
    notes: "C4 D4 E4 F4 G4 A4 B4 C5 C5 B4 A4 G4 F4 E4 D4 C4",
  },
  {
    id: "estrelinha",
    title: "Brilha, Brilha, Estrelinha",
    clef: "treble",
    hand: "Direita",
    notes: "C4 C4 G4 G4 A4 A4 G4:h F4 F4 E4 E4 D4 D4 C4:h G4 G4 F4 F4 E4 E4 D4:h G4 G4 F4 F4 E4 E4 D4:h C4 C4 G4 G4 A4 A4 G4:h F4 F4 E4 E4 D4 D4 C4:h",
  },
  {
    id: "carneirinho",
    title: "Mary Tinha um Carneirinho",
    clef: "treble",
    hand: "Direita",
    notes: "E4 D4 C4 D4 E4 E4 E4:h D4 D4 D4:h E4 G4 G4:h E4 D4 C4 D4 E4 E4 E4 E4 D4 D4 E4 D4 C4:w",
  },
  {
    id: "ode",
    title: "Ode à Alegria",
    clef: "treble",
    hand: "Direita",
    notes: "E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 E4 D4 D4:h E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4 C4 C4:h",
  },
  {
    id: "escala-fa",
    title: "Escala de Dó — clave de fá",
    clef: "bass",
    hand: "Esquerda",
    notes: "C3 D3 E3 F3 G3 A3 B3 C4 B3 A3 G3 F3 E3 D3 C3:h",
  },
  {
    id: "frere-jacques",
    title: "Frère Jacques",
    clef: "treble",
    hand: "Direita",
    notes: "C4 D4 E4 C4 C4 D4 E4 C4 E4 F4 G4:h E4 F4 G4:h G4 A4 G4 F4 E4 C4 G4 A4 G4 F4 E4 C4 C4 G3 C4:h C4 G3 C4:h",
  },
  {
    id: "jingle-bells",
    title: "Jingle Bells",
    clef: "treble",
    hand: "Direita",
    notes: "E4 E4 E4:h E4 E4 E4:h E4 G4 C4 D4 E4:w F4 F4 F4 F4 F4 E4 E4 E4 E4 D4 D4 E4 D4:h G4:h",
  },
  {
    id: "parabens",
    title: "Parabéns pra Você",
    clef: "treble",
    hand: "Direita",
    notes: "G4 G4 A4 G4 C5 B4:h G4 G4 A4 G4 D5 C5:h G4 G4 G5 E5 C5 B4 A4:h F5 F5 E5 C5 D5 C5:w",
  },
  {
    id: "saints",
    title: "When the Saints Go Marching In",
    clef: "treble",
    hand: "Direita",
    notes: "C4 E4 F4 G4:w C4 E4 F4 G4:w C4 E4 F4 G4 E4 C4 E4 D4:h E4 E4 D4 C4:h C4 E4 G4 G4 G4:h F4:h E4 F4 G4 E4 C4 D4 C4:w",
  },
  {
    id: "amazing-grace",
    title: "Amazing Grace",
    clef: "treble",
    hand: "Direita",
    notes: "G4:h C5:w E5:h C5:h E5:w D5:h C5:w A4:h G4:w G4:h C5:w E5:h C5:h E5:w D5:w G5:w E5:w G5:h E5:h C5:w",
  },
];

export const SONG_BY_ID = Object.fromEntries(SONGS.map((song) => [song.id, song]));
