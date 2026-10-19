import {createVapourRenderer, vaporProgress, clamp01, ease} from '../lib/vapour-text';

type Frame = {y: number; height: number; dt: number; immediate: boolean};
type Clock = {subscribe: (client: {measure: () => void; render: (state: Frame) => boolean}) => () => void; invalidate: () => void};
const clock = (window as Window & {HevenMotion?: Clock}).HevenMotion;
const hero = document.querySelector<HTMLElement>('[data-case-vapour]');
const title = hero?.querySelector<HTMLElement>('h1');
const canvas = title?.querySelector<HTMLCanvasElement>('canvas');
if (clock && hero && title && canvas) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const renderer = createVapourRenderer(title, canvas);
  if (renderer) {
    let start = 0, distance = 1, enabled = false;
    let fontsReady = false;
    const atmosphere = document.querySelector<HTMLElement>('.case-index-atmosphere');
    const layers = [...document.querySelectorAll<HTMLElement>('.case-index-grid .case-card')].map(card => ({
      card, image: card.querySelector<HTMLElement>('.case-cover'), top: 0, height: 1, shift: 0, done: false,
    }));
    const measure = () => {
      enabled = !reduced.matches && fontsReady;
      start = hero.getBoundingClientRect().top + window.scrollY + 40;
      distance = Math.max(260, Math.min(window.innerHeight * .76, hero.offsetHeight * .9));
      if (enabled) renderer.measure();
      else renderer.render(0);
      layers.forEach(layer => {
        layer.top = layer.card.getBoundingClientRect().top + window.scrollY - layer.shift;
        layer.height = layer.card.offsetHeight;
        if (!enabled) {
          layer.card.style.removeProperty('--case-reveal-y');
          layer.card.style.removeProperty('--case-reveal-opacity');
          layer.image?.style.removeProperty('--case-image-y'); layer.shift = 0;
        }
      });
      if (!enabled) atmosphere?.style.removeProperty('--case-ambient-y');
    };
    const unsubscribe = clock.subscribe({measure, render(state) {
      if (enabled) {
        renderer.render(vaporProgress(state.y, start, distance));
        atmosphere?.style.setProperty('--case-ambient-y', `${-Math.min(42, state.y * .024)}px`);
        layers.forEach(layer => {
          const entry = layer.done ? 1 : ease(clamp01((state.y + state.height * .96 - layer.top) / (state.height * .28)));
          if (entry === 1) layer.done = true;
          layer.shift = 28 * (1 - entry);
          layer.card.style.setProperty('--case-reveal-y', `${layer.shift}px`);
          layer.card.style.setProperty('--case-reveal-opacity', `${.72 + entry * .28}`);
          const position = Math.max(-1, Math.min(1, (state.y + state.height / 2 - layer.top - layer.height / 2) / state.height));
          layer.image?.style.setProperty('--case-image-y', `${position * 2}%`);
        });
      }
      return false;
    }});
    const refreshFonts = () => { fontsReady = true; renderer.measure(true); clock.invalidate(); };
    document.fonts.ready.then(refreshFonts);
    const onFocus = (event: FocusEvent) => {
      const layer = layers.find(layer => layer.card.contains(event.target as Node));
      if (layer) { layer.done = true; clock.invalidate(); }
    };
    document.addEventListener('focusin', onFocus);
    reduced.addEventListener('change', clock.invalidate);
    const observer = new ResizeObserver(clock.invalidate); observer.observe(title);
    window.addEventListener('pagehide', event => {
      if (event.persisted) return;
      unsubscribe(); observer.disconnect(); document.removeEventListener('focusin', onFocus); reduced.removeEventListener('change', clock.invalidate); renderer.destroy();
    }, {once: true});
  }
}
