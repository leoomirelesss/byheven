/* A single editorial name decodes across its visible scroll range.
   The original letters retain their width; no random loops or extra scroll clock. */
(() => {
  const hero = document.querySelector('[data-case-hero]');
  const clock = window.HevenMotion;
  if (!hero || !clock) return;
  const config = clock.settings;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cue = hero.querySelector('.case-scroll-cue');
  const words = [...hero.querySelectorAll('.case-title-word')];
  const letters = [...hero.querySelectorAll('.case-title-char')].map(element => ({element, glyph: null, lowercase: element.textContent === element.textContent.toLocaleLowerCase()}));
  const title = hero.querySelector('.case-hero-title');
  const story = document.querySelector('[data-case-showcase-story]');
  const overview = story?.querySelector('.case-editorial');
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = value => value * value * value * (value * (value * 6 - 15) + 10);
  let top = 0, height = 1, arrival = 1, depth = 0, progress = 0, intro = 0, last = '', dismissed = false;
  const unsubscribe = clock.subscribe({
    measure() {
      top = hero.getBoundingClientRect().top + window.scrollY;
      height = Math.max(1, hero.offsetHeight);
      // Finish only when the title's final line has left the viewport.
      arrival = Math.max(1, title.getBoundingClientRect().bottom + window.scrollY - top);
      if (story && overview) {
        const enabled = !reduced.matches && window.innerWidth >= 900 && window.innerHeight >= 640;
        story.toggleAttribute('data-showcase-ready', enabled);
        if (enabled) story.style.setProperty('--case-overview-top', `${Math.min(24, window.innerHeight - overview.offsetHeight - 24)}px`);
        else story.style.removeProperty('--case-overview-top');
      }
      depth = window.innerWidth >= 900 && window.innerHeight >= 640 ? height * config.parallax / 100 : 0;
      last = '';
    },
    render(state) {
      if (!dismissed && state.y > top + 1) { dismissed = true; cue?.classList.add('is-dismissed'); }
      const target = reduced.matches ? 0 : clamp((state.y - top) / height);
      const entryTarget = reduced.matches ? 1 : clamp((state.y - top) / arrival);
      progress = clock.approach(progress, target, state.dt, state.immediate || reduced.matches || target === 0 || target === 1);
      intro = clock.approach(intro, entryTarget, state.dt, state.immediate || reduced.matches || entryTarget === 0 || entryTarget === 1);
      const moving = progress !== target || intro !== entryTarget;
      const signature = progress + ':' + intro;
      if (signature === last) return moving;
      hero.style.setProperty('--case-hero-y', `${progress * depth}px`);
      words.forEach((word, index) => {
        const delay = Math.min(config.lineDelayMax, index * config.lineDelay);
        const phase = ease(clamp((intro - delay) / (1 - delay)));
        word.style.setProperty('--case-word-y', `${reduced.matches ? 0 : config.arrivalShift * .35 * (1 - phase)}px`);
      });
      const phase = intro * intro * (3 - 2 * intro);
      letters.forEach((letter, index) => {
        const age = phase * (letters.length + .5) - index;
        // At most two letters decode at once. Start/end poses are fully readable.
        const active = !reduced.matches && intro > 0 && intro < 1 && age >= 0 && age < 1.6;
        let glyph = active ? alphabet[(Math.floor(age * 3) + index * 7) % alphabet.length] : null;
        if (glyph && letter.lowercase) glyph = glyph.toLocaleLowerCase();
        if (glyph === letter.glyph) return;
        if (glyph === null) letter.element.removeAttribute('data-scramble');
        else letter.element.setAttribute('data-scramble', glyph);
        letter.glyph = glyph;
      });
      last = signature;
      return moving;
    },
  });
  reduced.addEventListener('change', clock.invalidate);
  const observer = new ResizeObserver(clock.invalidate); observer.observe(hero); observer.observe(title);
  if (overview) observer.observe(overview);
  window.addEventListener('pagehide', event => {
    if (event.persisted) return;
    unsubscribe(); observer.disconnect(); reduced.removeEventListener('change', clock.invalidate);
  });
})();
