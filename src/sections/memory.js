import cfg from '../config.js';
import { audio } from '../lib/audio.js';
import { fire, haptic, shuffle, esc } from '../lib/fx.js';
import { bestScore, saveBest } from '../lib/stage.js';

const KEY = 'aayan-memory-best';

export function init(mount) {
  const faces = cfg.photos.filter(p => !p.video).slice(0, 6).map((p, i) => ({ src: p.src.replace(/\.jpe?g$/i, '-480.jpg'), alt: p.alt, emoji: cfg.memoryEmoji[i] }));
  while (faces.length < 6) faces.push({ emoji: cfg.memoryEmoji[faces.length] || '🎉', alt: 'Party emoji' });
  const PAIRS = faces.length;

  mount.innerHTML = `
    <div class="tray">
      <div class="hud"><div>Moves <b id="mMoves">0</b></div><div>Pairs <b id="mPairs">0</b>/${PAIRS}</div><div>Best <b>${bestScore(KEY) || '–'}</b></div></div>
      <div class="mgrid" id="mGrid"></div>
      <p class="center" id="mMsg" aria-live="polite"></p>
      <div class="row"><button class="btn ghost" id="mAgain">Shuffle &amp; restart</button></div>
    </div>`;
  const $ = s => mount.querySelector(s), grid = $('#mGrid');
  let first = null, lock = false, moves = 0, pairs = 0;

  function deal() {
    first = null; lock = false; moves = 0; pairs = 0;
    $('#mMoves').textContent = 0; $('#mPairs').textContent = 0; $('#mMsg').textContent = '';
    const deck = shuffle(faces.flatMap((f, i) => [{ ...f, k: i }, { ...f, k: i }]));
    grid.innerHTML = deck.map((d, i) => `
      <button class="mcard" data-k="${d.k}" aria-label="Card ${i + 1}, face down">
        <span class="mi"><span class="mf mback" aria-hidden="true">?</span>
          <span class="mf mfront">${d.src ? `<img loading="lazy" src="${esc(d.src)}" alt="${esc(d.alt)}">` : d.emoji}</span></span>
      </button>`).join('');
    grid.querySelectorAll('img').forEach(img => img.addEventListener('error', () => { img.replaceWith(document.createTextNode(faces[img.closest('.mcard').dataset.k].emoji)); }));
  }

  grid.addEventListener('click', e => {
    const card = e.target.closest('.mcard');
    if (!card || lock || card.classList.contains('flip')) return;
    card.classList.add('flip'); card.setAttribute('aria-label', 'Card face up: ' + (card.querySelector('img')?.alt || card.querySelector('.mfront').textContent));
    audio.sfx('flip'); haptic(8);
    if (!first) { first = card; return; }
    moves++; $('#mMoves').textContent = moves;
    if (first.dataset.k === card.dataset.k) {
      for (const c of [first, card]) c.classList.add('matched');
      audio.sfx('match'); first = null; $('#mPairs').textContent = ++pairs;
      if (pairs === PAIRS) done();
    } else {
      lock = true;
      const a = first; first = null;
      setTimeout(() => { for (const c of [a, card]) { c.classList.remove('flip'); c.setAttribute('aria-label', 'Card, face down'); } lock = false; }, 800);
    }
  });

  function done() {
    const b = bestScore(KEY), isBest = !b || moves < b;
    if (isBest) saveBest(KEY, moves);
    $('#mMsg').textContent = `Cleared in ${moves} moves${isBest ? ' (new best!)' : ''} 🎉`;
    fire.burst(); audio.sfx('win');
  }

  $('#mAgain').addEventListener('click', deal);
  deal();
}
