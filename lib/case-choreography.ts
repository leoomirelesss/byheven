/** Scroll-linked choreography; no layout changes or movement of the static backdrop. */
export const clamp = (value: number) => Math.max(0, Math.min(1, value));
export const entranceEase = (value: number) => { const t = clamp(value); return t * t * t * (t * (t * 6 - 15) + 10); };
export type MotionSettings = {arrivalStart:number; arrivalDistance:number; arrivalMin:number; arrivalMax:number; arrivalShift:number; arrivalOpacity:number; stagger:number; staggerMax:number; lineDelay:number; lineDelayMax:number; parallax:number};
export function caseEntrance(config: MotionSettings, scrollY: number, top: number, viewportHeight: number, offset = 0, done = false, displayed?: number) {
  const raw = done ? 1 : clamp((scrollY + viewportHeight * config.arrivalStart - top - offset) / Math.min(config.arrivalMax, Math.max(config.arrivalMin, viewportHeight * config.arrivalDistance)));
  const value = displayed ?? raw;
  const progress = entranceEase(value);
  const caption = entranceEase(clamp((value - config.lineDelay) / (1 - config.lineDelay)));
  return {raw, y: config.arrivalShift * (1 - progress), opacity: config.arrivalOpacity + (1 - config.arrivalOpacity) * progress, captionY: config.arrivalShift * (1 - caption)};
}
export function caseDepth(scrollY: number, top: number, height: number, viewportHeight: number, amplitude: number) {
  return Math.max(-amplitude, Math.min(amplitude, (scrollY + viewportHeight / 2 - top - height / 2) / viewportHeight * amplitude));
}
type Frame = {y: number; height: number; dt?:number; immediate?:boolean};
type Clock = {settings: MotionSettings; approach:(value:number,target:number,dt:number,immediate:boolean)=>number; subscribe: (client: {measure: () => void; render: (state: Frame) => boolean}) => () => void; invalidate: () => void};
export function createCaseChoreography(clock: Clock) {
  const config = clock.settings;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cards = [...document.querySelectorAll<HTMLElement>('.case-index-grid .case-card')].map((element, index) => ({
    element, image: element.querySelector<HTMLElement>('.case-cover'), index, top: 0, height: 1, shift: 0, value: 0, last: '', done: false,
  }));
  const end = [...document.querySelectorAll<HTMLElement>('.case-invitation h2, .case-invitation > .case-text-link')].map((element, index) => ({element, image: null, index, top: 0, height: 1, shift: 0, value: 0, last: '', done: false}));
  const entries = [...cards, ...end];
  let enabled = false, parallaxEnabled = false;
  const clear = (entry: typeof entries[number]) => {
    entry.element.classList.remove('is-case-motion');
    for (const key of ['--case-entry-y', '--case-entry-opacity', '--case-caption-y']) entry.element.style.removeProperty(key);
    entry.image?.style.removeProperty('--case-image-depth');
    entry.shift = 0; entry.last = '';
  };
  const measure = () => {
    enabled = !reduced.matches && window.innerHeight >= 600;
    parallaxEnabled = window.innerWidth >= 900 && window.innerHeight >= 640;
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
    let moving = false;
    entries.forEach(entry => {
      // The second item in each row starts slightly later; captions follow their image.
      const offset = Math.min(config.staggerMax, entry.index * config.stagger);
      const target = caseEntrance(config, state.y, entry.top, state.height, offset, entry.done);
      entry.value = clock.approach(entry.value, target.raw, state.dt ?? 16.67, state.immediate ?? true);
      moving ||= entry.value !== target.raw;
      const pose = caseEntrance(config, state.y, entry.top, state.height, offset, entry.done, entry.value);
      if (entry.value === 1) entry.done = true;
      const depth = entry.image && parallaxEnabled ? caseDepth(state.y, entry.top, entry.height, state.height, config.parallax) : 0;
      const signature = `${entry.value}:${depth}`;
      if (entry.last === signature) return;
      entry.last = signature; entry.shift = pose.y;
      entry.element.style.setProperty('--case-entry-y', `${pose.y}px`);
      entry.element.style.setProperty('--case-entry-opacity', String(pose.opacity));
      entry.element.style.setProperty('--case-caption-y', `${pose.captionY}px`);
      entry.image?.style.setProperty('--case-image-depth', `${depth}%`);
    });
    return moving;
  }});
  const focus = (event: FocusEvent) => {
    const entry = entries.find(entry => entry.element.contains(event.target as Node));
    if (entry) { entry.done = true; clock.invalidate(); }
  };
  document.addEventListener('focusin', focus); reduced.addEventListener('change', clock.invalidate);
  return () => { unsubscribe(); document.removeEventListener('focusin', focus); reduced.removeEventListener('change', clock.invalidate); entries.forEach(clear); };
}
