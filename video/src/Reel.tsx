import React from 'react';
import { AbsoluteFill, Audio, Img, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig, Easing } from 'remotion';
import { NOTES, Note, noteTime, sampleFor, MUSIC_END } from './music';

export const FPS = 30;
export const TOTAL_FRAMES = Math.ceil((MUSIC_END + 1.2) * FPS);

const W = 1080, H = 1920;
const LOW = 43, HIGH = 88;                 // Sol2 .. Mi6
const CAS_TOP = 800, KB_TOP = 1250, KB_H = 236, LOOKAHEAD = 2.1;
const COLORS = [
  { light: '#fff1cf', body: '#ffb347', dark: '#e88a1a', glow: '#ff8a1f' },   // mano destra
  { light: '#d6fff7', body: '#3ff0d0', dark: '#14b8a6', glow: '#19c8ff' },   // mano sinistra
];
const SERIF = 'Georgia, "Times New Roman", serif', SANS = '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif';

/* ---------- geometria della tastiera ---------- */
const IS_BLACK = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0], W_IDX = [0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6];
const absW = (m: number) => Math.floor(m / 12) * 7 + W_IDX[m % 12];
const WHITES = absW(HIGH) - absW(LOW) + 1, WW = W / WHITES;
const keyGeom = (m: number) => { const i = absW(m) - absW(LOW); return IS_BLACK[m % 12] ? { x: (i - .31) * WW, w: WW * .62, black: true } : { x: i * WW, w: WW, black: false }; };

/* ---------- sfondo spaziale ---------- */
const STARS = Array.from({ length: 170 }, (_, i) => ({ x: random('sx' + i), y: random('sy' + i), z: random('sz' + i) < .6 ? 0 : random('sz' + i) < .85 ? 1 : 2, tw: random('st' + i) * 6.28, s: random('ss' + i) }));
const Space: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(180deg,#03040c 0%,#0a0a1f 55%,#1a0f20 100%)' }}>
      <AbsoluteFill style={{ background: `radial-gradient(900px 900px at ${22 + 4 * Math.sin(t * .2)}% 22%, rgba(70,60,210,.35), transparent 70%), radial-gradient(800px 800px at ${80 + 3 * Math.cos(t * .17)}% 48%, rgba(0,150,200,.22), transparent 70%), radial-gradient(1000px 700px at 50% 72%, rgba(255,120,60,.20), transparent 70%)` }} />
      {STARS.map((s, i) => {
        const y = ((s.y + t * [.004, .011, .028][s.z]) % 1) * H, a = [.4, .65, 1][s.z] * (.55 + .45 * Math.sin(s.tw + t * (1.5 + s.s * 2))), sz = [2, 3, 4.5][s.z] * (.6 + .5 * s.s);
        return <div key={i} style={{ position: 'absolute', left: s.x * W, top: y, width: sz, height: sz, borderRadius: sz, background: i % 6 === 0 ? '#ffdcb4' : '#cde1ff', opacity: a, boxShadow: s.z === 2 ? '0 0 8px rgba(200,225,255,.9)' : undefined }} />;
      })}
    </AbsoluteFill>
  );
};

