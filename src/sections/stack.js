import { audio } from '../lib/audio.js';
import { fire, haptic, palette } from '../lib/fx.js';
import { stage, overlay, bestScore, saveBest } from '../lib/stage.js';

const KEY = 'aayan-stack-best';

export function init(mount) {
  mount.innerHTML = `
    <div class="arcade">
      <div class="hud"><div>Height <b id="kH">0</b></div><div class="combo" id="kMsg" aria-live="polite"></div><div>Best <b id="kB">${bestScore(KEY)}</b></div></div>
      <div class="stage"><canvas aria-label="Sandcastle stacking game area" role="img"></canvas><div class="overlay"></div></div>
      <div class="row"><button class="btn" id="kDrop">Drop block</button></div>
    </div>`;
  const cv = mount.querySelector('canvas'), ov = mount.querySelector('.overlay'), drop = mount.querySelector('#kDrop');
  const $ = s => mount.querySelector(s), cols = palette();
  let g = null;

  const game = stage(cv, (dt, c, W, H) => {
    const S = H / 480, bh = 26 * S;
    // slide the moving block back and forth, a little faster every layer
    const m = g.cur, speed = Math.min(520, 150 + g.blocks.length * 12) * S;
    m.x += m.dir * speed * dt;
    if (m.x < 0) { m.x = 0; m.dir = 1; } else if (m.x + m.w > W) { m.x = W - m.w; m.dir = -1; }
    // camera follows the tower up
    const camT = Math.max(0, (g.blocks.length - 7) * bh);
    g.cam += (camT - g.cam) * Math.min(1, dt * 5);
    const yOf = n => H - (n + 1) * bh + g.cam;
    const block = (x, y, w, i, a = 1) => {
      c.globalAlpha = a; c.fillStyle = cols[i % 4]; c.beginPath(); c.roundRect(x, y, w, bh - 2, 6 * S); c.fill();
      c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(x + 4, y + 3, w - 8, 3 * S); c.globalAlpha = 1;
    };
    g.blocks.forEach((b, i) => block(b.x, yOf(i), b.w, i));
    if (!g.over) block(m.x, yOf(g.blocks.length), m.w, g.blocks.length);
    for (const p of g.fall) { p.vy += 900 * S * dt; p.y += p.vy * dt; block(p.x, p.y, p.w, p.i, Math.max(0, 1 - p.y / H * .4)); }
    g.fall = g.fall.filter(p => p.y < H + 60);
    if (g.over && !g.fall.length) return false;
  });

  function place() {
    if (!g || g.over || ov.hidden === false) return;
    const top = g.blocks[g.blocks.length - 1], m = g.cur, S = cv.clientHeight / 480, bh = 26 * S;
    const lo = Math.max(m.x, top.x), hi = Math.min(m.x + m.w, top.x + top.w), ov_ = hi - lo;
    const y = cv.clientHeight - (g.blocks.length + 1) * bh + g.cam;
    if (ov_ < 6) { // missed completely
      g.over = true; g.fall.push({ x: m.x, y, w: m.w, vy: 0, i: g.blocks.length });
      audio.sfx('bomb'); haptic([40, 30, 40]); return finish();
    }
    const perfect = Math.abs(m.x - top.x) < 5;
    let nx = lo, nw = ov_;
    if (perfect) { nx = top.x; nw = top.w; audio.sfx('gold'); $('#kMsg').textContent = 'Perfect!'; haptic(20); }
    else {
      $('#kMsg').textContent = '';
      const cutX = m.x < top.x ? m.x : hi, cutW = m.w - ov_;
      g.fall.push({ x: cutX, y, w: cutW, vy: 0, i: g.blocks.length });
      audio.sfx('pop'); haptic(10);
    }
    g.blocks.push({ x: nx, w: nw });
    g.cur = { x: m.dir > 0 ? 0 : cv.clientWidth - nw, w: nw, dir: m.dir > 0 ? 1 : -1 };
    $('#kH').textContent = g.blocks.length - 1;
  }
  cv.addEventListener('pointerdown', place);
  drop.addEventListener('click', place);

  function begin() {
    const W = game.size()[0], w0 = W * .5;
    g = { blocks: [{ x: (W - w0) / 2, w: w0 }], cur: { x: 0, w: w0, dir: 1 }, fall: [], cam: 0, over: false };
    $('#kH').textContent = 0; $('#kMsg').textContent = '';
    document.documentElement.classList.add('playing');
    game.start();
  }
  function finish() {
    document.documentElement.classList.remove('playing');
    const h = g.blocks.length - 1, prev = bestScore(KEY), isBest = h > prev;
    if (isBest) { saveBest(KEY, h); $('#kB').textContent = h; fire.burst(); }
    setTimeout(() => overlay(ov, isBest && h ? 'New best tower! 🏰' : 'The tide won 🌊', `<div class="big-n">${h}</div><p>${h === 1 ? 'block' : 'blocks'} high${isBest && h ? '' : `. Best: ${prev}`}</p>`, 'Build again', begin), 900);
  }
  overlay(ov, 'Stack the sandcastle 🏰', '<p>Tap (or press Drop) to place each block.<br>Line it up, the overhang gets washed away. A perfect fit keeps the full width.</p>', 'Start', begin);
}
