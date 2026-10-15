(() => {
  const section = document.querySelector('[data-commerce-services]');
  if (!section) return;
  const rows = [...section.querySelectorAll('.commerce-service')];
  const setOpen = (row, open) => {
    row.classList.toggle('is-open', open);
    row.querySelector('.commerce-service-toggle').setAttribute('aria-expanded', String(open));
    const panel = row.querySelector('.commerce-service-panel');
    panel.setAttribute('aria-hidden', String(!open));
    panel.inert = !open;
    row.querySelector('.commerce-service-symbol').textContent = open ? '−' : '+';
  };
  rows.forEach(row => {
    const button = row.querySelector('.commerce-service-toggle');
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      rows.forEach(item => setOpen(item, item === row && open));
    });
  });

  // A short native sticky hold at arrival, followed by the usual document flow.
  const inner = section.querySelector('.commerce-services-inner');
  if (!inner || !('ResizeObserver' in window)) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  const measure = () => {
    frame = 0;
    const enabled = !motion.matches && window.innerHeight >= 600;
    section.classList.toggle('is-arrival-paused', enabled);
    if (!enabled) {
      section.style.removeProperty('--services-arrival-height');
      section.style.removeProperty('--services-arrival-top');
      return;
    }
    const padding = getComputedStyle(section);
    const top = parseFloat(padding.paddingTop) || 0;
    const bottom = parseFloat(padding.paddingBottom) || 0;
    const hold = window.innerWidth <= 700
      ? Math.min(112, Math.max(72, window.innerHeight * .12))
      : Math.min(180, Math.max(96, window.innerHeight * .18));
    section.style.setProperty('--services-arrival-top', `${top}px`);
    section.style.setProperty('--services-arrival-height', `${inner.offsetHeight + top + bottom + hold}px`);
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
  const observer = new ResizeObserver(schedule);
  observer.observe(inner);
  window.addEventListener('resize', schedule, {passive: true});
  motion.addEventListener('change', schedule);
  document.fonts?.ready.then(schedule);
  measure();
})();
