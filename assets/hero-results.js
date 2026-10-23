/* A decorative trace tied to the existing phone pose, with native mobile flow. */
(() => {
  const clock = window.HevenMotion;
  const chapter = document.querySelector('[data-flow-results]');
  const graph = chapter?.querySelector('.flow-growth');
  const path = graph?.querySelector('.flow-growth-line');
  const dot = graph?.querySelector('.flow-growth-dot');
  if (!clock || !graph || !path || !dot) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const scene = document.querySelector('[data-flow-scene]');
  const clamp = n => Math.max(0, Math.min(1, n));
  const ease = t => t * t * (3 - 2 * t);
  let samples, mobile = false, top = 0, span = 1, last = -1, dotScaleX = 1, dotScaleY = 1, unsubscribe;
  const draw = value => {
    const t = ease(clamp(value));
    if (!samples || t === last) return;
    last = t;
    graph.style.setProperty('--growth-rest', String(1 - t));
    const at = t * 100, index = Math.min(99, Math.floor(at)), fraction = at - index;
    const a = samples[index], b = samples[index + 1];
    dot.setAttribute('transform', `translate(${a.x + (b.x - a.x) * fraction} ${a.y + (b.y - a.y) * fraction}) scale(${dotScaleX} ${dotScaleY})`);
  };
  const fromPose = event => {
    if (!mobile && !motion.matches) draw((event.detail.progress - 1.3) / .7);
  };
  const measure = () => {
    mobile = window.innerWidth < 900;
    if (!samples) {
      // Cache geometry once. Rendering never measures layout or path length.
      try {
        const length = path.getTotalLength();
        if (!length || !Number.isFinite(length)) return;
        samples = Array.from({length: 101}, (_, i) => path.getPointAtLength(length * i / 100));
      } catch { return; } // The complete static line remains available.
    }
    const box = graph.getBoundingClientRect();
    // Counter SVG stretching so the moving endpoint stays round at every size.
    dotScaleX = box.width > 0 ? 600 / box.width : 1;
    dotScaleY = box.height > 0 ? 220 / box.height : 1;
    last = -1;
    if (mobile) {
      top = box.top + window.scrollY - window.innerHeight * .9;
      span = Math.max(160, window.innerHeight * .42);
    }
    draw(motion.matches ? 1 : mobile ? (window.scrollY - top) / span : (Number(scene?.dataset.storyProgress || 0) - 1.3) / .7);
  };
  const render = state => {
    if (mobile && !motion.matches) draw((state.y - top) / span);
    return false;
  };
  const mount = () => {
    if (unsubscribe) return;
    window.addEventListener('flow:pose', fromPose);
    unsubscribe = clock.subscribe({measure, render});
  };
  window.addEventListener('pagehide', () => {
    unsubscribe?.(); unsubscribe = null;
    window.removeEventListener('flow:pose', fromPose);
  });
  window.addEventListener('pageshow', event => { if (event.persisted) mount(); });
  motion.addEventListener('change', clock.reset);
  mount();
})();
