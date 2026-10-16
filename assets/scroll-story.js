/* One demand-driven clock for the home's native-scroll chapters. No wheel interception. */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clients = new Set();
  let frame = 0, previousTime = 0, previousY = window.scrollY;
  let dirty = true, snap = true;
  const wake = () => {
    if (!frame && !document.hidden) frame = requestAnimationFrame(tick);
  };
  const invalidate = () => { dirty = true; wake(); };
  const reset = () => { snap = true; invalidate(); };
  function tick(time) {
    frame = 0;
    if (document.hidden) return;
    const state = {
      y: window.scrollY,
      height: window.innerHeight,
      dt: previousTime ? Math.min(64, Math.max(1, time - previousTime)) : 16.67,
      immediate: snap || reduced.matches || Math.abs(window.scrollY - previousY) > window.innerHeight * 1.5,
    };
    previousTime = time; previousY = state.y; snap = false;
    if (dirty) {
      dirty = false;
      clients.forEach(client => client.measure?.(state));
    }
    let moving = false;
    clients.forEach(client => { moving = client.render(state) || moving; });
    if (moving) wake();
    else previousTime = 0;
  }
  window.HevenMotion = {
    subscribe(client) { clients.add(client); invalidate(); return () => clients.delete(client); },
    wake, invalidate, reset,
    // Time-based damping feels the same at 60 and 120Hz; exact endpoints let sticky release cleanly.
    approach(value, target, dt, immediate = false, epsilon = .0001) {
      if (immediate || Math.abs(target - value) < epsilon) return target;
      const next = value + (target - value) * (1 - Math.exp(-dt / 70));
      return Math.abs(target - next) < epsilon ? target : next;
    },
  };
  window.addEventListener('scroll', wake, {passive: true});
  window.addEventListener('resize', invalidate, {passive: true});
  window.addEventListener('pageshow', reset);
  window.addEventListener('hashchange', reset);
  reduced.addEventListener('change', reset);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; previousTime = 0; }
    else reset();
  });
  if ('ResizeObserver' in window) {
    const main = document.querySelector('.commerce-world');
    if (main) new ResizeObserver(invalidate).observe(main);
  }
  document.fonts?.ready.then(invalidate);
})();
