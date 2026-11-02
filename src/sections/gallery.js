import gsap from 'gsap';
import cfg from '../config.js';
import { audio } from '../lib/audio.js';
import { icon } from '../lib/icons.js';
import { esc } from '../lib/fx.js';

const items = cfg.photos;
const small = s => s.replace(/\.jpe?g$/i, '-480.jpg');

export function init(mount) {
  const n = items.length;
  let order = items.map((_, i) => i);
  mount.innerHTML = `
    <div class="deck" id="deck" role="group" aria-roledescription="carousel" aria-label="Photo stack">
      ${items.map((p, i) => `
        <figure class="polaroid" data-i="${i}">
          <div class="ph">
            <img loading="lazy" decoding="async" src="${esc(p.src)}" srcset="${esc(small(p.src))} 480w, ${esc(p.src)} 1000w" sizes="300px" alt="${esc(p.alt)}">
            ${p.video ? '<span class="play" aria-hidden="true">▶</span>' : ''}
          </div>
          <figcaption>${esc(p.caption)}</figcaption>
        </figure>`).join('')}
    </div>
    <div class="deck-ctl">
      <button class="btn ghost round" id="gPrev" aria-label="Previous memory">${icon.prev}</button>
      <span id="gCount" aria-live="polite"></span>
      <button class="btn ghost round" id="gNext" aria-label="Next memory">${icon.next}</button>
    </div>`;
  const $ = s => mount.querySelector(s), deck = $('#deck');
  const cards = [...deck.children];

  deck.addEventListener('error', e => { if (e.target.tagName === 'IMG') e.target.closest('.ph').classList.add('missing'); }, true);

  function layout(animate = true) {
    order.forEach((idx, d) => {
      const el = cards[idx], rot = d ? (d % 2 ? 1 : -1) * (3 + d * 1.6) : -1.5;
      gsap.to(el, { x: 0, y: d * 6, rotation: rot, scale: 1 - d * .035, opacity: d > 3 ? 0 : 1, zIndex: 100 - d, duration: animate ? .45 : 0, ease: 'power3.out', overwrite: true });
      el.style.pointerEvents = d ? 'none' : 'auto';
      el.tabIndex = d ? -1 : 0;
      if (d) el.removeAttribute('role'); else { el.setAttribute('role', 'button'); el.setAttribute('aria-label', `${items[idx].caption}. Press Enter to open.`); }
    });
    $('#gCount').textContent = `${order[0] + 1} / ${n}`;
  }
  const next = () => { order.push(order.shift()); layout(); audio.sfx('flip'); };
  const prev = () => { order.unshift(order.pop()); const el = cards[order[0]]; gsap.set(el, { x: -280, opacity: 0 }); layout(); audio.sfx('flip'); };
  $('#gNext').addEventListener('click', next);
  $('#gPrev').addEventListener('click', prev);
  layout(false);

  // drag the top card away; a tap (no drag) opens the lightbox
  let drag = null;
  deck.addEventListener('pointerdown', e => {
    const el = cards[order[0]];
    if (!el.contains(e.target)) return;
    drag = { x: e.clientX, dx: 0, el }; el.setPointerCapture(e.pointerId); gsap.killTweensOf(el);
  });
  deck.addEventListener('pointermove', e => {
    if (!drag) return;
    drag.dx = e.clientX - drag.x;
    gsap.set(drag.el, { x: drag.dx, rotation: drag.dx * .06 });
  });
  const release = () => {
    if (!drag) return;
    const { el, dx } = drag; drag = null;
    if (Math.abs(dx) < 6) return openLb(order[0]);
    if (Math.abs(dx) > 70) {
      audio.sfx('flip');
      gsap.to(el, { x: dx > 0 ? 500 : -500, rotation: dx > 0 ? 30 : -30, opacity: 0, duration: .28, onComplete() { order.push(order.shift()); gsap.set(el, { x: 0, rotation: 0 }); layout(); } });
    } else layout();
  };
  deck.addEventListener('pointerup', release);
  deck.addEventListener('pointercancel', release);
  deck.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(order[0]); }
    else if (e.key === 'ArrowRight') next(); else if (e.key === 'ArrowLeft') prev();
  });

  // lightbox (markup lives in index.html)
  const lb = document.getElementById('lightbox'), media = document.getElementById('lbMedia'), cap = document.getElementById('lbCap');
  let cur = 0, opener = null;
  document.getElementById('lbClose').innerHTML = icon.close;
  document.getElementById('lbPrev').innerHTML = icon.prev;
  document.getElementById('lbNext').innerHTML = icon.next;
  function openLb(i) {
    cur = (i + n) % n; const p = items[cur];
    media.innerHTML = p.video
      ? `<video src="${esc(p.video)}" poster="${esc(p.src)}" controls playsinline autoplay preload="metadata" aria-label="${esc(p.alt)}"></video>`
      : `<img src="${esc(p.src)}" srcset="${esc(small(p.src))} 480w, ${esc(p.src)} 1000w" sizes="92vw" alt="${esc(p.alt)}">`;
    cap.textContent = p.caption;
    if (p.video) audio.duck(true);
    opener = opener || document.activeElement;
    lb.hidden = false; document.documentElement.classList.add('modal'); document.getElementById('lbClose').focus();
    audio.sfx('chime');
  }
  function closeLb() {
    media.querySelector('video')?.pause(); media.innerHTML = ''; lb.hidden = true; document.documentElement.classList.remove('modal'); audio.duck(false);
    opener?.focus?.(); opener = null;
  }
  document.getElementById('lbClose').onclick = closeLb;
  document.getElementById('lbPrev').onclick = () => openLb(cur - 1);
  document.getElementById('lbNext').onclick = () => openLb(cur + 1);
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Tab') { // keep focus inside the viewer
      const f = [...lb.querySelectorAll('button,video[controls]')];
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!lb.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    } else if (e.key === 'Escape') closeLb(); else if (e.key === 'ArrowLeft') openLb(cur - 1); else if (e.key === 'ArrowRight') openLb(cur + 1);
  });
}