/* ---------- cascata di note ---------- */
const Cascade: React.FC<{ opacity: number }> = ({ opacity }) => {
  const t = useCurrentFrame() / FPS, pps = (KB_TOP - CAS_TOP) / LOOKAHEAD;
  const items: React.ReactNode[] = [];
  NOTES.forEach((n, i) => {
    const on = noteTime(n), dur = n.db * (60 / 96), g = keyGeom(n.midi), c = COLORS[n.hand];
    if (on > t + LOOKAHEAD + .2 || on + dur < t - 1.2) return;
    const bottom = KB_TOP - (on - t) * pps, h = Math.max(dur * pps, 16), top = bottom - h, x = g.x + 3, w = g.w - 6;
    const sounding = t >= on && t < on + dur;
    if (bottom > CAS_TOP - 40 && top < KB_TOP) {
      const clipTop = Math.max(top, CAS_TOP - 80), visH = Math.min(bottom, KB_TOP) - clipTop;
      if (visH > 0) {
        items.push(<div key={'tr' + i} style={{ position: 'absolute', left: x + w * .25, top: top - 90, width: w * .5, height: 92, background: `linear-gradient(180deg, transparent, ${c.glow}55)`, opacity: top > CAS_TOP ? 1 : 0 }} />);
        items.push(<div key={'n' + i} style={{ position: 'absolute', left: x, top: clipTop, width: w, height: visH, borderRadius: Math.min(9, w / 2), background: `linear-gradient(180deg, ${c.light} 0px, ${g.black ? c.dark : c.body} 22px)`, boxShadow: `0 0 ${sounding ? 34 : 18}px ${c.glow}` }}>
          <div style={{ position: 'absolute', left: '20%', top: 5, bottom: 5, width: '14%', background: 'rgba(255,255,255,.35)', borderRadius: 4 }} />
        </div>);
      }
    }
    if (sounding) { // fascio di luce e bagliore sul tasto
      items.push(<div key={'b' + i} style={{ position: 'absolute', left: g.x, top: KB_TOP - 240, width: g.w, height: 240, background: `linear-gradient(0deg, ${c.glow}bb, transparent)`, mixBlendMode: 'screen' }} />);
      items.push(<div key={'f' + i} style={{ position: 'absolute', left: g.x + g.w / 2 - 70, top: KB_TOP - 70, width: 140, height: 140, borderRadius: 140, background: `radial-gradient(circle, rgba(255,255,255,.85) 0%, ${c.glow}77 35%, transparent 70%)`, mixBlendMode: 'screen' }} />);
    }
    const age = t - on; // scintille all'impatto
    if (age >= 0 && age < 1) for (let k = 0; k < 10; k++) {
      const a = -Math.PI / 2 + (random(`a${i}-${k}`) - .5) * 2.3, v = (130 + random(`v${i}-${k}`) * 380) * (.6 + n.vel * .6), life = .45 + random(`l${i}-${k}`) * .5;
      if (age > life) continue;
      const px = g.x + g.w / 2 + Math.cos(a) * v * age, py = KB_TOP - 4 + Math.sin(a) * v * age + 650 * age * age, al = 1 - age / life, sz = 3 + 5 * al;
      items.push(<div key={`p${i}-${k}`} style={{ position: 'absolute', left: px - sz / 2, top: py - sz / 2, width: sz, height: sz, borderRadius: sz, background: al > .6 ? c.light : c.body, opacity: al, boxShadow: `0 0 8px ${c.glow}` }} />);
    }
  });
  return <AbsoluteFill style={{ opacity }}>{items}
    <div style={{ position: 'absolute', left: 0, top: KB_TOP - 5, width: W, height: 5, background: 'linear-gradient(90deg, transparent, rgba(150,200,255,.9), transparent)', boxShadow: '0 0 22px rgba(150,200,255,.8)' }} />
  </AbsoluteFill>;
};

/* ---------- tastiera ---------- */
const Keyboard: React.FC<{ opacity: number }> = ({ opacity }) => {
  const t = useCurrentFrame() / FPS, active = new Map<number, number>();
  for (const n of NOTES) { const on = noteTime(n); if (t >= on && t < on + n.db * (60 / 96)) active.set(n.midi, n.hand); }
  const keys: React.ReactNode[] = [];
  for (const black of [false, true]) for (let m = LOW; m <= HIGH; m++) {
    const g = keyGeom(m); if (g.black !== black) continue; const hand = active.get(m), c = hand === undefined ? null : COLORS[hand];
    keys.push(black
      ? <div key={m} style={{ position: 'absolute', left: g.x, top: 0, width: g.w, height: KB_H * (c ? .61 : .62), borderRadius: '0 0 6px 6px', background: c ? `linear-gradient(180deg, ${c.dark}, ${c.body})` : 'linear-gradient(180deg,#2a2623 0%,#0d0c0b 85%,#2a2623 100%)', boxShadow: c ? `0 0 22px ${c.glow}` : '0 5px 8px rgba(0,0,0,.55)', border: '1px solid #000' }} />
      : <div key={m} style={{ position: 'absolute', left: g.x, top: c ? 3 : 0, width: g.w - 1, height: KB_H, borderRadius: '0 0 8px 8px', background: c ? `linear-gradient(180deg, ${c.light}, ${c.body})` : 'linear-gradient(180deg,#f4efe6 0%,#fffdf8 70%,#e9e2d6 100%)', border: '1px solid #a89f92', boxShadow: c ? `0 0 26px ${c.glow}` : 'inset 0 -8px 0 rgba(0,0,0,.08)' }} />);
  }
  return <div style={{ position: 'absolute', left: 0, top: KB_TOP, width: W, height: KB_H + 10, opacity, background: '#0b0908' }}>
    <div style={{ position: 'absolute', left: 0, top: -7, width: W, height: 7, background: 'linear-gradient(180deg,#8d1f1f,#5e1212)' }} />{keys}</div>;
};

