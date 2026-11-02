// Shared helpers for the canvas games: sizing, a pausable frame loop, and the start/end overlay.
export function stage(cv, update) {
  const c = cv.getContext('2d');
  let W = 300, H = 400, dpr = 1, raf = 0, last = 0, on = false, inView = true;
  new ResizeObserver(() => { dpr = Math.min(devicePixelRatio, 2); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; }).observe(cv);
  const frame = ts => {
    raf = 0;
    if (!on || !inView) return;
    const dt = Math.min(.05, (ts - (last || ts)) / 1000); last = ts;
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
    if (update(dt, c, W, H) === false) { on = false; return; }
    raf = requestAnimationFrame(frame);
  };
  // pause while scrolled away
  new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (inView && on && !raf) { last = 0; raf = requestAnimationFrame(frame); } }).observe(cv);
  return {
    start() { on = true; last = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); },
    stop() { on = false; },
    size: () => [W, H],
    point: e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; },
  };
}

export function overlay(ov, title, body, btn, onGo) {
  ov.hidden = false;
  ov.innerHTML = `<h3>${title}</h3>${body}<button class="btn">${btn}</button>`;
  const b = ov.querySelector('button');
  b.addEventListener('click', () => { ov.hidden = true; onGo(); });
  b.focus({ preventScroll: true });
}

export const bestScore = key => { try { return +localStorage.getItem(key) || 0; } catch { return 0; } };
export const saveBest = (key, v) => { try { localStorage.setItem(key, v); } catch { /* private mode */ } };
