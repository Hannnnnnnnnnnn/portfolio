// Motion for the rebuilt portfolio. Values come from the original Figma Sites data
// (see PLAN.md → Behaviour). No dependencies.
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- Appear: replays every time a block re-enters the viewport ----
const blocks = document.querySelectorAll('[data-appear]');
if (!reduced && blocks.length) {
  const io = new IntersectionObserver(entries => {
    for (const e of entries) e.target.classList.toggle('is-in', e.isIntersecting);
  });
  // Blocks already on screen at load show without animating, like the original.
  for (const el of blocks) {
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) {
      el.classList.add('no-anim', 'is-in');
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('no-anim')));
    }
    io.observe(el);
  }
}

// ---- Videos: play only while on screen (as the original's runtime does), so offscreen clips don't stream ----
const clips = document.querySelectorAll('video[data-autoplay]');
if (clips.length) {
  const vio = new IntersectionObserver(entries => {
    for (const e of entries) e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause();
  });
  clips.forEach(v => vio.observe(v));
}

// ---- Avatar: rotates 0→180° over page scroll, −30° on hover, both spring-smoothed ----
// Springs (mass, stiffness, damping) from the original: scroll 1/109.8/17.14, hover 1/600/15.
// Closed-form damped spring (same model the original's motion runtime uses); keeps velocity on retarget.
function spring(k, c, onUpdate, m = 1) {
  const w0 = Math.sqrt(k / m), z = c / (2 * Math.sqrt(k * m)), wd = w0 * Math.sqrt(1 - z * z); // both springs are underdamped (z < 1)
  let from = 0, v0 = 0, target = 0, t0 = 0, x = 0, v = 0, raf = 0;
  const at = t => {
    const s = (t - t0) / 1000, d0 = from - target, B = (v0 + z * w0 * d0) / wd, e = Math.exp(-z * w0 * s), cos = Math.cos(wd * s), sin = Math.sin(wd * s);
    x = target + e * (d0 * cos + B * sin);
    v = e * ((B * wd - z * w0 * d0) * cos - (d0 * wd + z * w0 * B) * sin);
  };
  const step = t => {
    at(t);
    if (Math.abs(x - target) < 0.01 && Math.abs(v) < 0.01) { x = target; v = 0; raf = 0; }
    else raf = requestAnimationFrame(step);
    onUpdate();
  };
  return {
    get value() { return x; },
    set(to, instant) {
      const now = performance.now();
      if (raf) at(now);
      if (instant) { cancelAnimationFrame(raf); raf = 0; x = target = to; v = 0; onUpdate(); return; }
      from = x; v0 = v; target = to; t0 = now;
      if (!raf) raf = requestAnimationFrame(step);
    },
  };
}

const avatar = document.querySelector('.nav__avatar');
if (avatar && !reduced) {
  const render = () => { avatar.style.transform = `rotate(${scroll.value + hover.value}deg)`; };
  const scroll = spring(109.8, 17.14, render);
  const hover = spring(600, 15, render);
  const angle = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    return max > 0 ? 180 * scrollY / max : 0;
  };
  scroll.set(angle(), true);
  addEventListener('scroll', () => scroll.set(angle()), { passive: true });
  addEventListener('resize', () => scroll.set(angle()));
  const home = avatar.closest('a');
  home.addEventListener('pointerenter', () => hover.set(-30));
  home.addEventListener('pointerleave', () => hover.set(0));
}
