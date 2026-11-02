import cfg from '../config.js';
import { audio } from '../lib/audio.js';
import { palette, reduced, rand, haptic } from '../lib/fx.js';
import { icon } from '../lib/icons.js';

export function init(mount, section) {
  const text = cfg.letter.join('\n\n');
  mount.innerHTML = `
    <article class="letter">
      <h2>A letter for you</h2>
      <p class="sr">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>')}</p>
      <div class="type" id="lt" aria-hidden="true"></div>
      <span class="caret" id="caret" aria-hidden="true"></span>
    </article>
    <p class="skip" id="skip">tap anywhere to skip ahead</p>
    <div class="row" id="ctl" hidden>
      <button class="btn" id="replay">${icon.replay} Play again</button>
    </div>`;
  const $ = s => mount.querySelector(s);

  // layered behind the letter: WebGL aurora, then the fireworks canvas on top
  const aur = document.createElement('canvas'), fw = document.createElement('canvas');
  aur.setAttribute('aria-hidden', 'true'); fw.id = 'fw'; fw.setAttribute('aria-hidden', 'true');
  section.prepend(aur, fw);
  import('../lib/sky.js').then(m => { try { m.mount(aur, { shader: 'aurora', world: false }); } catch (e) { console.warn(e); } });

  // typewriter, started once the letter is mostly on screen
  let i = 0, timer = 0, done = false;
  const out = $('#lt');
  function type() {
    if (i >= text.length) return finish();
    const ch = text[i++];
    out.textContent = text.slice(0, i);
    timer = setTimeout(type, '.!?'.includes(ch) ? 240 : ch === '\n' ? 160 : ch === ',' ? 90 : 22);
  }
  function finish() {
    if (done) return;
    done = true; clearTimeout(timer); out.textContent = text;
    $('#caret').remove(); $('#skip').textContent = 'tap anywhere for fireworks ✨'; $('#ctl').hidden = false;
    [0, 450, 900].forEach(d => setTimeout(() => launch(rand(.25, .75) * W, rand(.2, .5) * H), d));
  }
  new IntersectionObserver(([e], io) => { if (e.isIntersecting) { io.disconnect(); reduced ? finish() : type(); } }, { threshold: .5 }).observe(mount);

  // fireworks
  const c = fw.getContext('2d'); let W = 300, H = 600, dpr = 1, rk = [], sp = [], raf = 0, last = 0;
  new ResizeObserver(() => { dpr = Math.min(devicePixelRatio, 2); W = fw.clientWidth; H = fw.clientHeight; fw.width = W * dpr; fw.height = H * dpr; }).observe(fw);
  function launch(tx, ty) {
    if (reduced) return burst(tx, ty);
    rk.push({ x: tx + rand(-40, 40), y: H, tx, ty, t: 0, T: .7 });
    if (!raf) { last = 0; raf = requestAnimationFrame(tick); }
  }
  function burst(x, y) {
    const cols = palette(), base = cols[Math.floor(rand(0, 4))];
    audio.sfx('boom'); haptic(15);
    if (Math.random() < .35) { // heart-shaped burst
      for (let k = 0; k < 64; k++) {
        const t = k / 64 * 6.283, s = 6.5;
        sp.push({ x, y, px: x, py: y, vx: 16 * Math.sin(t) ** 3 * s, vy: -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * s, l: 1, col: '#ff5fa2', d: 1.4 });
      }
      if (!raf) { last = 0; raf = requestAnimationFrame(tick); }
      return;
    }
    for (let k = 0; k < 70; k++) { const a = rand(0, 6.28), v = rand(40, 230); sp.push({ x, y, px: x, py: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 1, col: k % 3 ? base : cols[k % 4], d: rand(.8, 1.5) }); }
    if (!raf) { last = 0; raf = requestAnimationFrame(tick); }
  }
  function tick(ts) {
    const dt = Math.min(.05, (ts - (last || ts)) / 1000); last = ts;
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
    c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    for (const r of rk) {
      r.t += dt; const k = r.t / r.T, nx = r.x + (r.tx - r.x) * dt / Math.max(.001, r.T - r.t + dt), ny = r.y + (r.ty - r.y) * dt / Math.max(.001, r.T - r.t + dt);
      c.strokeStyle = '#ffe9a8'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(r.x, r.y); c.lineTo(nx, ny); c.stroke();
      r.x = nx; r.y = ny; if (k >= 1) { r.done = true; burst(r.tx, r.ty); }
    }
    rk = rk.filter(r => !r.done);
    for (const s of sp) {
      s.px = s.x; s.py = s.y; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 140 * dt; s.vx *= .985; s.l -= dt / s.d;
      c.globalAlpha = Math.max(0, s.l); c.strokeStyle = s.col; c.lineWidth = 2.4; c.beginPath(); c.moveTo(s.px, s.py); c.lineTo(s.x, s.y); c.stroke();
    }
    sp = sp.filter(s => s.l > 0);
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    raf = rk.length || sp.length ? requestAnimationFrame(tick) : 0;
  }
  fw.addEventListener('pointerdown', e => {
    if (!done) return finish();
    const rc = fw.getBoundingClientRect(); launch(e.clientX - rc.left, e.clientY - rc.top);
  });

  $('#replay').addEventListener('click', () => { scrollTo(0, 0); location.reload(); });
}
