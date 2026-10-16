(() => {
  const button = document.querySelector('.home-primary-link');
  if (!button) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const properties = ['--cta-x', '--cta-y', '--cta-light-x', '--cta-light-y'];
  let frame = 0;
  let x = .5;
  let y = .5;
  const reset = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    properties.forEach(name => button.style.removeProperty(name));
  };
  button.addEventListener('pointermove', event => {
    if (motion.matches || !pointer.matches || event.pointerType === 'touch') return;
    const rect = button.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      button.style.setProperty('--cta-x', `${(x - .5) * 44}px`);
      button.style.setProperty('--cta-y', `${(y - .5) * 24}px`);
      button.style.setProperty('--cta-light-x', `${x * 100}%`);
      button.style.setProperty('--cta-light-y', `${y * 100}%`);
    });
  }, {passive: true});
  button.addEventListener('pointerleave', reset);
  button.addEventListener('pointercancel', reset);
  motion.addEventListener('change', reset);
  pointer.addEventListener('change', reset);
})();
