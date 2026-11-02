import './style.css';
import gsap from 'gsap';
import cfg from './config.js';
import { audio } from './lib/audio.js';
import { fire, enableTilt, initTrail, reduced, haptic } from './lib/fx.js';
import { icon } from './lib/icons.js';

const $ = s => document.querySelector(s);
const root = document.documentElement;
history.scrollRestoration = 'manual';
scrollTo(0, 0);
root.classList.add('locked');

// theme + names from config
for (const [k, v] of Object.entries(cfg.colors)) root.style.setProperty('--' + k, v);
document.title = `Happy Birthday ${cfg.friend} 🎂`;
$('#kicker').textContent = cfg.intro.kicker;

// floating background shapes (moved by tilt parallax)
const shapes = $('#shapes');
[['pink', 90, 8, 12, 24, '50%'], ['teal', 60, 80, 20, 18, '18px'], ['amber', 70, 20, 62, 30, '50%'], ['purple', 110, 70, 70, 14, '28px'], ['pink', 50, 88, 40, 26, '14px'], ['teal', 80, 4, 85, 20, '50%']]
  .forEach(([c, s, x, y, d, r], i) => {
    const e = document.createElement('div');
    e.className = 'shape';
    e.style.cssText = `width:${s}px;height:${s}px;left:${x}%;top:${y}%;--d:${d};--c:var(--${c});border-radius:${r}`;
    e.innerHTML = `<i style="--s:${6 + i * 1.3}s"></i>`;
    shapes.append(e);
  });

// the tide line: a slow wave on the edge where a section changes tone (colour set in CSS)
const TIDE = `<div class="tide" aria-hidden="true"><svg viewBox="0 0 2400 60" preserveAspectRatio="none"><path fill="currentColor" d="M0 30q150-30 300 0t300 0 300 0 300 0 300 0 300 0 300 0 300 0V60H0z"/></svg></div>`;
['cake', 'wishes', 'finale'].forEach(id => document.getElementById(id).insertAdjacentHTML('afterbegin', TIDE));

// mute toggle
const mute = $('#mute');
mute.innerHTML = icon.volume;
mute.addEventListener('click', () => {
  const m = !audio.isMuted();
  audio.setMuted(m);
  mute.innerHTML = m ? icon.muted : icon.volume;
  mute.setAttribute('aria-pressed', m);
  mute.setAttribute('aria-label', m ? 'Unmute sound' : 'Mute sound');
});

// WebGL sky loads straight away (lazy chunk); CSS stars cover the gap and any failure
let sky;
import('./lib/sky.js').then(m => { try { sky = m.mount($('#sky'), { shader: 'nebula', world: true }); } catch (e) { console.warn('WebGL unavailable', e); } });

// intro title, split into letters
const split = (el, text) => {
  text.split(' ').forEach(w => {
    const word = document.createElement('span');
    word.className = 'word';
    [...w].forEach(ch => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = ch; s.setAttribute('aria-hidden', 'true'); word.append(s); });
    el.append(word, ' ');
  });
};
split($('.l1'), cfg.intro.line1);
split($('.l2'), cfg.friend);
$('#title').setAttribute('aria-label', `${cfg.intro.line1} ${cfg.friend}`);

const lazy = {
  cake: () => import('./sections/cake.js'),
  gallery: () => import('./sections/gallery.js'),
  balloons: () => import('./sections/balloons.js'),
  tea: () => import('./sections/tea.js'),
  memory: () => import('./sections/memory.js'),
  stack: () => import('./sections/stack.js'),
  code: () => import('./sections/code.js'),
  quiz: () => import('./sections/quiz.js'),
  wishes: () => import('./sections/wishes.js'),
  finale: () => import('./sections/finale.js'),
};

// tap a 3D balloon to pop it; tap a title letter to make it jump
$('#intro').addEventListener('pointerdown', e => {
  if (e.target.closest('button,a')) return;
  const col = sky?.pick(e.clientX, e.clientY);
  if (col) { audio.sfx('pop'); haptic(15); fire.at(e.clientX, e.clientY, [col, '#ffffff']); }
  const ch = e.target.closest('.ch');
  if (ch) { audio.sfx('pop'); gsap.fromTo(ch, { y: 0 }, { y: -26, duration: .16, yoyo: true, repeat: 1, ease: 'power2.out' }); }
});

// scroll parallax for the background shapes
let sq = false;
addEventListener('scroll', () => {
  if (sq) return; sq = true;
  requestAnimationFrame(() => { sq = false; root.style.setProperty('--sy', scrollY); if (scrollY > 80) $('#scrollHint').hidden = true; });
}, { passive: true });

// "LEVEL n UNLOCKED" banner the first time each section's heading scrolls in
function banner(text) {
  if (root.classList.contains('playing')) return; // never interrupt a game
  document.querySelector('.lvl')?.remove();
  const b = document.createElement('div');
  b.className = 'lvl'; b.setAttribute('role', 'status'); b.textContent = `⭐ ${text} unlocked`;
  $('#notices').append(b);
  audio.sfx('chime');
  gsap.timeline({ onComplete: () => b.remove() }).fromTo(b, { y: -70, opacity: 0 }, { y: 0, opacity: 1, duration: .45, ease: 'back.out(2)' }).to(b, { y: -70, opacity: 0, duration: .4 }, '+=1.4');
}

// load a section's code; if the network drops, show a friendly retry instead of a blank gap
function load(s) {
  const mt = s.querySelector('.mount');
  lazy[s.id]().then(m => m.init(mt, s)).catch(err => {
    console.warn(err);
    mt.innerHTML = '<div class="center"><p>Couldn’t load this part.</p><button class="btn ghost">Tap to retry</button></div>';
    mt.querySelector('button').addEventListener('click', () => { mt.innerHTML = ''; load(s); });
  });
}

function unlock() {
  root.classList.remove('locked');
  $('#scrollHint').hidden = false;
  const loader = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    loader.unobserve(e.target);
    load(e.target);
  }), { rootMargin: '300px 0px' });
  // sections simply appear; the only scroll moment is the level banner
  const announce = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    announce.unobserve(e.target);
    banner(`${e.target.querySelector('.s-kicker').textContent}: ${e.target.querySelector('h2').textContent}`);
  }), { threshold: .6 });
  for (const id in lazy) {
    const s = document.getElementById(id);
    loader.observe(s);
    s.querySelectorAll('.s-head').forEach(el => announce.observe(el));
  }
}

$('#begin').addEventListener('click', () => {
  root.classList.add('begun');
  audio.init(); audio.music(); enableTilt(); initTrail();
  sky?.launch();
  gsap.to('#begin,#kicker', { opacity: 0, scale: .8, duration: .4, onComplete() { $('#begin').hidden = true; $('#kicker').hidden = true; } });

  const q = reduced ? .001 : 1;
  const tl = gsap.timeline({ delay: reduced ? 0 : .5 });
  tl.from('.ch', { y: 90, scale: 0, rotate: () => gsap.utils.random(-25, 25), opacity: 0, duration: .75 * q, ease: 'back.out(2.4)', stagger: .055 * q }, 1.4 * q)
    .add(() => { fire.big(); audio.sfx('win'); })
    .add(() => {
      const el = $('#age'), o = { v: 0 };
      gsap.to(o, { v: cfg.age, duration: 1.4 * q, ease: 'power2.out', onUpdate: () => { el.textContent = cfg.intro.ageLabel.replace('{age}', Math.round(o.v)); } });
    }, '+=.2')
    .add(unlock, '+=1.4');
});
