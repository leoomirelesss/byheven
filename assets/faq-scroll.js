(() => {
  const section = document.getElementById('faq');
  const stage = section?.querySelector('.faq-stage');
  const layout = section?.querySelector('.home-faq-layout');
  const intro = section?.querySelector('.home-faq-intro');
  const hint = section?.querySelector('.chat-hint');
  const viewport = section?.querySelector('.chat-window');
  const track = section?.querySelector('.chat-stream');
  const items = [...(section?.querySelectorAll('.chat-item') || [])];
  const clock = window.HevenMotion;
  if (!stage || !viewport || !track || !items.length || !clock || !('ResizeObserver' in window)) return;

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = window.matchMedia('(max-width: 700px)');
  const pace = 1.55;
  const clamp = (value, max) => Math.min(Math.max(value, 0), max);
  let enabled = false;
  let distance = 0;
  let sectionTop = 0, sectionHeight = 0, value = 0, lastValue = -1;
  let force = true;
  let revealNext = null;

  const offset = () => clamp((window.scrollY - sectionTop) / pace, distance);
  const measure = () => {
    enabled = !motion.matches && window.innerHeight >= 600;
    section.classList.toggle('is-scroll-story', enabled);
    if (!enabled) {
      section.classList.remove('is-in-view');
      ['--faq-story-height', '--faq-window-height', '--faq-offset'].forEach(name => section.style.removeProperty(name));
      track.style.removeProperty('--faq-offset');
      value = 0; force = true;
      return;
    }
    // Five closed messages on desktop. Smaller screens show only what fits.
    const rowPadding = narrow.matches ? 14 : 16;
    const fiveRows = items.slice(0, 5).reduce((height, item) => height + item.querySelector('summary').offsetHeight + rowPadding, 48);
    const available = layout.clientHeight - (narrow.matches ? intro.offsetHeight + 24 : 0) - hint.offsetHeight - 12;
    const height = Math.max(160, Math.min(fiveRows, available));
    section.style.setProperty('--faq-window-height', `${height}px`);
    distance = Math.max(0, track.scrollHeight - height);
    sectionHeight = stage.offsetHeight + distance * pace;
    section.style.setProperty('--faq-story-height', `${sectionHeight}px`);
    sectionTop = window.scrollY + section.getBoundingClientRect().top;
    force = true;
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
    if (Math.abs(next - current) > 1) {
      window.scrollTo({top: sectionTop + next * pace, behavior: 'instant'});
      value = next; clock.reset();
    }
  };
  const render = state => {
    if (!enabled) { revealNext = null; return false; }
    if (revealNext) { reveal(revealNext); revealNext = null; }
    const y = window.scrollY;
    const target = clamp((y - sectionTop) / pace, distance);
    value = clock.approach(value, target, state.dt, state.immediate || y <= sectionTop || y >= sectionTop + distance * pace, .05);
    section.classList.toggle('is-in-view', y + state.height > sectionTop && y < sectionTop + sectionHeight);
    if (force || value !== lastValue) {
      track.style.setProperty('--faq-offset', `${-value}px`);
      lastValue = value; force = false;
    }
    return value !== target;
  };
  const schedule = () => clock.invalidate();
  clock.subscribe({measure, render});
  motion.addEventListener('change', clock.reset);
  narrow.addEventListener('change', clock.reset);
  const observer = new ResizeObserver(() => schedule(true));
  [stage, layout, intro, track].forEach(element => observer.observe(element));
  items.forEach(item => {
    item.addEventListener('toggle', () => {
      if (item.open) revealNext = item;
      schedule(true);
    });
    item.querySelector('summary').addEventListener('focus', event => {
      if (!event.target.matches(':focus-visible')) return;
      revealNext = event.target;
      schedule(true);
    });
  });
  document.fonts?.ready.then(() => schedule(true));
  schedule(true);
})();
