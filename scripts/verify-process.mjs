import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { transformSync } from 'esbuild';

const root = new URL('../', import.meta.url);
const source = readFileSync(new URL('assets/process-story.js', root), 'utf8')
  .replace('export function initProcessStory()', 'function initProcessStory()');
transformSync(readFileSync(new URL('assets/process-story.css', root), 'utf8'), {loader: 'css'});
const classes = () => ({
  values: new Set(), add(k) { this.values.add(k); }, remove(k) { this.values.delete(k); },
  contains(k) { return this.values.has(k); }, toggle(k, enabled) { enabled ? this.add(k) : this.remove(k); },
});
const styles = () => ({
  values: new Map(), setProperty(k, v) { this.values.set(k, v); },
  removeProperty(k) { this.values.delete(k); }, getPropertyValue(k) { return this.values.get(k) || ''; },
});
const element = () => ({
  classList: classes(), style: styles(), attributes: new Map(), inert: false,
  setAttribute(k, v) { this.attributes.set(k, v); }, removeAttribute(k) { this.attributes.delete(k); },
});
const labels = ['Tu negocio', 'Ruta clara', 'En marcha', 'Seguimiento'];
const fixtures = [
  {name: 'desktop', width: 1920, height: 1000, scene: 720, card: 270, enabled: true},
  {name: 'zoomed laptop below the old 470px cutoff', width: 1353, height: 707, scene: 462, card: 250, enabled: true},
  {name: 'compact viewport', width: 1280, height: 640, scene: 450, card: 250, enabled: true},
  {name: 'mobile portrait', width: 390, height: 844, scene: 620, card: 280, enabled: true},
  {name: 'insufficient curved-track clearance', width: 1280, height: 620, scene: 437, card: 300, bottom: 130, enabled: false},
  {name: 'tall card above the former cutoff still cannot fit', width: 1920, height: 700, scene: 500, card: 350, bottom: 152, enabled: false},
  {name: 'short landscape', width: 844, height: 390, scene: 300, card: 300, bottom: 130, enabled: false},
  {name: 'reduced motion', width: 1440, height: 900, scene: 650, card: 350, bottom: 152, reduced: true, enabled: false},
  {name: 'no ResizeObserver', width: 1440, height: 900, scene: 650, card: 350, bottom: 152, noRO: true, enabled: false},
  {name: 'no SVG path geometry API', width: 1440, height: 900, scene: 650, card: 270, noPath: true, enabled: false},
];
for (const fixture of fixtures) {
  const events = new Map(), frames = new Map(), observers = [];
  let clock = 100, frameId = 0, scroll = 0;
  const motion = {
    matches: !!fixture.reduced,
    addEventListener(name, fn) { events.set('motion', fn); },
    removeEventListener(name, fn) { if (events.get('motion') === fn) events.delete('motion'); },
  };
  const summary = {hidden: true}, number = {}, label = {}, reveal = element();
  const stage = {offsetHeight: fixture.height};
  const compact = fixture.height <= 760;
  const axisHeight = compact ? 76 : 100;
  const axisBottom = compact ? 64 : 88;
  const stemLength = compact ? 32 : 36;
  const axisTop = fixture.scene - axisHeight - axisBottom;
  const path = fixture.noPath ? {} : {
    getTotalLength: () => 1000,
    getPointAtLength: distance => ({x: distance, y: 80 + 20 * Math.sin(distance / 1000 * Math.PI * 2)}),
  };
  const scene = Object.assign(element(), {
    clientHeight: fixture.scene,
    getBoundingClientRect: () => ({top: 0, left: 24, width: fixture.width - 48, height: fixture.scene}),
  });
  const axis = Object.assign(element(), {
    getBoundingClientRect: () => ({top: axisTop, left: 38, width: fixture.width - 76, height: axisHeight}),
  });
  const stations = labels.map(() => element());
  const cards = labels.map(stepTitle => Object.assign(element(), {
    dataset: {stepTitle}, offsetHeight: fixture.card,
    offsetWidth: fixture.width <= 700 ? Math.min(390, fixture.width - 56) : Math.min(520, fixture.width * .46),
  }));
  const section = Object.assign(element(), {
    dataset: {}, getBoundingClientRect: () => ({top: 1600 - scroll}),
    querySelector: selector => ({
      '.process-story-stage': stage, '.process-story-scene': scene, '.process-story-axis': axis, '[data-process-path]': path, '[data-process-reveal]': reveal,
      '.process-story-summary': summary, '[data-process-number]': number, '[data-process-label]': label,
    })[selector],
    querySelectorAll: selector => selector === '[data-process-card]' ? cards : stations,
  });
  class ResizeObserver {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe() {} disconnect() { this.disconnected = true; }
  }
  const window = {
    innerHeight: fixture.height, matchMedia: () => motion,
    addEventListener(name, fn) { events.set(name, fn); },
    removeEventListener(name, fn) { if (events.get(name) === fn) events.delete(name); },
  };
  if (!fixture.noRO) window.ResizeObserver = ResizeObserver;
  const context = {
    window, document: {querySelector: () => section}, ResizeObserver,
    getComputedStyle: target => target === scene
      ? {getPropertyValue: key => key === '--process-stem-length' ? `${stemLength}px` : ''}
      : {bottom: target.style.getPropertyValue('--process-card-bottom')},
    performance: {now: () => clock},
    requestAnimationFrame(fn) { frames.set(++frameId, fn); return frameId; },
    cancelAnimationFrame(id) { frames.delete(id); },
  };
  runInNewContext(source + '\nglobalThis.dispose = initProcessStory();', context);
  const flush = () => {
    let count = 0;
    while (frames.size) {
      assert(++count < 600, `${fixture.name}: animation must settle`);
      const [id, fn] = frames.entries().next().value;
      frames.delete(id); clock += 1000 / 60; fn(clock);
    }
  };
  flush();
  assert.equal(section.classList.contains('is-process-story'), fixture.enabled, fixture.name);
  if (fixture.enabled) {
    const travel = (parseFloat(section.style.getPropertyValue('--process-story-height')) - fixture.height) / 4;
    const at = progress => { scroll = 1600 + travel * progress; events.get('scroll')(); flush(); };
    for (let i = 0; i < 4; i++) {
      at(i + .05); assert.equal(section.dataset.processPhase, 'opening');
      const opening = Number(cards[i].style.getPropertyValue('--process-card-open'));
      assert(opening > 0 && opening < 1);
      at(i + .3);
      assert.equal(section.dataset.processStep, String(i + 1));
      assert.equal(section.dataset.processPhase, 'reading');
      assert.equal(label.textContent, labels[i]);
      assert.equal(cards.filter(card => card.classList.contains('is-current')).length, 1);
      assert(!cards[i].inert);
      const point = path.getPointAtLength(i / 3 * 1000);
      const markerX = Number.parseFloat(axis.style.getPropertyValue('--process-marker-x'));
      const markerY = Number.parseFloat(axis.style.getPropertyValue('--process-marker-y'));
      assert(Math.abs(markerX - point.x * (fixture.width - 76) / 1000) < .001, 'marker follows path x');
      assert(Math.abs(markerY - point.y * axisHeight / 160) < .001, 'marker follows path y');
      assert(Math.abs(Number(reveal.attributes.get('width')) - point.x - 10) < .001, 'white progress ends at the marker');
      assert.equal(stations[i].style.getPropertyValue('left'), `${markerX}px`);
      assert.equal(stations[i].style.getPropertyValue('top'), `${markerY}px`);
      const cardBottom = Number.parseFloat(cards[i].style.getPropertyValue('--process-card-bottom'));
      assert(Math.abs(fixture.scene - cardBottom + stemLength - (axisTop + markerY)) < .001, 'card stem meets its curved milestone');
      const x = parseFloat(cards[i].style.getPropertyValue('--process-card-x'));
      assert(x - cards[i].offsetWidth / 2 >= 0);
      assert(x + cards[i].offsetWidth / 2 <= fixture.width - 48);
      at(i + .65); assert.equal(section.dataset.processPhase, 'closing');
      at(i + .9); assert.equal(section.dataset.processPhase, 'moving');
      const progress = Number(axis.style.getPropertyValue('--process-axis-progress'));
      if(i < 3) assert(progress > i / 3 && progress < (i + 1) / 3, 'continuous progress between milestones');
    }
    at(1.3); assert.equal(label.textContent, labels[1], 'reverse scroll');
    motion.matches = true; events.get('motion')(); flush();
    assert(!section.classList.contains('is-process-story'));
    assert(cards.every(card => !card.inert && !card.attributes.has('aria-hidden')));
    assert(cards.every(card => !card.style.getPropertyValue('--process-card-content')));
    assert(stations.every(station => !station.style.getPropertyValue('left') && !station.style.getPropertyValue('top')), 'static milestones reset their responsive positions');
    assert.equal(reveal.attributes.get('width'), '0');
  } else {
    assert(cards.every(card => !card.inert && !card.attributes.has('aria-hidden')));
    assert(summary.hidden);
  }
  context.dispose?.();
  assert.equal(frames.size, 0);
  assert(observers.every(observer => observer.disconnected));
  assert.equal(events.size, 0);
}
console.log(`PASS: ${fixtures.length} process fixtures; fitted cards below the old cutoff, curved marker/card alignment, all-stage clearance, scroll/reverse, static fallbacks and cleanup.`);
