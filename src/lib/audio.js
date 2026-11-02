// All sound is generated with WebAudio (no sfx files) and stays silent until the first tap calls init().
import cfg from '../config.js';

let ctx, master, sfxG, musicG, muted = false, realMusic = false, synthOn = false;
const N = { G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99 };
const TUNE = [['G4', .75], ['G4', .25], ['A4', 1], ['G4', 1], ['C5', 1], ['B4', 2], ['G4', .75], ['G4', .25], ['A4', 1], ['G4', 1], ['D5', 1], ['C5', 2],
  ['G4', .75], ['G4', .25], ['G5', 1], ['E5', 1], ['C5', 1], ['B4', 1], ['A4', 2], ['F5', .75], ['F5', .25], ['E5', 1], ['C5', 1], ['D5', 1], ['C5', 2]];

function tone(f, t, d, type = 'sine', vol = .2, f2) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
  g.gain.setValueAtTime(.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + .01);
  g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(g).connect(sfxG);
  o.start(t); o.stop(t + d + .02);
}

function noise(t, d, vol) {
  const b = ctx.createBuffer(1, ctx.sampleRate * d, ctx.sampleRate), a = b.getChannelData(0);
  for (let i = 0; i < a.length; i++) a[i] = (Math.random() * 2 - 1) * (1 - i / a.length);
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = b; f.type = 'highpass'; f.frequency.value = 1500; g.gain.value = vol;
  s.connect(f).connect(g).connect(sfxG);
  s.start(t);
}

const SFX = {
  pop: t => { tone(520, t, .12, 'square', .1, 120); noise(t, .06, .25); },
  gold: t => [880, 1109, 1319, 1760].forEach((f, i) => tone(f, t + i * .06, .18, 'triangle', .15)),
  bomb: t => { tone(140, t, .45, 'sawtooth', .22, 38); noise(t, .3, .4); },
  flip: t => tone(300, t, .09, 'triangle', .15, 520),
  match: t => { tone(660, t, .12, 'triangle', .15); tone(990, t + .09, .2, 'triangle', .15); },
  wrong: t => tone(220, t, .25, 'sawtooth', .1, 120),
  puff: t => { tone(220, t, .12, 'sine', .08, 90); noise(t, .08, .12); },
  chime: t => { tone(1047, t, .7, 'sine', .12); tone(1568, t + .12, .8, 'sine', .08); },
  confetti: t => { noise(t, .35, .35); tone(300, t, .2, 'triangle', .1, 900); },
  win: t => [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * .1, .35, 'triangle', .16)),
  boom: t => { tone(120, t, .5, 'sine', .22, 40); noise(t, .35, .3); },
};

function synthLoop() {
  if (synthOn) return;
  synthOn = true;
  const loop = () => {
    let t = ctx.currentTime + .1;
    for (const [n, d] of TUNE) {
      const len = d * .42;
      const g = ctx.createGain(), o = ctx.createOscillator();
      o.type = 'triangle'; o.frequency.value = N[n];
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.07, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + len * .95);
      o.connect(g).connect(musicG); o.start(t); o.stop(t + len);
      t += len;
    }
    setTimeout(loop, (t - ctx.currentTime + .8) * 1000);
  };
  loop();
}

export const audio = {
  init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = muted ? 0 : 1; master.connect(ctx.destination);
    sfxG = ctx.createGain(); sfxG.connect(master);
    musicG = ctx.createGain(); musicG.gain.value = .6; musicG.connect(master);
    if (ctx.state === 'suspended') ctx.resume();
  },
  music() {
    if (!ctx) return;
    const el = new Audio(cfg.music);
    el.loop = true;
    el.addEventListener('playing', () => { realMusic = true; });
    const fallback = () => { if (!realMusic) synthLoop(); };
    el.addEventListener('error', fallback);
    try { ctx.createMediaElementSource(el).connect(musicG); } catch { /* fall back to element output */ }
    el.play().catch(fallback);
  },
  note(f) { if (ctx) tone(f, ctx.currentTime, .35, 'triangle', .2); },
  sfx(name) { if (ctx && SFX[name]) SFX[name](ctx.currentTime); },
  setMuted(m) { muted = m; if (master) master.gain.value = m ? 0 : 1; },
  isMuted: () => muted,
  duck(on) { if (musicG) musicG.gain.value = on ? 0 : .6; },
};
