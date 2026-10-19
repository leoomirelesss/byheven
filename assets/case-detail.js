/* Hero depth and type movement share the home's clock. No perpetual marquee. */
(() => {
  const hero = document.querySelector('[data-case-hero]');
  const clock = window.HevenMotion;
  if (!hero || !clock) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cue = hero.querySelector('.case-scroll-cue');
  let top = 0, height = 1, width = 1, last = -1, progress = 0, dismissed = false;
  const unsubscribe = clock.subscribe({
    measure() {
      top = hero.getBoundingClientRect().top + window.scrollY;
      height = Math.max(1, hero.offsetHeight); width = hero.clientWidth; last = -1;
    },
    render(state) {
      if (!dismissed && state.y > top + 1) { dismissed = true; cue?.classList.add('is-dismissed'); }
      const target = reduced.matches ? 0 : Math.max(0, Math.min(1, (state.y - top) / height));
      progress = clock.approach(progress, target, state.dt, state.immediate || reduced.matches || target === 0 || target === 1);
      const moving = progress !== target;
      if (progress === last) return moving;
      const depth = window.innerWidth >= 900 && window.innerHeight >= 640 ? height * clock.settings.parallax / 100 : 0;
      hero.style.setProperty('--case-hero-y', `${progress * depth}px`);
      hero.style.setProperty('--case-title-x', `${progress * width * .16}px`);
      last = progress;
      return moving;
    },
  });
  reduced.addEventListener('change', clock.invalidate);
  const observer = new ResizeObserver(clock.invalidate); observer.observe(hero);
  window.addEventListener('pagehide', event => {
    if (event.persisted) return;
    unsubscribe(); observer.disconnect(); reduced.removeEventListener('change', clock.invalidate);
  });
})();
