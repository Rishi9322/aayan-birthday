import gsap from 'gsap';
import cfg from '../config.js';
import { audio } from '../lib/audio.js';
import { fire, reduced, rand } from '../lib/fx.js';

export function init(mount) {
  mount.innerHTML = `
    <div class="sky2" id="sky2">
      <div id="notes"></div><div id="lanterns" aria-hidden="true"></div>
      <article class="reader" id="reader" role="dialog" aria-label="Message" hidden>
        <p id="rm"></p><p class="rf" id="rf"></p>
        <button class="btn small" id="rClose">Close</button>
      </article>
    </div>
    <form class="wishform" id="wf">
      <label class="sr" for="wishIn">Your wish</label>
      <input id="wishIn" maxlength="70" placeholder="Type a wish for the sky…" autocomplete="off" required>
      <button class="btn" type="submit">Send ✨</button>
    </form>
    <p class="hint" id="wStatus" role="status"></p>`;
  const $ = s => mount.querySelector(s), sky = $('#sky2'), reader = $('#reader');

  // pre-written notes drift gently; tap to read
  cfg.notes.forEach((n, k) => {
    const b = document.createElement('button');
    b.className = 'note'; b.textContent = `✉ ${n.from}`;
    b.style.left = (6 + (k % 3) * 30 + rand(0, 8)) + '%'; b.style.top = (8 + Math.floor(k / 3) * 34 + rand(0, 14)) + '%';
    b.style.rotate = rand(-6, 6) + 'deg';
    b.addEventListener('click', () => { audio.sfx('chime'); $('#rm').textContent = n.text; $('#rf').textContent = `– ${n.from}`; reader.hidden = false; $('#rClose').focus(); });
    $('#notes').append(b);
    if (!reduced) gsap.to(b, { y: rand(8, 16), x: rand(-8, 8), duration: rand(2.5, 4), repeat: -1, yoyo: true, ease: 'sine.inOut' });
  });
  $('#rClose').addEventListener('click', () => { reader.hidden = true; });
  reader.addEventListener('keydown', e => { if (e.key === 'Escape') reader.hidden = true; });

  // wishes float up as lanterns (local only, nothing is sent anywhere)
  $('#wf').addEventListener('submit', e => {
    e.preventDefault();
    const inp = $('#wishIn'), text = inp.value.trim();
    if (!text) return;
    inp.value = '';
    const L = document.createElement('div');
    L.className = 'lantern'; L.style.left = rand(10, 75) + '%';
    const label = document.createElement('span'); label.textContent = text; // textContent: no HTML injection
    L.append(document.createElement('b'), label);
    const box = $('#lanterns'); if (box.children.length > 12) box.firstChild.remove();
    box.append(L);
    audio.sfx('chime'); fire.at(innerWidth / 2, sky.getBoundingClientRect().bottom - 40);
    $('#wStatus').textContent = 'Your wish floated into the sky ✨';
    const H = sky.clientHeight;
    if (reduced) { gsap.set(L, { y: -H * .6 }); setTimeout(() => L.remove(), 6000); return; }
    gsap.timeline({ onComplete: () => L.remove() })
      .to(L, { y: -(H + 140), duration: rand(9, 12), ease: 'sine.in' }, 0)
      .to(L, { x: rand(-30, 30), duration: 3, repeat: 3, yoyo: true, ease: 'sine.inOut' }, 0)
      .to(L, { opacity: 0, duration: 2 }, '-=2.5');
  });
}
