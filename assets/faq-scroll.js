(() => {
  const section = document.getElementById('faq');
  const stage = section?.querySelector('.faq-stage');
  const layout = section?.querySelector('.home-faq-layout');
  const intro = section?.querySelector('.home-faq-intro');
  const hint = section?.querySelector('.chat-hint');
  const viewport = section?.querySelector('.chat-window');
  const track = section?.querySelector('.chat-stream');
  const items = [...(section?.querySelectorAll('.chat-item') || [])];
  if (!stage || !viewport || !track || !items.length || !('ResizeObserver' in window)) return;

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = window.matchMedia('(max-width: 700px)');
  const pace = 1.35;
  const clamp = (value, max) => Math.min(Math.max(value, 0), max);
  let enabled = false;
  let distance = 0;
  let frame = 0;
  let measureNext = true;
  let revealNext = null;

  const start = () => window.scrollY + section.getBoundingClientRect().top;
  const offset = () => clamp((window.scrollY - start()) / pace, distance);
  const measure = () => {
    enabled = !motion.matches && window.innerHeight >= 600;
    section.classList.toggle('is-scroll-story', enabled);
    if (!enabled) {
      section.classList.remove('is-in-view');
      ['--faq-story-height', '--faq-window-height', '--faq-offset'].forEach(name => section.style.removeProperty(name));
      return;
    }
    // Five closed messages on desktop. Smaller screens show only what fits.
    const rowPadding = narrow.matches ? 14 : 16;
    const fiveRows = items.slice(0, 5).reduce((height, item) => height + item.querySelector('summary').offsetHeight + rowPadding, 48);
    const available = layout.clientHeight - (narrow.matches ? intro.offsetHeight + 24 : 0) - hint.offsetHeight - 12;
    const height = Math.max(160, Math.min(fiveRows, available));
    section.style.setProperty('--faq-window-height', `${height}px`);
    distance = Math.max(0, track.scrollHeight - height);
    section.style.setProperty('--faq-story-height', `${stage.offsetHeight + distance * pace}px`);
  };
  const reveal = target => {
    if (!enabled) return;
    const top = target.getBoundingClientRect().top - track.getBoundingClientRect().top;
    const height = viewport.clientHeight;
    const inset = height * .14 + 8;
    const current = offset();
    let next = current;
    if (top < current + inset) next = top - inset;
    else if (top + target.offsetHeight > current + height - inset) {
      next = target.offsetHeight > height - inset * 2 ? top - inset : top + target.offsetHeight - height + inset;
    }
    next = clamp(next, distance);
    if (Math.abs(next - current) > 1) window.scrollTo({top: start() + next * pace, behavior: 'instant'});
  };
  const render = () => {
    frame = 0;
    if (measureNext) { measureNext = false; measure(); }
    if (!enabled) { revealNext = null; return; }
    if (revealNext) { reveal(revealNext); revealNext = null; }
    const rect = section.getBoundingClientRect();
    section.classList.toggle('is-in-view', rect.top < window.innerHeight && rect.bottom > 0);
    section.style.setProperty('--faq-offset', `${-offset()}px`);
  };
  const schedule = (measureAgain = false) => {
    measureNext ||= measureAgain;
    if (!frame) frame = requestAnimationFrame(render);
  };

  window.addEventListener('scroll', () => schedule(), {passive: true});
  window.addEventListener('resize', () => schedule(true), {passive: true});
  motion.addEventListener('change', () => schedule(true));
  narrow.addEventListener('change', () => schedule(true));
  const observer = new ResizeObserver(() => schedule(true));
  [stage, layout, intro, track].forEach(element => observer.observe(element));
  items.forEach(item => {
    item.addEventListener('toggle', () => {
      if (item.open) revealNext = item;
      schedule(true);
    });
    item.querySelector('summary').addEventListener('focus', event => {
      revealNext = event.target;
      schedule(true);
    });
  });
  document.fonts?.ready.then(() => schedule(true));
  schedule(true);
})();
