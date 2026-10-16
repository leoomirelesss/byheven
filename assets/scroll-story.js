/* One demand-driven clock for wheel easing and every scroll-driven chapter. */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clients = new Set();
  let frame = 0, previousTime = 0, previousY = window.scrollY;
  let dirty = true, snap = true;
  let wheelActive = false, wheelTarget = window.scrollY, wheelPosition = window.scrollY, writtenY = window.scrollY, limit = 0;
  const stopWheel = () => { wheelActive = false; wheelTarget = window.scrollY; };
  const clamp = value => Math.max(0, Math.min(limit, value));
  // Keep native touch momentum, zoom, keyboard, anchors and nested scrollers.
  function onWheel(event) {
    if (reduced.matches || event.defaultPrevented || !event.cancelable || event.ctrlKey || event.metaKey ||
        Math.abs(event.deltaX) > Math.abs(event.deltaY) || !event.deltaY) return;
    const path = event.composedPath?.() || [event.target];
    for (const node of path) {
      if (!node || node === document.body || node === document.documentElement) break;
      if (node.nodeType !== 1) continue;
      if (node.matches('input, textarea, select, [contenteditable="true"], [data-native-scroll]')) return;
      const overflow = getComputedStyle(node).overflowY;
      if (/(auto|scroll)/.test(overflow) && node.scrollHeight > node.clientHeight + 1 &&
          (event.deltaY < 0 ? node.scrollTop > 0 : node.scrollTop + node.clientHeight < node.scrollHeight - 1)) return;
    }
    limit = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
    const delta = event.deltaY * unit * .68;
    const current = window.scrollY;
    if (!wheelActive || delta * (wheelTarget - current) < 0) { wheelTarget = current; wheelPosition = current; }
    const next = clamp(wheelTarget + delta);
    if (next === current && !wheelActive) return;
    event.preventDefault();
    wheelTarget = next; writtenY = current; wheelActive = true; wake();
  }
  const wake = () => {
    if (!frame && !document.hidden) frame = requestAnimationFrame(tick);
  };
  const invalidate = () => { dirty = true; wake(); };
  const reset = () => { stopWheel(); snap = true; invalidate(); };
  function tick(time) {
    frame = 0;
    if (document.hidden) return;
    const dt = previousTime ? Math.min(64, Math.max(1, time - previousTime)) : 16.67;
    if (dirty && document.documentElement) limit = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const wheelFrame = wheelActive;
    if (wheelActive) {
      wheelTarget = clamp(wheelTarget);
      const current = window.scrollY;
      const next = wheelPosition + (wheelTarget - wheelPosition) * (1 - Math.exp(-dt / 110));
      wheelPosition = next;
      const settled = Math.abs(wheelTarget - next) < 1;
      window.scrollTo({top: settled ? wheelTarget : next, behavior: 'instant'});
      writtenY = window.scrollY;
      if (settled) wheelActive = false;
    }
    const state = {
      y: window.scrollY,
      height: window.innerHeight,
      dt,
      immediate: wheelFrame || snap || reduced.matches || Math.abs(window.scrollY - previousY) > window.innerHeight * 1.5,
    };
    previousTime = time; previousY = state.y; snap = false;
    if (dirty) {
      dirty = false;
      clients.forEach(client => client.measure?.(state));
    }
    let moving = false;
    clients.forEach(client => { moving = client.render(state) || moving; });
    if (moving || wheelActive) wake();
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
  window.addEventListener('scroll', () => {
    // Native scrollbar, focus or an external scrollTo takes ownership immediately.
    if (wheelActive && Math.abs(window.scrollY - writtenY) > 2) stopWheel();
    wake();
  }, {passive: true});
  window.addEventListener('wheel', onWheel, {passive: false});
  window.addEventListener('touchstart', stopWheel, {passive: true});
  window.addEventListener('pointerdown', stopWheel, {passive: true});
  window.addEventListener('keydown', event => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Tab'].includes(event.key)) stopWheel();
  });
  window.addEventListener('resize', invalidate, {passive: true});
  window.addEventListener('pageshow', reset);
  window.addEventListener('hashchange', reset);
  reduced.addEventListener('change', reset);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { stopWheel(); cancelAnimationFrame(frame); frame = 0; previousTime = 0; }
    else reset();
  });
  if ('ResizeObserver' in window) {
    const main = document.querySelector('.commerce-world');
    if (main) new ResizeObserver(invalidate).observe(main);
  }
  document.fonts?.ready.then(invalidate);
})();
