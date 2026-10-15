(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const wide = window.matchMedia('(min-width: 900px)');
  const story = document.querySelector('[data-case-story]');
  const viewport = story?.querySelector('.case-viewport');
  const track = viewport?.querySelector('.case-track');
  let frame = 0, start = 0, travel = 1, maxX = 0;
  const clamp = value => Math.max(0, Math.min(1, value));
  const render = () => {
    frame = 0;
    if (!story?.classList.contains('is-pinned')) return;
    start = story.getBoundingClientRect().top + window.scrollY;
    const progress = clamp((window.scrollY - start) / travel);
    track.style.transform = `translate3d(${-maxX * progress}px,0,0)`;
    story.dataset.caseProgress = progress.toFixed(4);
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(render); };
  const measure = () => {
    if (!story || !track) return;
    story.classList.remove('is-pinned'); story.style.height = ''; track.style.transform = '';
    maxX = Math.max(0, track.scrollWidth - track.clientWidth);
    if (wide.matches && !reduced.matches && maxX > 0) {
      track.scrollLeft = 0;
      story.classList.add('is-pinned');
      travel = Math.max(maxX, viewport.offsetHeight * .75) * 1.25;
      story.style.height = `${viewport.offsetHeight + travel}px`;
      start = story.getBoundingClientRect().top + window.scrollY;
      schedule();
    }
  };
  if (story && track) {
    const cards = [...track.querySelectorAll('.case-card')];
    track.addEventListener('focusin', event => {
      const card = event.target.closest('.case-card');
      if (!card || !story.classList.contains('is-pinned')) return;
      start = story.getBoundingClientRect().top + window.scrollY;
      const target = clamp((card.offsetLeft - (viewport.clientWidth - card.offsetWidth) / 2) / Math.max(1, maxX));
      window.scrollTo({top: start + travel * target, behavior: 'auto'});
    });
    track.addEventListener('keydown', event => {
      if (!['ArrowRight', 'ArrowLeft'].includes(event.key)) return;
      const index = cards.indexOf(event.target.closest('.case-card'));
      if (index < 0) return;
      event.preventDefault();
      cards[Math.max(0, Math.min(cards.length - 1, index + (event.key === 'ArrowRight' ? 1 : -1)))].focus();
    });
    window.addEventListener('scroll', schedule, {passive: true});
    window.addEventListener('resize', measure, {passive: true});
    reduced.addEventListener('change', measure); wide.addEventListener('change', measure);
    document.fonts?.ready.then(measure); measure();
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
  if (document.body.hasAttribute('data-case-page')) {
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
