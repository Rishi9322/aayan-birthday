import cfg from '../config.js';
import { audio } from '../lib/audio.js';
import { fire, shuffle, esc } from '../lib/fx.js';

export function init(mount) {
  const Q = cfg.quiz.questions;
  let i = 0, score = 0;
  mount.innerHTML = '<div class="diary" id="qBox"></div>';
  const box = mount.querySelector('#qBox');

  function ask() {
    const q = Q[i];
    const opts = shuffle(q.a.map((t, k) => ({ t, ok: k === q.ok })));
    box.innerHTML = `
      <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${Q.length}" aria-valuenow="${i}"><i style="width:${i / Q.length * 100}%"></i></div>
      <p class="hint" style="text-align:left;margin:0 0 4px">Question ${i + 1} of ${Q.length}</p>
      <p class="qq">${esc(q.q)}</p>
      <div>${opts.map((o, k) => `<button class="opt" data-ok="${o.ok}">${esc(o.t)}</button>`).join('')}</div>
      <p class="quip" aria-live="assertive"></p>`;
    box.querySelector('.opt').focus({ preventScroll: true });
    box.querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => pick(b, q)));
  }

  function pick(btn, q) {
    const ok = btn.dataset.ok === 'true';
    box.querySelectorAll('.opt').forEach(b => { b.disabled = true; if (b.dataset.ok === 'true') b.classList.add('right'); });
    if (ok) { score++; audio.sfx('match'); } else { btn.classList.add('wrong'); audio.sfx('wrong'); }
    box.querySelector('.quip').textContent = ok ? `Correct! ${q.quip}` : `Nope. ${q.quip}`;
    // the user decides when to move on, so nobody gets rushed
    const last = i + 1 >= Q.length;
    box.insertAdjacentHTML('beforeend', `<div class="row"><button class="btn" id="qNext">${last ? 'See my result' : 'Next question →'}</button></div>`);
    const nx = box.querySelector('#qNext');
    nx.focus({ preventScroll: true });
    nx.addEventListener('click', () => (++i < Q.length ? ask() : finish()));
  }

  function finish() {
    const r = [...cfg.quiz.results].reverse().find(x => score >= x.min) || cfg.quiz.results[0];
    if (score >= Q.length * .6) fire.burst(); audio.sfx('win');
    box.innerHTML = `
      <div class="center">
        <p class="hint">Final score</p>
        <div class="big-n" style="color:var(--btn)">${score}/${Q.length}</div>
        <h3 style="font-size:1.7rem;margin:10px 0 4px">${esc(r.title)}</h3>
        <p>${esc(r.text)}</p>
        <div class="row"><button class="btn" id="qAgain">Play again</button></div>
      </div>`;
    box.querySelector('#qAgain').addEventListener('click', () => { i = 0; score = 0; ask(); });
  }
  ask();
}