/* ---------- audio: ogni nota usa il campione reale più vicino ---------- */
const Music: React.FC = () => (<>
  {NOTES.map((n: Note, i) => {
    const s = sampleFor(n.midi), from = Math.round(noteTime(n) * FPS), hold = Math.round((n.db * (60 / 96) + (n.hand ? .5 : .9)) * FPS), total = hold + 14;
    const gain = (.2 + .8 * Math.pow(n.vel, 1.6)) * (n.hand ? .7 : 1) * (1 + Math.max(0, n.midi - 72) / 30);
    return <Sequence key={i} from={from} durationInFrames={total}>
      <Audio src={staticFile(s.file)} toneFrequency={s.tone} volume={f => gain * interpolate(f, [hold, total], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} />
    </Sequence>;
  })}
</>);

/* ---------- elementi di testo ---------- */
const useIn = (delay = 0) => { const f = useCurrentFrame(), { fps } = useVideoConfig(); return spring({ frame: f - delay, fps, config: { damping: 16, mass: .7 } }); };
const Scene: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => {
  const f = useCurrentFrame(), a = Math.round(from * FPS), b = Math.round(to * FPS);
  const out = interpolate(f, [b - 10, b], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return <Sequence from={a} durationInFrames={b - a}><AbsoluteFill style={{ opacity: out }}>{children}</AbsoluteFill></Sequence>;
};
const Headline: React.FC<{ kicker?: string; lines: string[]; sub?: string; top?: number }> = ({ kicker, lines, sub, top = 262 }) => {
  const k = useIn(0), s = useIn(14), f = useCurrentFrame();
  return <div style={{ position: 'absolute', left: 60, right: 60, top, textAlign: 'center' }}>
    {kicker && <div style={{ fontFamily: SANS, fontSize: 30, letterSpacing: 6, textTransform: 'uppercase', color: '#ffb347', opacity: k, marginBottom: 14 }}>{kicker}</div>}
    {lines.map((l, i) => { const p = spring({ frame: f - 4 - i * 6, fps: FPS, config: { damping: 15, mass: .7 } }); return <div key={i} style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 78, lineHeight: 1.08, color: '#fff', opacity: p, transform: `translateY(${(1 - p) * 40}px)`, textShadow: '0 4px 30px rgba(0,0,0,.6)' }}>{l}</div>; })}
    {sub && <div style={{ fontFamily: SANS, fontSize: 36, lineHeight: 1.3, color: '#c9d6f2', marginTop: 20, opacity: s, transform: `translateY(${(1 - s) * 20}px)` }}>{sub}</div>}
  </div>;
};
const ShotCard: React.FC<{ src: string; top: number; height: number; imgWidth: number; panFrom: number; panTo: number; imgTop?: number; delay?: number; children?: React.ReactNode }> = ({ src, top, height, imgWidth, panFrom, panTo, imgTop = 0, delay = 10, children }) => {
  const f = useCurrentFrame(), p = useIn(delay), x = interpolate(f, [delay, delay + 130], [panFrom, panTo], { extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad) });
  return <div style={{ position: 'absolute', left: 50, top, width: 980, height, borderRadius: 26, overflow: 'hidden', opacity: p, transform: `scale(${.92 + .08 * p})`, boxShadow: '0 20px 70px rgba(0,0,0,.65), 0 0 0 2px rgba(255,255,255,.14)', background: '#f7f1e5' }}>
    <Img src={staticFile(src)} style={{ position: 'absolute', left: x, top: imgTop, width: imgWidth }} />{children}</div>;
};
const Chip: React.FC<{ text: string; delay: number; color?: string }> = ({ text, delay, color = '#ffb347' }) => { const p = useIn(delay); return <div style={{ fontFamily: SANS, fontSize: 38, fontWeight: 600, color: '#fff', padding: '18px 34px', borderRadius: 60, border: `2px solid ${color}`, background: 'rgba(10,10,30,.6)', opacity: p, transform: `scale(${.7 + .3 * p})`, boxShadow: `0 0 26px ${color}55` }}>{text}</div>; };

