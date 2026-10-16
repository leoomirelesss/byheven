/* Scroll-led entrances. Once presented, content leaves only with the native page. */
(() => {
  const clock = window.HevenMotion;
  if (!clock) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const entries = [...document.querySelectorAll('[data-arrival-title], [data-arrival-item]')].map(element => ({
    element, lines: [...element.querySelectorAll('[data-arrival-line]')],
    top: 0, value: 0, shift: 0, last: -1, done: false,
  }));
  if (!entries.length) return;
  let enabled = false;
  const clamp = value => Math.max(0, Math.min(1, value));
  const clear = entry => {
    entry.element.classList.remove('is-arrival-ready');
    entry.element.style.removeProperty('--arrival-y');
    entry.element.style.removeProperty('--arrival-opacity');
    entry.lines.forEach(line => line.style.removeProperty('--arrival-line-y'));
    entry.shift = 0; entry.last = -1;
  };
  const measure = () => {
    enabled = !motion.matches && window.innerHeight >= 600;
    entries.forEach(entry => {
      if (!enabled) { clear(entry); return; }
      // A block's own presentation shift must not change its document trigger.
      entry.top = entry.element.getBoundingClientRect().top + window.scrollY - entry.shift;
      entry.element.classList.add('is-arrival-ready');
    });
  };
  const render = state => {
    if (!enabled) return false;
    const distance = Math.min(240, Math.max(140, state.height * .24));
    let moving = false;
    entries.forEach(entry => {
      const target = entry.done ? 1 : clamp((state.y + state.height * .92 - entry.top) / distance);
      entry.value = clock.approach(entry.value, target, state.dt, state.immediate);
      moving ||= entry.value !== target;
      if (entry.value === 1) entry.done = true;
      if (entry.last === entry.value) return;
      const eased = 1 - Math.pow(1 - entry.value, 3);
      if (entry.lines.length) {
        entry.lines.forEach((line, index) => {
          const delay = Math.min(.2, index * .08);
          const progress = clamp((entry.value - delay) / (1 - delay));
          line.style.setProperty('--arrival-line-y', `${108 * Math.pow(1 - progress, 3)}%`);
        });
      } else {
        entry.shift = 32 * (1 - eased);
        entry.element.style.setProperty('--arrival-y', `${entry.shift}px`);
        entry.element.style.setProperty('--arrival-opacity', String(.72 + .28 * eased));
      }
      entry.last = entry.value;
    });
    return moving;
  };
  // Interacted content stays steady, even before its entrance finishes.
  document.addEventListener('focusin', event => {
    const entry = entries.find(entry => entry.element.contains(event.target));
    if (entry) { entry.done = true; entry.value = 1; clock.wake(); }
  });
  clock.subscribe({measure, render});
})();
