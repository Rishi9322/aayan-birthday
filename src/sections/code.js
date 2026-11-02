import { audio } from '../lib/audio.js';
import { fire, haptic, palette } from '../lib/fx.js';
import { bestScore, saveBest } from '../lib/stage.js';

const KEY = 'aayan-code-best';
const wait = ms => new Promise(r => setTimeout(r, ms));
const NAMES = ['Pink', 'Purple', 'Teal', 'Amber'];
const NOTES = [392, 494, 587, 784];

export function init(mount) {
  const cols = palette();
  mount.innerHTML = `
    <div class="vault">
      <p class="status" id="cStatus" role="status">Ready? Watch the lights, then copy them.</p>
      <div class="pads" role="group" aria-label="Secret code pads">
        ${cols.map((c, i) => `<button class="pad" style="--c:${c}" data-i="${i}" aria-label="${NAMES[i]} pad" aria-disabled="true"></button>`).join('')}
      </div>
      <p>Secrets kept: <b id="cScore">0</b> &nbsp; Best: <b id="cBest">${bestScore(KEY)}</b></p>
      <div class="row"><button class="btn" id="cGo">Start</button></div>
    </div>`;
  const $ = s => mount.querySelector(s), pads = [...mount.querySelectorAll('.pad')], status = $('#cStatus');
  let seq = [], idx = 0, locked = true, run = 0; // run guards against a stale round after restart

  const enable = on => pads.forEach(p => p.setAttribute('aria-disabled', !on));
  async function flash(i, ms = 300) {
    pads[i].classList.add('lit'); audio.note(NOTES[i]);
    await wait(ms); pads[i].classList.remove('lit');
  }
  async function show(id) {
    locked = true; enable(false); status.textContent = 'Watch…';
    await wait(600);
    for (const i of seq) { if (id !== run) return; await flash(i); await wait(Math.max(120, 260 - seq.length * 8)); }
    if (id !== run) return;
    idx = 0; locked = false; enable(true); status.textContent = 'Your turn';
  }
  const next = () => { seq.push(Math.floor(Math.random() * 4)); show(run); };

  pads.forEach((p, i) => p.addEventListener('click', async () => {
    if (locked) return;
    haptic(8); flash(i, 180);
    if (i !== seq[idx]) return lose();
    if (++idx === seq.length) {
      locked = true; enable(false); $('#cScore').textContent = seq.length;
      status.textContent = 'Nice. Next round…'; audio.sfx('match');
      await wait(900); next();
    }
  }));

  function lose() {
    locked = true; enable(false); audio.sfx('wrong');
    const n = seq.length - 1, prev = bestScore(KEY);
    if (n > prev) { saveBest(KEY, n); $('#cBest').textContent = n; fire.burst(); }
    status.textContent = n > 0 ? `Oops. You kept ${n} secret${n > 1 ? 's' : ''}.` : 'Oops. That one slipped out.';
    $('#cGo').textContent = 'Try again'; $('#cGo').hidden = false;
  }
  $('#cGo').addEventListener('click', () => {
    run++; seq = []; $('#cScore').textContent = 0; $('#cGo').hidden = true; next();
  });
}
