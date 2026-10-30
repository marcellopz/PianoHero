let context: AudioContext | null = null;
let master: GainNode | null = null;

function ensureAudio() {
  if (typeof window === "undefined") return null;
  if (!context) {
    context = new AudioContext();
    const compressor = context.createDynamicsCompressor();
    master = context.createGain();
    master.gain.value = 0.55;
    master.connect(compressor);
    compressor.connect(context.destination);
  }
  if (context.state === "suspended") void context.resume();
  return context;
}

export function playMidi(midi: number, duration = 1.4) {
  const ctx = ensureAudio();
  if (!ctx || !master) return;

  const start = ctx.currentTime;
  const frequency = 440 * 2 ** ((midi - 69) / 12);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.5, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.16, start + 0.3);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(Math.min(frequency * 9, 10_000), start);
  filter.frequency.exponentialRampToValueAtTime(
    Math.max(frequency * 2.2, 500),
    start + duration,
  );
  filter.connect(gain);
  gain.connect(master);

  const harmonics: Array<[number, number, OscillatorType]> = [
    [1, 1, "triangle"],
    [2, 0.32, "sine"],
    [3, 0.1, "sine"],
    [4, 0.04, "sine"],
  ];
  harmonics.forEach(([harmonic, volume, type]) => {
    const oscillator = ctx.createOscillator();
    const oscillatorGain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency * harmonic;
    oscillatorGain.gain.value = volume;
    oscillator.connect(oscillatorGain);
    oscillatorGain.connect(filter);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.05);
  });
}
