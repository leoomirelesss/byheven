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
const title = hero?.querySelector<HTMLElement>('h1');
const canvas = title?.querySelector<HTMLCanvasElement>('canvas');
if (clock && hero && title && canvas) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const renderer = createVapourRenderer(title, canvas);
  if (renderer) {
    let start = 0, distance = 1, enabled = false;
    let fontsReady = false;
    const measure = () => {
      enabled = !reduced.matches && fontsReady;
      start = hero.getBoundingClientRect().top + window.scrollY + 28;
      distance = Math.max(260, Math.min(window.innerHeight * .64, hero.offsetHeight * .8));
      if (enabled) renderer.measure();
      else renderer.render(0);
    };
    const unsubscribe = clock.subscribe({measure, render(state) {
      if (enabled) renderer.render(vaporProgress(state.y, start, distance));
      return false;
    }});
    const refreshFonts = () => { fontsReady = true; renderer.measure(true); clock.invalidate(); };
    document.fonts.ready.then(refreshFonts);
    reduced.addEventListener('change', clock.invalidate);
    const observer = new ResizeObserver(clock.invalidate); observer.observe(title);
    window.addEventListener('pagehide', event => {
      if (event.persisted) return;
      unsubscribe(); observer.disconnect(); reduced.removeEventListener('change', clock.invalidate); renderer.destroy();
    }, {once: true});
  }
}
