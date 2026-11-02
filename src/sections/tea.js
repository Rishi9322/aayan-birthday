import { audio } from '../lib/audio.js';
import { fire, haptic, rand } from '../lib/fx.js';
import { stage, overlay, bestScore, saveBest } from '../lib/stage.js';

const KEY = 'aayan-tea-best', DUR = 25;
// emoji, points, relative frequency
const KINDS = [{ e: '☕', p: 10, w: 7 }, { e: '🫖', p: 30, w: 2 }, { e: '🧊', p: -20, w: 3 }];

export function init(mount) {
  mount.innerHTML = `
    <div class="arcade">
      <div class="hud"><div>Score <b id="tScore">0</b></div><div>⏱ <b id="tTime">${DUR}</b></div></div>
      <div class="stage"><canvas aria-label="Tea catching game area" role="img"></canvas><div class="overlay"></div></div>
    </div>`;
  const cv = mount.querySelector('canvas'), ov = mount.querySelector('.overlay');
  const $ = s => mount.querySelector(s);
  let g = null, px = null;

  const game = stage(cv, (dt, c, W, H) => {
    g.t += dt; g.spawn -= dt;
    const S = H / 480;
    if (g.spawn <= 0) {
      let r = Math.random() * 12, k = KINDS[0];
      for (const x of KINDS) { if ((r -= x.w) < 0) { k = x; break; } }
      g.items.push({ k, x: rand(24, W - 24), y: -30, vy: rand(120, 170) * S * (1 + g.t / DUR * 1.4) });
      g.spawn = Math.max(.32, .8 - g.t * .018);
    }
    // basket eases toward the finger
    if (px !== null) g.cx += (Math.min(W - 30, Math.max(30, px)) - g.cx) * Math.min(1, dt * 14);
    const cy = H - 46 * S - 8;
    c.font = `${46 * S}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('🧺', g.cx, cy);
    c.font = `${34 * S}px sans-serif`;
    for (let i = g.items.length - 1; i >= 0; i--) {
      const it = g.items[i]; it.y += it.vy * dt;
      c.fillText(it.k.e, it.x, it.y);
      if (it.y > cy - 24 * S && it.y < cy + 18 * S && Math.abs(it.x - g.cx) < 44 * S) { // caught
        g.items.splice(i, 1);
        g.score = Math.max(0, g.score + it.k.p);
        g.pops.push({ x: it.x, y: cy - 30, txt: (it.k.p > 0 ? '+' : '') + it.k.p, good: it.k.p > 0, l: 1 });
        audio.sfx(it.k.p < 0 ? 'wrong' : it.k.p > 10 ? 'gold' : 'pop'); haptic(it.k.p < 0 ? 40 : 10);
        $('#tScore').textContent = g.score;
      } else if (it.y > H + 30) g.items.splice(i, 1);
    }
    c.font = '700 20px Fredoka, sans-serif';
    for (const p of g.pops) { p.y -= 40 * dt; p.l -= dt * 1.4; c.globalAlpha = Math.max(0, p.l); c.fillStyle = p.good ? '#fff' : '#ff8080'; c.fillText(p.txt, p.x, p.y); }
    c.globalAlpha = 1; g.pops = g.pops.filter(p => p.l > 0);
    const left = Math.max(0, Math.ceil(DUR - g.t));
    if (left !== g.shown) { g.shown = left; $('#tTime').textContent = left; }
    if (g.t >= DUR) { end(); return false; }
  });

  cv.addEventListener('pointerdown', e => { px = game.point(e)[0]; });
  cv.addEventListener('pointermove', e => { if (g && (e.buttons || e.pointerType === 'mouse')) px = game.point(e)[0]; });

  function begin() {
    g = { t: 0, spawn: 0, items: [], pops: [], score: 0, cx: game.size()[0] / 2, shown: DUR };
    px = null; $('#tScore').textContent = 0;
    cv.style.touchAction = 'none'; document.documentElement.classList.add('playing');
    game.start();
  }
  function end() {
    cv.style.touchAction = ''; document.documentElement.classList.remove('playing');
    const s = g.score, prev = bestScore(KEY), isBest = s > prev;
    if (isBest) { saveBest(KEY, s); fire.burst(); } else audio.sfx('win');
    overlay(ov, isBest && s ? 'New high score! 🏆' : 'Tea time’s over ☕', `<div class="big-n">${s}</div><p>${isBest && s ? 'You beat your best.' : `Best: ${prev}`}</p>`, 'Play again', begin);
  }
  overlay(ov, 'Catch the tea ☕', `<p>Drag the basket to catch cups for 25 seconds.<br>🫖 Teapot = +30 &nbsp; 🧊 Ice = −20</p><p>Best: <b>${bestScore(KEY)}</b></p>`, 'Start', begin);
}
