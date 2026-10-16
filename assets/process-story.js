export function initProcessStory() {
  const section = document.querySelector('[data-process-story]');
  const stage = section?.querySelector('.process-story-stage');
  const world = section?.querySelector('.process-story-world');
  const scene = section?.querySelector('.process-story-scene');
  const axis = section?.querySelector('.process-story-axis');
  const path = section?.querySelector('[data-process-path]');
  const reveal = section?.querySelector('[data-process-reveal]');
  const cards = [...(section?.querySelectorAll('[data-process-card]') || [])];
  const stations = [...(section?.querySelectorAll('.process-story-stations i') || [])];
  const number = section?.querySelector('[data-process-number]');
  const label = section?.querySelector('[data-process-label]');
  const summary = section?.querySelector('.process-story-summary');
  if (!stage || !world || !scene || !axis || !reveal || !number || !label || !path?.getTotalLength || !path?.getPointAtLength || cards.length !== 4 || stations.length !== 4 || !('ResizeObserver' in window)) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const ease = value => { const t = clamp(value, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); };
  const readingStart = .21;
  const readingEnd = .54;
  const travelStart = .74;
  let enabled = false;
  let frame = 0;
  let measureNext = true;
  let stepTravel = 1;
  let active = -1;
  let geometry = [];
  let displayed = null;
  let lastTime = 0;
  let disposed = false;
  let pathLength = 0;
  let axisSize = {width: 0, height: 0};
  const curvePoint = distance => {
    const point = path.getPointAtLength(clamp(distance, 0, pathLength));
    return {x: point.x * axisSize.width / 1000, y: point.y * axisSize.height / 2600, unitY: point.y};
  };
  // The S can turn left and right; its y always increases. Locate each stop by y.
  const distanceAtY = y => {
    let low = 0, high = pathLength;
    for (let pass = 0; pass < 24; pass++) {
      const mid = (low + high) / 2;
      if (path.getPointAtLength(mid).y < y) low = mid;
      else high = mid;
    }
    return (low + high) / 2;
  };
  const fallback = () => {
    enabled = false;
    active = -1;
    displayed = null;
    lastTime = 0;
    section.classList.remove('is-process-story');
    section.style.removeProperty('--process-story-height');
    world.style.removeProperty('--process-camera-y');
    scene.removeAttribute('aria-hidden');
    if (summary) summary.hidden = true;
    reveal.setAttribute('height', '0');
    stations.forEach(station => {
      station.classList.remove('is-complete');
      station.style.removeProperty('left');
      station.style.removeProperty('top');
    });
    cards.forEach(card => {
      card.classList.remove('is-current');
      card.removeAttribute('aria-hidden');
      card.inert = false;
      ['--process-card-open', '--process-card-scale-x', '--process-card-scale-y', '--process-card-content', '--process-content-y'].forEach(property => card.style.removeProperty(property));
    });
  };
  const measure = () => {
    if (motion.matches || window.innerHeight < 600) { fallback(); return; }
    section.classList.add('is-process-story');
    const axisRect = axis.getBoundingClientRect();
    pathLength = path.getTotalLength();
    axisSize = {width: axisRect.width, height: axisRect.height};
    const largestCard = Math.max(...cards.map(card => card.offsetHeight));
    const widestCard = Math.max(...cards.map(card => card.offsetWidth));
    if (!Number.isFinite(pathLength) || !pathLength || !axisRect.width || !axisRect.height || largestCard > stage.offsetHeight * .7 || widestCard > axisRect.width - 8) { fallback(); return; }
    const stemLength = parseFloat(getComputedStyle(scene).getPropertyValue('--process-stem-length')) || 32;
    geometry = cards.map((card, index) => {
      const distance = distanceAtY(Number(stations[index].dataset.stepY));
      const point = curvePoint(distance);
      const onRight = index % 2 === 0;
      const preferredLeft = onRight ? point.x - stemLength - card.offsetWidth : point.x + stemLength;
      const left = clamp(preferredLeft, 4, axisRect.width - card.offsetWidth - 4);
      const stemStart = onRight ? card.offsetWidth : point.x - left;
      const stemWidth = onRight ? point.x - left - card.offsetWidth : left - point.x;
      card.style.setProperty('--process-card-left', `${left}px`);
      card.style.setProperty('--process-card-top', `${point.y}px`);
      card.style.setProperty('--process-card-origin', `${point.x - left}px`);
      card.style.setProperty('--process-stem-left', `${stemStart}px`);
      card.style.setProperty('--process-stem-width', `${Math.max(0, stemWidth)}px`);
      stations[index].style.setProperty('left', `${point.x}px`);
      stations[index].style.setProperty('top', `${point.y}px`);
      // Initial title remains in the world; later stops lift it out with the curve.
      const camera = index === 0 ? 0 : Math.max(0, point.y - stage.offsetHeight * (index === 2 ? .58 : .55));
      return {distance, camera};
    });
    enabled = true;
    scene.setAttribute('aria-hidden', 'true');
    if (summary) summary.hidden = false;
    stepTravel = stage.offsetHeight * .94;
    section.style.setProperty('--process-story-height', `${stage.offsetHeight + stepTravel * cards.length}px`);
  };
  const render = timestamp => {
    frame = 0;
    if (measureNext) { measureNext = false; measure(); }
    if (!enabled) return;
    const target = clamp(-section.getBoundingClientRect().top / stepTravel, 0, cards.length);
    const now = typeof timestamp === 'number' ? timestamp : performance.now();
    const elapsed = lastTime ? clamp(now - lastTime, 1, 50) : 16.7;
    lastTime = now;
    if (displayed === null) displayed = target;
    const difference = target - displayed;
    const increment = difference * (1 - Math.exp(-elapsed / 125));
    const priorStep = Math.floor(displayed);
    const traveling = priorStep < cards.length - 1 && displayed - priorStep >= travelStart;
    const maxIncrement = elapsed * (traveling ? .00045 : .0045);
    displayed += clamp(increment, -maxIncrement, maxIncrement);
    if (Math.abs(target - displayed) < .0001) displayed = target;
    const index = Math.min(cards.length - 1, Math.floor(displayed));
    const local = displayed - index;
    const open = ease(local / readingStart) * (1 - ease((local - readingEnd) / (travelStart - readingEnd)));
    const content = ease((open - .45) / .55);
    const move = ease((local - travelStart) / (1 - travelStart));
    const current = geometry[index];
    const next = geometry[Math.min(index + 1, cards.length - 1)];
    const distance = current.distance + (next.distance - current.distance) * move;
    const marker = curvePoint(distance);
    let camera = current.camera + (next.camera - current.camera) * move;
    if (index === cards.length - 1) camera += move * stage.offsetHeight * .24;
    world.style.setProperty('--process-camera-y', `${-camera}px`);
    axis.style.setProperty('--process-marker-x', `${marker.x}px`);
    axis.style.setProperty('--process-marker-y', `${marker.y}px`);
    // Vertical reveal: horizontal clipping would cut across later turns of the S.
    reveal.setAttribute('height', String(marker.unitY + 160));
    axis.style.setProperty('--process-axis-progress', String((index + (index < cards.length - 1 ? move : 0)) / (cards.length - 1)));
    axis.style.setProperty('--process-card-open', String(open));
    cards[index].style.setProperty('--process-card-open', String(open));
    cards[index].style.setProperty('--process-card-scale-x', String(.94 + open * .06));
    cards[index].style.setProperty('--process-card-scale-y', String(.90 + open * .10));
    cards[index].style.setProperty('--process-card-content', String(content));
    cards[index].style.setProperty('--process-content-y', `${(1 - content) * 8}px`);
    if (index !== active) {
      active = index;
      cards.forEach((card, current) => card.classList.toggle('is-current', current === index));
      number.textContent = String(index + 1).padStart(2, '0');
      label.textContent = cards[index].dataset.stepTitle;
      stations.forEach((station, position) => station.classList.toggle('is-complete', position < index));
    }
    cards.forEach((card, current) => {
      const readable = current === index && open > .5;
      card.setAttribute('aria-hidden', String(!readable));
      card.inert = !readable;
    });
    section.dataset.processStep = String(index + 1);
    section.dataset.processPhase = local < readingStart ? 'opening' : local < readingEnd ? 'reading' : local < travelStart ? 'closing' : 'moving';
    if (displayed !== target) schedule();
  };
  const schedule = (remeasure = false) => {
    if (disposed) return;
    measureNext ||= remeasure;
    if (!frame) frame = requestAnimationFrame(render);
  };
  const onScroll = () => schedule();
  const onResize = () => schedule(true);
  window.addEventListener('scroll', onScroll, {passive: true});
  window.addEventListener('resize', onResize, {passive: true});
  motion.addEventListener('change', onResize);
  const observer = new ResizeObserver(() => schedule(true));
  [stage, scene].forEach(element => observer.observe(element));
  document.fonts?.ready.then(() => schedule(true));
  schedule(true);
  return () => {
    disposed = true;
    if (frame) cancelAnimationFrame(frame);
    observer.disconnect();
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onResize);
    motion.removeEventListener('change', onResize);
    fallback();
  };
}
