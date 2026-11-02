import gsap from 'gsap';
import cfg from '../config.js';
import { audio } from '../lib/audio.js';
import { fire, haptic, palette, reduced, rand } from '../lib/fx.js';
import { icon } from '../lib/icons.js';

const NS = 'http://www.w3.org/2000/svg';
const CX = 160, TOP = 140, RX = 96, RY = 19;

// Spread N candles over three concentric rings on the cake top.
function layout(n) {
  const rings = [1, .62, .26], tot = rings.reduce((a, b) => a + b);
  const counts = rings.map(w => Math.round(n * w / tot));
  counts[2] = Math.max(0, n - counts[0] - counts[1]);
  const pts = [];
  rings.forEach((f, r) => { for (let j = 0; j < counts[r]; j++) { const a = Math.PI * 2 * j / counts[r] + r * .5; pts.push([CX + RX * f * Math.cos(a), TOP + RY * f * Math.sin(a)]); } });
  return pts.sort((a, b) => a[1] - b[1]); // back to front so near candles overlap far ones
}

export function init(mount) {
  const cols = palette(), n = cfg.age;
  const drips = [];
  for (let x = 52; x <= 268; x += 24) {
    const y = TOP + 26 * Math.sqrt(1 - ((x - CX) / 120) ** 2);
    drips.push(`<rect x="${x - 7}" y="${y - 6}" width="14" height="${14 + (x * 7 % 16)}" rx="7" fill="#ffd1e8"/>`);
  }
  const sprinkles = Array.from({ length: 26 }, () => `<rect x="${rand(60, 260)}" y="${rand(TOP - 14, TOP + 12)}" width="6" height="2.5" rx="1.2" fill="${cols[Math.floor(rand(0, 4))]}" transform="rotate(${rand(0, 180)} 160 140)"/>`).join('');
  const candles = layout(n).map(([x, y], i) => `
    <g class="candle" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})" tabindex="0" role="button" aria-label="Candle ${i + 1}, lit">
      <rect x="-3" y="-24" width="6" height="24" rx="2" fill="${cols[i % 4]}"/><rect x="-3" y="-24" width="6" height="4" rx="2" fill="#fff" opacity=".45"/>
      <line y1="-24" y2="-28" stroke="#4b4463" stroke-width="1.3"/>
      <path class="flame" style="animation-delay:-${(i * .13).toFixed(2)}s" d="M0 -28 C-5 -33 -4 -39 0 -46 C4 -39 5 -33 0 -28Z" fill="url(#fg)"/>
      <circle cy="-30" r="13" fill="transparent"/>
    </g>`).join('');

  mount.innerHTML = `
    <div class="cake-wrap" id="cakeBox">
      <svg id="cakeSvg" viewBox="0 40 320 235" role="img" aria-label="Birthday cake with ${n} candles">
        <defs>
          <radialGradient id="fg" cx="50%" cy="75%" r="60%"><stop offset="0" stop-color="#fff7c2"/><stop offset=".6" stop-color="#fbbf24"/><stop offset="1" stop-color="#f97316"/></radialGradient>
          ${[0, 1, 2, 3, 4, 5].map(i => `<clipPath id="sl${i}"><rect x="${30 + i * 43.4}" y="0" width="43.6" height="300"/></clipPath>`).join('')}
        </defs>
        <g id="art">
            <ellipse cx="160" cy="236" rx="150" ry="22" fill="#e9e4f7"/>
            <g class="cake-body">
              <path d="M40 140V205A120 26 0 0 0 280 205V140Z" fill="${cfg.colors.pink}"/>
              <path d="M40 205A120 26 0 0 0 280 205V190A120 26 0 0 1 40 190Z" fill="${cfg.colors.purple}" opacity=".35"/>
              ${drips.join('')}
              <ellipse cx="160" cy="140" rx="120" ry="26" fill="#ffe3f1"/>
              ${sprinkles}
              <text x="160" y="196" text-anchor="middle" font-family="Fredoka,sans-serif" font-weight="700" font-size="40" fill="#fff">${n}</text>
            </g>
            ${candles}
        </g>
        <g id="slices" style="display:none">${[0, 1, 2, 3, 4, 5].map(i => `<use href="#art" clip-path="url(#sl${i})"/>`).join('')}</g>
      </svg>
    </div>
    <p class="wish" id="wish" hidden></p>
    <div class="row">
      <button class="btn ghost" id="micBtn">${icon.mic} Blow for real</button>
      <button class="btn link" id="rest">Blow out the rest</button>
      <button class="btn" id="again" hidden>🎂 Light them again</button>
    </div>
    <p class="hint" id="count" aria-live="polite">${n} candles to go</p>`;

  const $ = s => mount.querySelector(s), svg = $('#cakeSvg');
  // candles live in the real #art group (clicks don't reach <use> clones); the slices are visual copies
  const art = svg.querySelector('#art'), all = [...art.querySelectorAll('.candle')];
  let left = n, down = false, listening = null;

  const setCount = () => { $('#count').hidden = !left; $('#count').textContent = `${left} candle${left > 1 ? 's' : ''} to go`; };

  function out(c) {
    if (c.classList.contains('out')) return;
    c.classList.add('out'); c.setAttribute('aria-label', c.getAttribute('aria-label').replace('lit', 'blown out'));
    const s = document.createElementNS(NS, 'circle'); s.setAttribute('class', 'smoke'); s.setAttribute('cy', '-30'); s.setAttribute('r', '3');
    s.addEventListener('animationend', () => s.remove()); c.append(s);
    audio.sfx('puff'); haptic(8);
    left--; setCount();
    if (!left) win();
  }

  svg.addEventListener('pointerdown', e => { down = true; const c = e.target.closest('.candle'); if (c) out(c); });
  addEventListener('pointerup', () => { down = false; });
  svg.addEventListener('pointermove', e => {
    if (!down) return;
    const c = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('.candle');
    if (c) out(c);
  });
  svg.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList?.contains('candle')) { e.preventDefault(); out(e.target); } });
  $('#rest').addEventListener('click', () => all.forEach((c, i) => setTimeout(() => out(c), i * 40)));

  function win() {
    stopMic();
    fire.burst(); audio.sfx('win');
    const w = $('#wish'); w.hidden = false; w.textContent = cfg.cake.wish.replace('{name}', cfg.friend);
    gsap.fromTo(w, { scale: .5, opacity: 0 }, { scale: 1, opacity: 1, duration: .8, ease: 'elastic.out(1,.5)' });
    // cake slices fly away
    const uses = [...svg.querySelectorAll('#slices use')];
    setTimeout(() => {
      art.style.display = 'none'; svg.querySelector('#slices').style.display = '';
      uses.forEach((u, i) => gsap.to(u, { x: (i - 2.5) * 70, y: 140 + rand(0, 60), rotation: (i - 2.5) * 18, svgOrigin: `${52 + i * 43.4} 200`, opacity: 0, duration: reduced ? .01 : 1.2, delay: reduced ? 0 : i * .09, ease: 'power2.in' }));
      setTimeout(() => { $('#again').hidden = false; }, reduced ? 100 : 1900);
    }, reduced ? 100 : 1600);
  }

  $('#again').addEventListener('click', () => {
    $('#again').hidden = true; $('#wish').hidden = true;
    svg.querySelectorAll('#slices use').forEach(u => gsap.set(u, { clearProps: 'all' }));
    svg.querySelector('#slices').style.display = 'none'; art.style.display = '';
    all.forEach(c => { c.classList.remove('out'); c.setAttribute('aria-label', c.getAttribute('aria-label').replace('blown out', 'lit')); });
    left = n; setCount();
  });

  // Mic: blow into the phone. Music is ducked so speakers don't trigger it. Tap/swipe always works too.
  const micBtn = $('#micBtn');
  function stopMic() {
    if (!listening) return;
    listening.stream.getTracks().forEach(t => t.stop()); listening.ac.close(); listening = null;
    audio.duck(false); micBtn.innerHTML = `${icon.mic} Blow for real`;
  }
  micBtn.addEventListener('click', async () => {
    if (listening) return stopMic();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true } });
      const ac = new (window.AudioContext || window.webkitAudioContext)(), an = ac.createAnalyser();
      an.fftSize = 512; ac.createMediaStreamSource(stream).connect(an);
      listening = { stream, ac }; audio.duck(true); micBtn.innerHTML = `${icon.mic} Listening… blow!`;
      const buf = new Uint8Array(an.fftSize); let lastBlow = 0;
      (function poll(ts) {
        if (!listening) return;
        an.getByteTimeDomainData(buf);
        let s = 0; for (const v of buf) { const d = (v - 128) / 128; s += d * d; }
        if (Math.sqrt(s / buf.length) > .1 && ts - lastBlow > 110) {
          lastBlow = ts;
          const lit = all.filter(c => !c.classList.contains('out'));
          for (let i = 0; i < 2 && lit.length; i++) out(lit.splice(Math.floor(Math.random() * lit.length), 1)[0]);
        }
        requestAnimationFrame(poll);
      })(0);
    } catch { toast('Mic not available. Just tap or swipe the flames!'); }
  });

  // Easter egg: tap the cake 5 times.
  let taps = 0, tapTimer;
  svg.addEventListener('pointerdown', e => {
    if (!e.target.closest('.cake-body')) return;
    clearTimeout(tapTimer); tapTimer = setTimeout(() => { taps = 0; }, 1500);
    if (++taps >= 5) { taps = 0; surprise(); }
  });
  function surprise() {
    audio.sfx('win'); fire.big(); haptic([30, 40, 30]);
    toast('🏖️ Secret unlocked: this sandcastle survived the tide!');
    gsap.fromTo('#cakeBox', { rotate: -6 }, { rotate: 0, duration: 1, ease: 'elastic.out(1,.3)' });
    if (reduced) return;
    for (let i = 0; i < 22; i++) {
      const e = document.createElement('span');
      e.className = 'emoji-rain'; e.setAttribute('aria-hidden', 'true'); e.textContent = ['☕', '🏖️', '🎂', '🤫', '🎉'][i % 5]; e.style.left = rand(2, 92) + 'vw';
      document.body.append(e);
      gsap.fromTo(e, { y: -60, rotate: rand(-40, 40) }, { y: innerHeight + 60, rotate: rand(-200, 200), duration: rand(2.2, 3.6), delay: rand(0, 1.2), ease: 'none', onComplete: () => e.remove() });
    }
  }
  function toast(msg) {
    const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.getElementById('notices').append(t); setTimeout(() => t.remove(), 3200);
  }
}
