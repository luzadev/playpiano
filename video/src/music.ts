// Brano originale in Re maggiore per il Reel: melodia (mano 0) e arpeggio (mano 1).
export type Note = { b: number; db: number; midi: number; hand: 0 | 1; vel: number };
export const BPM = 96, BEAT = 60 / BPM, MUSIC_START = 1.1; // secondi prima della prima nota

const N: Record<string, number> = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
const m = (name: string) => { const mt = name.match(/^([A-G]#?)(\d)$/)!; return (Number(mt[2]) + 1) * 12 + N[mt[1]]; };

const melody: [string, number][][] = [
  [['F#5', 1], ['A5', 1], ['F#5', 1.5], ['E5', .5]],
  [['E5', 1], ['C#5', 1], ['E5', 2]],
  [['D5', 1], ['F#5', 1], ['B5', 1.5], ['A5', .5]],
  [['G5', 1], ['F#5', 1], ['D5', 2]],
  [['F#5', .5], ['G5', .5], ['A5', 1], ['D6', 1.5], ['A5', .5]],
  [['C#6', 1], ['B5', .5], ['A5', .5], ['E5', 2]],
  [['D5', .5], ['E5', .5], ['F#5', 1], ['B5', 1], ['A5', 1]],
  [['G5', 1], ['F#5', .5], ['E5', .5], ['D5', 2]],
  [['B4', 1], ['D5', 1], ['C#5', 1], ['E5', 1]],
];
const arp = (r: number, minor = false) => [r, r + 7, r + 12, r + 7, r + 12 + (minor ? 3 : 4), r + 7, r + 12, r + 7];
const left: number[][] = [arp(50), arp(45), arp(47, true), arp(43), arp(50), arp(45), arp(47, true), arp(43), [...arp(43).slice(0, 4), ...arp(45).slice(0, 4)]];

export const NOTES: Note[] = [];
melody.forEach((bar, i) => { let p = 0; for (const [name, d] of bar) { NOTES.push({ b: i * 4 + p, db: d * .95, midi: m(name), hand: 0, vel: p === 0 ? .9 : .78 }); p += d; } });
left.forEach((bar, i) => bar.forEach((midi, k) => NOTES.push({ b: i * 4 + k * .5, db: .5, midi, hand: 1, vel: k === 0 ? .6 : .46 })));
// accordo finale
const END = 36;
[[50, 1], [57, 1], [62, 1], [66, 0], [69, 0], [74, 0]].forEach(([midi, hand], k) => NOTES.push({ b: END + k * .06, db: 4, midi, hand: hand as 0 | 1, vel: .8 }));
NOTES.sort((a, b) => a.b - b.b);

export const noteTime = (n: Note) => MUSIC_START + n.b * BEAT;
export const MUSIC_END = MUSIC_START + (END + 4) * BEAT;

// campioni disponibili: uno ogni terza minore da La0 (21)
export const sampleFor = (midi: number) => {
  let best = 21; for (let s = 21; s <= 108; s += 3) if (Math.abs(s - midi) < Math.abs(best - midi)) best = s;
  const name = ({ 9: 'A', 0: 'C', 3: 'Ds', 6: 'Fs' } as Record<number, string>)[best % 12] + (Math.floor(best / 12) - 1);
  return { file: `samples/${name}.mp3`, tone: Math.pow(2, (midi - best) / 12) };
};
