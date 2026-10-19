(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const wide = window.matchMedia('(min-width: 900px)');
  const story = document.querySelector('[data-case-story]');
  const viewport = story?.querySelector('.case-viewport');
  const track = viewport?.querySelector('.case-track');
  const clock = window.HevenMotion;
  let start = 0, travel = 1, maxX = 0, progress = 0, lastProgress = -1;
  let enabled = false, force = true;
  const layers = track ? [...track.querySelectorAll(".case-card")].map(card => ({card, image: card.querySelector(".case-cover"), center: 0})).filter(layer => layer.image) : [];
  let viewportWidth = 1;
  const clamp = value => Math.max(0, Math.min(1, value));
  const render = state => {
    if (!enabled) return false;
    const target = clamp((state.y - start) / travel);
    progress = clock.approach(progress, target, state.dt, state.immediate || state.y <= start || state.y >= start + travel);
    if (force || progress !== lastProgress) {
      track.style.transform = `translate3d(${-maxX * progress}px,0,0)`;
      layers.forEach(layer => {
        const position = Math.max(-1, Math.min(1, (layer.center - maxX * progress - viewportWidth / 2) / viewportWidth));
        layer.image.style.setProperty('--case-depth-x', `${position * -2.5}%`);
      });
      story.dataset.caseProgress = progress.toFixed(4);
      lastProgress = progress; force = false;
    }
    return progress !== target;
  };
  const measure = () => {
    if (!story || !track) return;
    viewportWidth = viewport.clientWidth;
    layers.forEach(layer => { layer.center = layer.card.offsetLeft + layer.card.offsetWidth / 2; });
    const padding = getComputedStyle(viewport);
    const available = viewport.clientWidth - (parseFloat(padding.paddingLeft) || 0) - (parseFloat(padding.paddingRight) || 0);
    maxX = Math.max(0, track.scrollWidth - available);
    const next = wide.matches && !reduced.matches && window.innerHeight >= 640 && maxX > 0;
    if (enabled !== next) {
      enabled = next;
      story.classList.toggle('is-pinned', enabled);
      track.style.transform = '';
      if (enabled) track.scrollLeft = 0;
    }
    if (enabled) {
      travel = Math.max(maxX, viewport.offsetHeight * .75) * 1.25;
      story.style.height = `${viewport.offsetHeight + travel}px`;
      start = story.getBoundingClientRect().top + window.scrollY;
      force = true;
    } else {
      story.style.height = ''; track.style.transform = ''; progress = 0;
      layers.forEach(layer => layer.image.style.removeProperty('--case-depth-x'));
    }
  };
  if (story && track && clock) {
    const cards = [...track.querySelectorAll('.case-card')];
    track.addEventListener('focusin', event => {
      const card = event.target.closest('.case-card');
      if (!card || !enabled) return;
      const target = clamp((card.offsetLeft - (viewport.clientWidth - card.offsetWidth) / 2) / Math.max(1, maxX));
      window.scrollTo({top: start + travel * target, behavior: 'instant'});
      clock.reset();
    });
    track.addEventListener('keydown', event => {
      if (!['ArrowRight', 'ArrowLeft'].includes(event.key)) return;
      const index = cards.indexOf(event.target.closest('.case-card'));
      if (index < 0) return;
      event.preventDefault();
      const next = cards[Math.max(0, Math.min(cards.length - 1, index + (event.key === 'ArrowRight' ? 1 : -1)))];
      if (enabled) next.focus({preventScroll: true});
      else { next.focus(); next.scrollIntoView({block: 'nearest', inline: 'nearest', behavior: 'auto'}); }
    });
    reduced.addEventListener('change', clock.reset); wide.addEventListener('change', clock.reset);
    clock.subscribe({measure, render});
  }
  document.querySelectorAll('.case-card').forEach(card => {
    const peek = card.querySelector('.case-peek');
    if (!peek) return;
    let pending = 0, point;
    card.addEventListener('pointermove', event => {
      if (!fine.matches || reduced.matches) return;
      point = {x: event.clientX, y: event.clientY};
      if (pending) return;
      pending = requestAnimationFrame(() => {
        pending = 0;
        const rect = card.getBoundingClientRect();
        const halfWidth = peek.offsetWidth / 2;
        const halfHeight = peek.offsetHeight / 2;
        card.style.setProperty('--peek-x', `${Math.max(halfWidth + 16, Math.min(rect.width - halfWidth - 16, point.x - rect.left))}px`);
        card.style.setProperty('--peek-y', `${Math.max(halfHeight + 16, Math.min(rect.height - halfHeight - 16, point.y - rect.top))}px`);
      });
    }, {passive: true});
    card.addEventListener('pointerleave', () => { cancelAnimationFrame(pending); pending = 0; });
  });
  // The dedicated static pages reuse the site's expandable navigation.
  if (document.body.hasAttribute('data-case-page') && !document.body.hasAttribute('data-home-navigation')) {
    const toggle = document.querySelector('.cinema-menu-toggle');
    const panel = document.getElementById('mobile-menu-panel');
    const nav = document.querySelector('.cinema-nav');
    const setMenu = (open, returnFocus = false) => {
      document.body.classList.toggle('mobile-menu-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      panel.setAttribute('aria-hidden', String(!open)); panel.inert = !open;
      if (open) { nav.classList.add('is-expanded'); panel.querySelector('a')?.focus(); }
      else if (returnFocus) toggle.focus();
    };
    toggle?.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
    panel?.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && document.body.classList.contains('mobile-menu-open')) setMenu(false, true); });
  }
})();
