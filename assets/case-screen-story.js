/* The shell stays still. Only four display layers share the home's scroll clock. */
(() => {
  const story = document.querySelector('[data-case-screen-story]');
  const clock = window.HevenMotion;
  if (!story || !clock) return;
  const stage = story.querySelector('.case-device');
  const frame = story.querySelector('.case-device-frame');
  const chapter = story.parentElement;
  const display = story.querySelector('.case-device-display');
  const views = [...story.querySelectorAll('.case-device-view')];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const ready = views.map(image => image.complete && image.naturalWidth > 0);
  const cleanups = [];
  const catchup = views.map(() => false);
  let displayed = views.map((_, index) => index === 0 ? 1 : 0);
  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = value => value * value * value * (value * (value * 6 - 15) + 10);
  let enabled = false, start = 0, hold = 1, blend = 1, travel = 1;
  let position = 0, active = 0, last = '', warmed = false, alive = true;
  let viewport = 1, lift = false, center = 0, overlap = false, lastY = '', lastRise = '';
  const paint = (value, state) => {
    const targets = views.map((_, index) => index === 0 ? 1 : ready[index] ? ease(clamp((value - (index * hold + (index - 1) * blend)) / blend)) : 0);
    const opacities = targets.map((target, index) => catchup[index] && !reduced.matches ? clock.approach(displayed[index], target, state.dt, false) : target);
    const moving = opacities.some((value, index) => value !== targets[index]);
    catchup.forEach((_, index) => { if (opacities[index] === targets[index]) catchup[index] = false; });
    displayed = opacities;
    const signature = opacities.join(':');
    if (last === signature) return moving;
    let selected = 0;
    views.forEach((image, index) => {
      image.style.opacity = String(opacities[index]);
      if (opacities[index] >= .5) selected = index;
    });
    if (active !== selected || last === '') {
      active = selected;
      display.setAttribute('aria-label', `${story.dataset.screenProject}: ${views[active].dataset.screenLabel}, pantalla ${active + 1} de 4`);
    }
    last = signature;
    return moving;
  };
  const warm = () => {
    if (warmed) return;
    warmed = true;
    views.forEach((image, index) => {
      image.loading = 'eager';
      const loaded = () => {
        if (!alive) return;
        const loaded = image.naturalWidth > 0;
        catchup[index] = loaded && !ready[index] && index > 0 && !reduced.matches;
        ready[index] = loaded;
        last = ''; clock.wake();
      };
      if (image.decode) image.decode().then(loaded).catch(() => {});
      else {
        image.addEventListener('load', loaded);
        cleanups.push(() => image.removeEventListener('load', loaded));
        if (image.complete) loaded();
      }
    });
  };
  const unsubscribe = clock.subscribe({
    measure() {
      enabled = !reduced.matches && window.innerHeight >= 600;
      story.toggleAttribute('data-screen-ready', enabled);
      const height = stage.offsetHeight;
      viewport = window.innerHeight;
      const frameHeight = frame.offsetHeight;
      // Keep the photo's width. Its base peeks below the fold, then lifts into view.
      lift = enabled && window.innerWidth >= 900 && frameHeight >= height * .72;
      center = (height - frameHeight) / 2;
      overlap = enabled && chapter.hasAttribute('data-showcase-ready');
      hold = Math.max(320, Math.min(600, height * .52));
      blend = Math.min(clock.settings.arrivalMax, Math.max(clock.settings.arrivalMin, height * clock.settings.arrivalDistance));
      travel = hold * 4 + blend * 3;
      if (enabled) story.style.height = `${height + travel}px`;
      else story.style.removeProperty('height');
      start = story.getBoundingClientRect().top + window.scrollY;
      last = ''; lastY = ''; lastRise = '';
    },
    render(state) {
      const target = Math.max(0, Math.min(travel, state.y - start));
      // Release the preceding copy with the page so it never sits behind the clear Mac.
      const rise = overlap ? -Math.max(0, Math.min(viewport + 24, state.y - start + viewport)) : 0;
      if (rise !== lastRise) { chapter.style.setProperty('--case-overview-rise', `${rise}px`); lastRise = rise; }
      if (!enabled) {
        if (lastY !== 0) { frame.style.setProperty('--case-device-y', '0px'); lastY = 0; }
        return paint(0, state);
      }
      position = clock.approach(position, target, state.dt, state.immediate || target === 0 || target === travel);
      const y = lift ? center + 48 - 64 * ease(clamp(position / (hold * .55))) : 0;
      if (y !== lastY) { frame.style.setProperty('--case-device-y', `${y}px`); lastY = y; }
      const blending = paint(position, state);
      return position !== target || blending;
    },
  });
  const observer = new ResizeObserver(clock.invalidate); observer.observe(stage); observer.observe(frame);
  const proximity = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    warm(); proximity.disconnect();
  }, {rootMargin: '100% 0px'}) : null;
  if (proximity) proximity.observe(story); else warm();
  reduced.addEventListener('change', clock.invalidate);
  window.addEventListener('pagehide', event => {
    if (event.persisted) return;
    alive = false; unsubscribe(); observer.disconnect(); proximity?.disconnect();
    reduced.removeEventListener('change', clock.invalidate); cleanups.forEach(cleanup => cleanup());
  });
})();
