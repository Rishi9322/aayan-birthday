import confetti from 'canvas-confetti';
import cfg from '../config.js';
import { audio } from './audio.js';

export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const tilt = { x: 0, y: 0 };
export const rand = (a, b) => a + Math.random() * (b - a);
export const palette = () => [cfg.colors.pink, cfg.colors.purple, cfg.colors.teal, cfg.colors.amber];
export const haptic = ms => { if (!reduced) navigator.vibrate?.(ms); };
export const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const base = () => ({ colors: palette(), disableForReducedMotion: true, zIndex: 1000 });
let emojiShapes;
const emoji = opts => {
  emojiShapes ||= ['🎂', '⭐', '🎈', '☕', '🤫'].map(text => confetti.shapeFromText({ text, scalar: 2.5 }));
  confetti({ ...base(), shapes: emojiShapes, scalar: 2.5, flat: true, particleCount: 22, ...opts });
};
export const fire = {
  burst() { audio.sfx('confetti'); confetti({ ...base(), particleCount: 140, spread: 90, origin: { y: .6 } }); emoji({ spread: 100, origin: { y: .6 } }); },
  big() {
    audio.sfx('confetti');
    for (const x of [0, 1]) {
      confetti({ ...base(), particleCount: 90, angle: x ? 120 : 60, spread: 70, origin: { x, y: .8 }, startVelocity: 55 });
      emoji({ angle: x ? 120 : 60, spread: 60, origin: { x, y: .8 }, startVelocity: 50 });
    }
  },
  at(x, y, colors) { confetti({ ...base(), colors: colors || palette(), particleCount: 30, spread: 60, startVelocity: 25, origin: { x: x / innerWidth, y: y / innerHeight } }); },
};

// Tilt parallax: gyroscope on phones, pointer on desktop. Writes --tx/--ty on <html>.
let gyro = false, queued = false;
const root = document.documentElement;
function setTilt(x, y) {
  tilt.x = Math.max(-1, Math.min(1, x)); tilt.y = Math.max(-1, Math.min(1, y));
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => { queued = false; root.style.setProperty('--tx', tilt.x.toFixed(3)); root.style.setProperty('--ty', tilt.y.toFixed(3)); });
}
addEventListener('pointermove', e => { if (!gyro && e.pointerType === 'mouse') setTilt(e.clientX / innerWidth * 2 - 1, e.clientY / innerHeight * 2 - 1); });
export async function enableTilt() {
  try {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      if (await DeviceOrientationEvent.requestPermission() !== 'granted') return;
    }
    addEventListener('deviceorientation', e => { if (e.gamma == null) return; gyro = true; setTilt((e.gamma || 0) / 30, ((e.beta || 45) - 45) / 30); });
  } catch { /* tilt is a bonus */ }
}

// Sparkle trail under the finger / cursor.
export function initTrail() {
  if (reduced) return;
  const cv = document.createElement('canvas'), c = cv.getContext('2d');
  cv.className = 'trail'; cv.setAttribute('aria-hidden', 'true');
  document.body.append(cv);
  const fit = () => { cv.width = innerWidth; cv.height = innerHeight; };
  fit(); addEventListener('resize', fit);
  const ps = []; let raf = 0;
  const cols = palette();
  const add = (x, y, n) => {
    for (let i = 0; i < n; i++) ps.push({ x, y, vx: rand(-40, 40), vy: rand(-60, 10), l: 1, c: cols[i % 4], s: rand(2, 4.5) });
    if (!raf) raf = requestAnimationFrame(tick);
  };
  function tick() {
    c.clearRect(0, 0, cv.width, cv.height);
    for (const p of ps) {
      p.x += p.vx / 60; p.y += p.vy / 60; p.vy += 1.2; p.l -= .03;
      c.globalAlpha = Math.max(p.l, 0); c.fillStyle = p.c;
      c.beginPath(); c.arc(p.x, p.y, p.s * p.l, 0, 7); c.fill();
    }
    for (let i = ps.length - 1; i >= 0; i--) if (ps[i].l <= 0) ps.splice(i, 1);
    raf = ps.length ? requestAnimationFrame(tick) : 0;
  }
  addEventListener('pointermove', e => { if (e.pointerType !== 'mouse' || e.buttons) add(e.clientX, e.clientY, 1); });
  addEventListener('pointerdown', e => add(e.clientX, e.clientY, 6));
}