/* ---------- scene ---------- */
const Intro: React.FC<{ outro?: boolean }> = ({ outro }) => {
  const a = useIn(0), b = useIn(10), c = useIn(22), d = useIn(34);
  return <div style={{ position: 'absolute', left: 0, right: 0, top: outro ? 250 : 270, textAlign: 'center' }}>
    <Img src={staticFile('icon.png')} style={{ width: 250, height: 250, opacity: a, transform: `scale(${.6 + .4 * a}) rotate(${(1 - a) * -12}deg)`, filter: 'drop-shadow(0 16px 50px rgba(120,100,255,.55))' }} />
    <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 118, color: '#fff', marginTop: 6, opacity: b, transform: `translateY(${(1 - b) * 30}px)`, textShadow: '0 6px 40px rgba(0,0,0,.6)' }}>Play<span style={{ color: '#ffb347' }}>Piano</span></div>
    <div style={{ fontFamily: SANS, fontSize: 40, color: '#c9d6f2', marginTop: 10, opacity: c, padding: '0 80px', lineHeight: 1.3 }}>{outro ? 'Gratis e open source' : 'Il pianoforte che ti insegna a suonare'}</div>
    {outro && <div style={{ marginTop: 34, opacity: d, transform: `scale(${.85 + .15 * d})` }}>
      <div style={{ display: 'inline-block', fontFamily: SANS, fontWeight: 700, fontSize: 46, color: '#1b140d', background: 'linear-gradient(180deg,#ffd08a,#ffb347)', padding: '20px 46px', borderRadius: 70, boxShadow: '0 0 44px rgba(255,160,60,.6)' }}>melody.djluza.com</div>
      <div style={{ fontFamily: SANS, fontSize: 32, color: '#c9d6f2', marginTop: 22 }}>macOS · Windows · Linux · browser</div>
      <div style={{ fontFamily: SANS, fontSize: 28, color: '#8fa0c8', marginTop: 8 }}>github.com/luzadev/playpiano</div>
    </div>}
  </div>;
};
const LearnScore: React.FC = () => { const f = useCurrentFrame(), ok = Math.min(24, Math.floor(interpolate(f, [25, 125], [9, 24], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))), p = useIn(24);
  return <div style={{ position: 'absolute', right: 22, top: 18, fontFamily: SANS, fontSize: 34, fontWeight: 700, padding: '10px 22px', borderRadius: 40, background: 'rgba(20,17,15,.92)', color: '#fff', opacity: p, transform: `scale(${.8 + .2 * p})` }}><span style={{ color: '#6fcf97' }}>✔ {ok}</span>&nbsp; <span style={{ color: '#f08a82' }}>✖ 1</span>&nbsp; {Math.round(ok / (ok + 1) * 100)}%</div>; };
