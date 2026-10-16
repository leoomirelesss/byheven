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
  if (!stage || !world || !scene || !axis || !reveal || !path?.getTotalLength || !path?.getPointAtLength || cards.length !== 4 || stations.length !== 4 || !('ResizeObserver' in window)) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const ease = value => { const t = clamp(value, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); };
  const stepHold = .24;
  let enabled = false;
  let frame = 0;
  let measureNext = true;
  let stepTravel = 1;
  let introTravel = 1;
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
    reveal.setAttribute('height', '0');
    stations.forEach(station => {
      station.classList.remove('is-complete');
      station.style.removeProperty('left');
      station.style.removeProperty('top');
    });
    cards.forEach(card => {
      card.classList.remove('is-current');
      ['--process-step-reveal', '--process-step-y', '--process-card-width'].forEach(property => card.style.removeProperty(property));
    });
  };
  const measure = () => {
    if (motion.matches || window.innerHeight < 600) { fallback(); return; }
    section.classList.add('is-process-story');
    cards.forEach(card => card.style.removeProperty('--process-card-width'));
    const axisRect = axis.getBoundingClientRect();
    pathLength = path.getTotalLength();
    axisSize = {width: axisRect.width, height: axisRect.height};
    const largestCard = Math.max(...cards.map(card => card.offsetHeight));
    const widestCard = Math.max(...cards.map(card => card.offsetWidth));
    if (!Number.isFinite(pathLength) || !pathLength || !axisRect.width || !axisRect.height || largestCard > window.innerHeight * .7 || widestCard > axisRect.width - 8) { fallback(); return; }
    const copyGap = parseFloat(getComputedStyle(scene).getPropertyValue('--process-copy-gap')) || 28;
    geometry = cards.map((card, index) => {
      const distance = distanceAtY(Number(stations[index].dataset.stepY));
      const point = curvePoint(distance);
      const onRight = index % 2 === 0;
      // Keep the whole card clear of the curve, including its top/bottom corners.
      const top = distanceAtY(Number(stations[index].dataset.stepY) - card.offsetHeight / 2 * 2600 / axisRect.height);
      const bottom = distanceAtY(Number(stations[index].dataset.stepY) + card.offsetHeight / 2 * 2600 / axisRect.height);
      const envelope = Array.from({length: 25}, (_, sample) => curvePoint(top + (bottom - top) * sample / 24).x);
      const edge = onRight ? Math.min(...envelope) - copyGap : Math.max(...envelope) + copyGap;
      const available = onRight ? edge - 4 : axisRect.width - edge - 4;
      const width = Math.min(card.offsetWidth, available);
      card.style.setProperty('--process-card-width', `${width}px`);
      const left = onRight ? edge - width : edge;
      card.style.setProperty('--process-card-left', `${left}px`);
      card.style.setProperty('--process-card-top', `${point.y}px`);
      stations[index].style.setProperty('left', `${point.x}px`);
      stations[index].style.setProperty('top', `${point.y}px`);
      return {distance, y: point.y};
    });
    if (cards.some(card => parseFloat(card.style.getPropertyValue('--process-card-width')) < 172)) { fallback(); return; }
    geometry.forEach((stop, index) => { stop.lead = (stop.distance - (geometry[index - 1]?.distance || 0)) * .22; });
    enabled = true;
    stepTravel = geometry[1].y - geometry[0].y;
    introTravel = Math.max(window.innerHeight * .24, geometry[0].y - window.innerHeight * .62) / stepTravel;
  };
  const render = timestamp => {
    frame = 0;
    if (measureNext) { measureNext = false; measure(); }
    if (!enabled) return;
    const target = clamp(-world.getBoundingClientRect().top / stepTravel, 0, introTravel + cards.length);
    const now = typeof timestamp === 'number' ? timestamp : performance.now();
    const elapsed = lastTime ? clamp(now - lastTime, 1, 50) : 16.7;
    lastTime = now;
    if (displayed === null) displayed = target;
    const difference = target - displayed;
    displayed += difference * (1 - Math.exp(-elapsed / 80));
    if (Math.abs(target - displayed) < .0001) displayed = target;
    const progress = displayed >= introTravel + cards.length - .0001 ? cards.length : displayed - introTravel;
    const index = progress < 0 ? -1 : Math.min(cards.length - 1, Math.floor(progress));
    const local = progress - index;
    const move = ease((local - stepHold) / (1 - stepHold));
    const current = geometry[Math.max(0,index)];
    const next = geometry[index + 1];
    const distance = index < 0
      ? current.distance * ease(displayed / introTravel)
      : current.distance + ((next?.distance ?? pathLength) - current.distance) * move;
    const marker = curvePoint(distance);
    axis.style.setProperty('--process-marker-x', `${marker.x}px`);
    axis.style.setProperty('--process-marker-y', `${marker.y}px`);
    // Vertical reveal: horizontal clipping would cut across later turns of the S.
    reveal.setAttribute('height', String(displayed <= 0 ? 0 : marker.unitY + 160));
    axis.style.setProperty('--process-axis-progress', String(distance / pathLength));
    axis.style.setProperty('--process-marker-opacity', String(index === cards.length - 1 ? 1 - move : 1));
    // Each milestone arrives once and remains in the page as the reader moves on.
    // Opacity never controls accessibility: the four plain articles stay readable.
    cards.forEach((card, current) => {
      const stop = geometry[current];
      const visible = ease((distance - stop.distance + stop.lead) / stop.lead);
      card.style.setProperty('--process-step-reveal', String(visible));
      card.style.setProperty('--process-step-y', `${(1 - visible) * 12}px`);
    });
    if (index !== active) {
      active = index;
      cards.forEach((card, current) => card.classList.toggle('is-current', current === index));
      stations.forEach((station, position) => station.classList.toggle('is-complete', position < index));
    }
    section.dataset.processStep = String(index + 1);
    section.dataset.processPhase = index < 0 ? 'intro' : progress >= cards.length ? 'complete' : local < stepHold ? 'reading' : 'moving';
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
