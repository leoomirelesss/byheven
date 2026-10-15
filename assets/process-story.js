(() => {
  const section = document.querySelector('[data-process-story]');
  const stage = section?.querySelector('.process-story-stage');
  const scene = section?.querySelector('.process-story-scene');
  const axis = section?.querySelector('.process-story-axis');
  const cards = [...(section?.querySelectorAll('[data-process-card]') || [])];
  const number = section?.querySelector('[data-process-number]');
  const label = section?.querySelector('[data-process-label]');
  const summary = section?.querySelector('.process-story-summary');
  if (!stage || !scene || !axis || cards.length !== 4 || !('ResizeObserver' in window)) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const ease = value => { const t = clamp(value, 0, 1); return t * t * (3 - 2 * t); };
  let enabled = false;
  let frame = 0;
  let measureNext = true;
  let stepTravel = 1;
  let active = -1;
  let geometry = [];

  const fallback = () => {
    enabled = false;
    active = -1;
    section.classList.remove('is-process-story');
    section.style.removeProperty('--process-story-height');
    scene.removeAttribute('aria-hidden');
    if (summary) summary.hidden = true;
    cards.forEach(card => {
      card.classList.remove('is-current');
      card.removeAttribute('aria-hidden');
      card.inert = false;
    });
  };
  const measure = () => {
    if (motion.matches || window.innerHeight < 600) { fallback(); return; }
    section.classList.add('is-process-story');
    if (scene.clientHeight < 390) { fallback(); return; }
    enabled = true;
    scene.setAttribute('aria-hidden', 'true');
    if (summary) summary.hidden = false;
    stepTravel = stage.offsetHeight * .86;
    section.style.setProperty('--process-story-height', `${stage.offsetHeight + stepTravel * cards.length}px`);
    const sceneRect = scene.getBoundingClientRect();
    const axisRect = axis.getBoundingClientRect();
    geometry = cards.map((card, index) => {
      const marker = axisRect.left - sceneRect.left + axisRect.width * index / (cards.length - 1);
      const half = card.offsetWidth / 2;
      const center = clamp(marker, half + 4, sceneRect.width - half - 4);
      const origin = marker - center + half;
      card.style.setProperty('--process-card-x', `${center}px`);
      card.style.setProperty('--process-card-origin', `${origin}px`);
      return {marker, label: clamp(marker - (axisRect.left - sceneRect.left), 64, axisRect.width - 64)};
    });
  };
  const render = () => {
    frame = 0;
    if (measureNext) { measureNext = false; measure(); }
    if (!enabled) return;
    const progress = clamp(-section.getBoundingClientRect().top / stepTravel, 0, cards.length);
    const index = Math.min(cards.length - 1, Math.floor(progress));
    const local = progress - index;
    const open = ease(local / .16) * (1 - ease((local - .66) / .16));
    const move = index === cards.length - 1 ? 0 : ease((local - .82) / .18);
    const position = (index + move) / (cards.length - 1);
    axis.style.setProperty('--process-axis-position', `${position * 100}%`);
    axis.style.setProperty('--process-axis-progress', String(position));
    axis.style.setProperty('--process-label-x', `${geometry[index].label}px`);
    axis.style.setProperty('--process-card-open', String(open));
    cards[index].style.setProperty('--process-card-open', String(open));
    cards[index].style.setProperty('--process-card-scale', String(.06 + open * .94));
    if (index !== active) {
      active = index;
      cards.forEach((card, current) => card.classList.toggle('is-current', current === index));
      number.textContent = String(index + 1).padStart(2, '0');
      label.textContent = cards[index].dataset.stepTitle;
    }
    cards.forEach((card, current) => {
      const readable = current === index && open > .5;
      card.setAttribute('aria-hidden', String(!readable));
      card.inert = !readable;
    });
    section.dataset.processStep = String(index + 1);
    section.dataset.processPhase = local < .16 ? 'opening' : local < .66 ? 'reading' : local < .82 ? 'closing' : 'moving';
  };
  const schedule = (remeasure = false) => {
    measureNext ||= remeasure;
    if (!frame) frame = requestAnimationFrame(render);
  };
  window.addEventListener('scroll', () => schedule(), {passive: true});
  window.addEventListener('resize', () => schedule(true), {passive: true});
  motion.addEventListener('change', () => schedule(true));
  const observer = new ResizeObserver(() => schedule(true));
  [stage, scene].forEach(element => observer.observe(element));
  document.fonts?.ready.then(() => schedule(true));
  schedule(true);
})();