const AiScene: React.FC = () => {
  const f = useCurrentFrame(), text = 'un brano nostalgico, come pioggia sui vetri', typed = text.slice(0, Math.floor(interpolate(f, [16, 70], [0, text.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))), box = useIn(8), card = useIn(84);
  return <>
    <div style={{ position: 'absolute', left: 60, right: 60, top: 520, padding: '26px 32px', borderRadius: 24, background: 'rgba(31,26,23,.92)', border: '2px solid #4a3f6e', fontFamily: SANS, fontSize: 36, color: '#efe6da', opacity: box, transform: `translateY(${(1 - box) * 30}px)`, minHeight: 50 }}>
      <span style={{ color: '#b388ff' }}>✨ </span>{typed}<span style={{ opacity: f % 20 < 10 ? 1 : 0, color: '#ffb347' }}>|</span></div>
    <div style={{ position: 'absolute', left: 60, right: 60, top: 640, padding: '22px 30px', borderRadius: 22, background: 'rgba(31,26,23,.95)', borderLeft: '6px solid #ffb347', fontFamily: SANS, color: '#efe6da', opacity: card, transform: `translateY(${(1 - card) * 30}px)` }}>
      <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 40, color: '#ffb347' }}>«Ricordi sbiaditi»</div>
      <div style={{ fontSize: 28, color: '#a39788', marginTop: 4 }}>La minore · 4/4 · ♩ = 60 · 32 battute</div>
      <div style={{ fontSize: 30, marginTop: 8 }}>Lam – Fa – Do – Mi &nbsp;│&nbsp; Rem – Lam – Mi – Lam</div>
    </div></>;
};

export const Reel: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS, END = MUSIC_END - 2.7; // l'accordo finale cade all'inizio della chiusura
  const stage = interpolate(t, [.2, 1.2, END + 1.8, END + 3], [0, 1, 1, .3], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: '#03040c' }}>
      <Space />
      <Cascade opacity={stage} />
      <Keyboard opacity={interpolate(t, [.2, 1.2], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: KB_TOP + KB_H + 10, bottom: 0, background: 'linear-gradient(180deg,#0b0908,#03040c)' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: KB_TOP + KB_H + 46, textAlign: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 40, color: 'rgba(255,255,255,.55)', opacity: interpolate(t, [3, 4], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>Play<span style={{ color: 'rgba(255,179,71,.8)' }}>Piano</span></div>
      <Music />

      <Scene from={0} to={3.2}><Intro /></Scene>
      <Scene from={3.2} to={7.4}><Headline kicker="88 tasti" lines={['Il suono di un vero', 'pianoforte a coda']} sub="Suona con mouse, touch, tastiera del PC o tastiera MIDI" /></Scene>
      <Scene from={7.4} to={11.8}><Headline top={250} lines={['Carica uno spartito']} sub="MIDI e MusicXML, con i nomi delle note" />
        <ShotCard src="shot-play.png" top={450} height={330} imgWidth={2300} panFrom={0} panTo={-1250} /></Scene>
      <Scene from={11.8} to={16.2}><Headline top={250} lines={['Impara davvero']} sub="Il brano avanza solo se suoni la nota giusta" />
        <ShotCard src="shot-staff.png" top={450} height={330} imgWidth={2300} panFrom={0} panTo={-900}><LearnScore /></ShotCard></Scene>
      <Scene from={16.2} to={20.4}><Headline top={250} kicker="IA locale" lines={['Descrivi la musica', 'che hai in mente']} /><AiScene /></Scene>
      <Scene from={20.4} to={END}><Headline top={262} lines={['E molto altro']} />
        <div style={{ position: 'absolute', left: 50, right: 50, top: 400, display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center' }}>
          <Chip text="18 tipi di accordo" delay={8} color="#b388ff" /><Chip text="13 giri classici" delay={14} color="#b388ff" /><Chip text="Idee fino a 128 battute" delay={20} />
          <Chip text="Esporta in MIDI" delay={26} color="#3ff0d0" /><Chip text="Una mano alla volta" delay={32} color="#3ff0d0" /><Chip text="Velocità dal 25%" delay={38} /></div></Scene>
      <Scene from={END} to={TOTAL_FRAMES / FPS + 1}><Intro outro /></Scene>
    </AbsoluteFill>
  );
};
