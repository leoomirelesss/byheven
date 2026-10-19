/* Hero depth and type movement share the home's clock. No perpetual marquee. */
(() => {
  const hero = document.querySelector('[data-case-hero]');
  const clock = window.HevenMotion;
  if (!hero || !clock) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cue = hero.querySelector('.case-scroll-cue');
  let top = 0, height = 1, width = 1, last = -1, dismissed = false;
  const unsubscribe = clock.subscribe({
    measure() {
      top = hero.getBoundingClientRect().top + window.scrollY;
      height = Math.max(1, hero.offsetHeight); width = hero.clientWidth; last = -1;
    },
    render(state) {
      if (!dismissed && state.y > top + 1) { dismissed = true; cue?.classList.add('is-dismissed'); }
      const progress = reduced.matches ? 0 : Math.max(0, Math.min(1, (state.y - top) / height));
      if (progress === last) return false;
      hero.style.setProperty('--case-hero-y', `${progress * Math.min(120, height * .12)}px`);
      hero.style.setProperty('--case-title-x', `${progress * width * .16}px`);
      last = progress;
      return false;
    },
  });
  reduced.addEventListener('change', clock.invalidate);
  const observer = new ResizeObserver(clock.invalidate); observer.observe(hero);
  window.addEventListener('pagehide', event => {
    if (event.persisted) return;
    unsubscribe(); observer.disconnect(); reduced.removeEventListener('change', clock.invalidate);
  });
})();
