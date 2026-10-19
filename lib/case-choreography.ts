/** Scroll-linked choreography; no layout changes or movement of the static backdrop. */
export const clamp = (value: number) => Math.max(0, Math.min(1, value));
export const entranceEase = (value: number) => { const t = clamp(value); return t * t * t * (t * (t * 6 - 15) + 10); };
export function caseEntrance(scrollY: number, top: number, viewportHeight: number, offset = 0, done = false) {
  const raw = done ? 1 : clamp((scrollY + viewportHeight * .94 - top - offset) / Math.min(240, viewportHeight * .26));
  const progress = entranceEase(raw);
  const caption = entranceEase(clamp((raw - .16) / .84));
  return {raw, y: 26 * (1 - progress), opacity: .78 + .22 * progress, captionY: 12 * (1 - caption)};
}
export function caseDepth(scrollY: number, top: number, height: number, viewportHeight: number) {
  return Math.max(-2, Math.min(2, (scrollY + viewportHeight / 2 - top - height / 2) / viewportHeight * 2));
}
type Frame = {y: number; height: number};
type Clock = {subscribe: (client: {measure: () => void; render: (state: Frame) => boolean}) => () => void; invalidate: () => void};
export function createCaseChoreography(clock: Clock) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cards = [...document.querySelectorAll<HTMLElement>('.case-index-grid .case-card')].map((element, index) => ({
    element, image: element.querySelector<HTMLElement>('.case-cover'), index, top: 0, height: 1, shift: 0, last: '', done: false,
  }));
  const end = [...document.querySelectorAll<HTMLElement>('.case-invitation h2, .case-invitation > .case-text-link')].map((element, index) => ({element, image: null, index, top: 0, height: 1, shift: 0, last: '', done: false}));
  const entries = [...cards, ...end];
  let enabled = false, columns = 2;
  const clear = (entry: typeof entries[number]) => {
    entry.element.classList.remove('is-case-motion');
    for (const key of ['--case-entry-y', '--case-entry-opacity', '--case-caption-y']) entry.element.style.removeProperty(key);
    entry.image?.style.removeProperty('--case-image-depth');
    entry.shift = 0; entry.last = '';
  };
  const measure = () => {
    enabled = !reduced.matches && window.innerHeight >= 600;
    columns = window.innerWidth <= 600 ? 1 : 2;
    entries.forEach(entry => {
      entry.top = entry.element.getBoundingClientRect().top + window.scrollY - entry.shift;
      entry.height = entry.element.offsetHeight;
      entry.last = '';
      if (!enabled) clear(entry);
      else entry.element.classList.add('is-case-motion');
    });
  };
  const unsubscribe = clock.subscribe({measure, render(state) {
    if (!enabled) return false;
    entries.forEach(entry => {
      // The second item in each row starts slightly later; captions follow their image.
      const offset = entry.image ? (entry.index % columns) * 44 : entry.index * 28;
      const pose = caseEntrance(state.y, entry.top, state.height, offset, entry.done);
      if (pose.raw === 1) entry.done = true;
      const depth = entry.image ? caseDepth(state.y, entry.top, entry.height, state.height) * (columns === 1 ? .65 : 1) : 0;
      const signature = `${pose.raw}:${depth}`;
      if (entry.last === signature) return;
      entry.last = signature; entry.shift = pose.y;
      entry.element.style.setProperty('--case-entry-y', `${pose.y}px`);
      entry.element.style.setProperty('--case-entry-opacity', String(pose.opacity));
      entry.element.style.setProperty('--case-caption-y', `${pose.captionY}px`);
      entry.image?.style.setProperty('--case-image-depth', `${depth}%`);
    });
    return false;
  }});
  const focus = (event: FocusEvent) => {
    const entry = entries.find(entry => entry.element.contains(event.target as Node));
    if (entry) { entry.done = true; clock.invalidate(); }
  };
  document.addEventListener('focusin', focus); reduced.addEventListener('change', clock.invalidate);
  return () => { unsubscribe(); document.removeEventListener('focusin', focus); reduced.removeEventListener('change', clock.invalidate); entries.forEach(clear); };
}
