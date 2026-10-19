import {createCaseChoreography, type MotionSettings} from '../lib/case-choreography';
import {createStaticVelvetHaze} from '../lib/velvet-haze';
import {createVapourRenderer, vaporProgress} from '../lib/vapour-text';

type Frame = {y: number; height: number; dt: number; immediate: boolean};
type Clock = {settings:MotionSettings; approach:(value:number,target:number,dt:number,immediate:boolean)=>number; subscribe: (client: {measure: () => void; render: (state: Frame) => boolean}) => () => void; invalidate: () => void};
const background = document.querySelector<HTMLCanvasElement>('.case-haze-canvas');
if (background) {
  const release = createStaticVelvetHaze(background);
  window.addEventListener('pagehide', event => { if (!event.persisted) release?.(); });
}
const clock = (window as Window & {HevenMotion?: Clock}).HevenMotion;
if (clock) {
  const cue = document.querySelector<HTMLElement>('.case-scroll-cue');
  let dismissed = false;
  clock.subscribe({measure() {}, render(state) {
    if (cue && !dismissed && state.y > 1) { dismissed = true; cue.classList.add('is-dismissed'); }
    return false;
  }});
  const releaseChoreography = createCaseChoreography(clock);
  window.addEventListener('pagehide', event => { if (!event.persisted) releaseChoreography(); });
}
const hero = document.querySelector<HTMLElement>('[data-case-vapour]');
const blocks = [...(hero?.querySelectorAll<HTMLElement>('[data-vapour-block]') ?? [])];
if (clock && hero && blocks.length) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const renderers = blocks.flatMap(element => {
    const canvas = element.querySelector<HTMLCanvasElement>('.case-vapour-canvas');
    const renderer = canvas && createVapourRenderer(element, canvas);
    return renderer ? [{element, renderer}] : [];
  });
  if (renderers.length) {
    let start = 0, distance = 1, enabled = false, progress = 0;
    let fontsReady = false, active = true;
    const measure = () => {
      enabled = !reduced.matches && fontsReady;
      if (!enabled) progress = 0;
      start = hero.getBoundingClientRect().top + window.scrollY + 28;
      distance = Math.max(260, Math.min(window.innerHeight * .64, hero.offsetHeight * .8));
      renderers.forEach(({renderer}) => {
        if (enabled) renderer.measure();
        else renderer.render(0);
      });
    };
    const unsubscribe = clock.subscribe({measure, render(state) {
      if (enabled) {
        const target = vaporProgress(state.y, start, distance);
        progress = clock.approach(progress, target, state.dt, state.immediate || target === 0 || target === 1);
        renderers.forEach(({renderer}) => renderer.render(progress));
        return progress !== target;
      }
      return false;
    }});
    const refreshFonts = () => {
      if (!active) return;
      fontsReady = true;
      renderers.forEach(({renderer}) => renderer.measure(true));
      clock.invalidate();
    };
    document.fonts.ready.then(refreshFonts);
    reduced.addEventListener('change', clock.invalidate);
    const observer = new ResizeObserver(clock.invalidate);
    renderers.forEach(({element}) => observer.observe(element));
    window.addEventListener('pagehide', event => {
      if (event.persisted) return;
      active = false;
      unsubscribe(); observer.disconnect(); reduced.removeEventListener('change', clock.invalidate);
      renderers.forEach(({renderer}) => renderer.destroy());
    });
  }
}
