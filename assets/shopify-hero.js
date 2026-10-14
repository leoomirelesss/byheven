(() => {
  const scene = document.querySelector('[data-flow-scene]');
  const device = scene?.querySelector('.flow-phone-position');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (!scene || !device) return;
  let frame = 0;
  scene.addEventListener('pointermove', event => {
    if (motion.matches || !finePointer.matches) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const rect = scene.getBoundingClientRect();
      device.style.setProperty('--scene-x', `${((event.clientX - rect.left) / rect.width - .5) * 18}px`);
      device.style.setProperty('--scene-y', `${((event.clientY - rect.top) / rect.height - .5) * 12}px`);
    });
  }, { passive: true });
  const reset = () => {
    cancelAnimationFrame(frame);
    device.style.setProperty('--scene-x', '0px');
    device.style.setProperty('--scene-y', '0px');
  };
  scene.addEventListener('pointerleave', reset);
  motion.addEventListener('change', reset);
})();
