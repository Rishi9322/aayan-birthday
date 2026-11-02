import { audio } from '../lib/audio.js';
import { fire, haptic, palette, rand } from '../lib/fx.js';
import { stage, overlay, bestScore, saveBest } from '../lib/stage.js';

const KEY = 'aayan-balloon-best', DUR = 30;

export function init(mount) {
  mount.innerHTML = `
    <div class="arcade">
      <div class="hud"><div>Score <b id="bScore">0</b></div><div class="combo" id="bCombo" aria-live="off"></div><div>⏱ <b id="bTime">${DUR}</b></div></div>
      <div class="stage">
        <canvas aria-label="Balloon pop game area" role="img"></canvas>
        <div class="overlay"></div>
      </div>
    </div>`;
  const $ = s => mount.querySelector(s), cv = $('canvas'), ov = $('.overlay');
  const cols = palette();
  let g = null;

  const game = stage(cv, (dt, c, W, H) => {
    const S = H / 480;
    g.t += dt; g.spawn -= dt;
    if (g.spawn <= 0) { spawn(W, H, S); g.spawn = Math.max(.26, .85 - g.t * .02); }
    for (const b of g.b) b.y -= b.vy * dt;
    for (let i = g.b.length - 1; i >= 0; i--) if (g.b[i].y < -g.b[i].r - 30) { if (g.b[i].type !== 'bomb' && g.combo) { g.combo = 0; hud(); } g.b.splice(i, 1); }
    for (const p of g.p) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt * S; p.l -= dt * 1.6; }
    g.p = g.p.filter(p => p.l > 0);
    for (const f of g.f) { f.y -= 40 * dt; f.l -= dt * 1.3; }
    g.f = g.f.filter(f => f.l > 0);
    g.shake = Math.max(0, g.shake - dt); g.flash = Math.max(0, g.flash - dt);
    const left = Math.max(0, Math.ceil(DUR - g.t));
    if (left !== g.shownT) { g.shownT = left; $('#bTime').textContent = left; }
    draw(c, W, H);
    if (g.t >= DUR) { end(); return false; }
  });

  const mult = () => Math.min(5, 1 + Math.floor((g.combo - 1) / 4));
  function hud() {
    $('#bScore').textContent = g.score;
    $('#bCombo').textContent = g.combo > 1 ? `🔥 x${mult()} · ${g.combo}` : '';
  }

  function spawn(W, H, S) {
    const r = rand(26, 38) * Math.min(1.25, Math.max(.8, W / 360));
    const roll = Math.random();
    const type = roll < .09 ? 'gold' : roll < .22 && g.t > 3 ? 'bomb' : 'normal';
    g.b.push({ x: rand(r, W - r), y: H + r + 20, r, type, col: cols[Math.floor(rand(0, 4))], vy: rand(75, 115) * (1 + g.t / DUR * 1.5) * S, ph: rand(0, 6.28) });
  }

  function pop(b) {
    g.b.splice(g.b.indexOf(b), 1);
    const col = b.type === 'gold' ? '#fbbf24' : b.type === 'bomb' ? '#ff5050' : b.col;
    for (let i = 0; i < (b.type === 'bomb' ? 26 : 14); i++) { const a = rand(0, 6.28), v = rand(60, 260); g.p.push({ x: b.x, y: b.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, l: 1, col, s: rand(2, 5) }); }
    let pts;
    if (b.type === 'bomb') { pts = -30; g.combo = 0; g.shake = .35; g.flash = .3; audio.sfx('bomb'); haptic([40, 30, 40]); }
    else {
      g.combo = g.t - g.lastPop < 1.5 ? g.combo + 1 : 1; g.lastPop = g.t;
      pts = (b.type === 'gold' ? 50 : 10) * mult();
      audio.sfx(b.type === 'gold' ? 'gold' : 'pop'); haptic(12);
    }
    g.score = Math.max(0, g.score + pts);
    g.f.push({ x: b.x, y: b.y, txt: (pts > 0 ? '+' : '') + pts, col: pts > 0 ? '#fff' : '#ff8080', l: 1 });
    hud();
  }

  cv.addEventListener('pointerdown', e => {
    if (!g) return;
    const [x, y] = game.point(e);
    for (let i = g.b.length - 1; i >= 0; i--) {
      const b = g.b[i], dx = (x - b.x) / (b.r + 10), dy = (y - b.y) / (b.r * 1.2 + 10);
      if (dx * dx + dy * dy <= 1) { pop(b); break; }
    }
  });

  function draw(c, W, H) {
    if (g.shake) c.translate(rand(-1, 1) * g.shake * 16, rand(-1, 1) * g.shake * 16);
    for (const b of g.b) {
      c.save(); c.translate(b.x + Math.sin(g.t * 2 + b.ph) * 6, b.y);
      c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, b.r * 1.2); c.quadraticCurveTo(8, b.r * 1.2 + 18, -4, b.r * 1.2 + 36); c.stroke();
      c.fillStyle = b.type === 'gold' ? '#fbbf24' : b.type === 'bomb' ? '#2b2740' : b.col;
      c.beginPath(); c.ellipse(0, 0, b.r * .85, b.r * 1.1, 0, 0, 7); c.fill();
      c.beginPath(); c.moveTo(0, b.r * 1.1); c.lineTo(-5, b.r * 1.1 + 9); c.lineTo(5, b.r * 1.1 + 9); c.fill();
      c.fillStyle = 'rgba(255,255,255,.4)'; c.beginPath(); c.ellipse(-b.r * .3, -b.r * .4, b.r * .17, b.r * .3, .5, 0, 7); c.fill();
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `${b.r * .9}px sans-serif`;
      if (b.type === 'bomb') c.fillText('💣', 0, 0); else if (b.type === 'gold') { c.fillStyle = '#fff'; c.fillText('★', 0, 0); }
      c.restore();
    }
    for (const p of g.p) { c.globalAlpha = p.l; c.fillStyle = p.col; c.beginPath(); c.arc(p.x, p.y, p.s, 0, 7); c.fill(); }
    c.font = '700 20px Fredoka, sans-serif'; c.textAlign = 'center';
    for (const f of g.f) { c.globalAlpha = Math.min(1, f.l * 1.5); c.fillStyle = f.col; c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 3; c.strokeText(f.txt, f.x, f.y); c.fillText(f.txt, f.x, f.y); }
    c.globalAlpha = 1;
    if (g.flash) { c.fillStyle = `rgba(255,60,60,${g.flash})`; c.fillRect(0, 0, W, H); }
  }

  function begin() {
    g = { t: 0, score: 0, combo: 0, lastPop: -9, spawn: 0, b: [], p: [], f: [], shake: 0, flash: 0, shownT: DUR };
    cv.style.touchAction = 'none';
    document.documentElement.classList.add('playing'); // pauses background drift + level banners
    hud(); game.start();
  }
  function end() {
    cv.style.touchAction = '';
    document.documentElement.classList.remove('playing');
    const s = g.score, prev = bestScore(KEY), isBest = s > prev;
    if (isBest) { saveBest(KEY, s); fire.burst(); } else audio.sfx('win');
    overlay(ov, isBest && s ? 'New high score! 🏆' : 'Time’s up! ⏰', `<div class="big-n">${s}</div><p>${isBest && s ? 'You beat your best.' : `Best: ${prev}`}</p>`, 'Play again', begin);
    g = null;
  }

  overlay(ov, 'Balloon Pop 🎈', `<p>Pop everything for 30 seconds.<br>⭐ Gold = +50 &nbsp; 💣 Bomb = −30<br>Chain pops to build a combo.</p><p>Best: <b>${bestScore(KEY)}</b></p>`, 'Start', begin);
}
