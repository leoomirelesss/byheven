import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { transformSync } from 'esbuild';

const root = new URL('../', import.meta.url);
const html = readFileSync(new URL('index.html', root), 'utf8');
const source = readFileSync(new URL('assets/process-story.js', root), 'utf8')
  .replace('export function initProcessStory()', 'function initProcessStory()');
transformSync(readFileSync(new URL('assets/process-story.css', root), 'utf8'), {loader: 'css'});
const d = html.match(/data-process-path="" d="([^"]+)"/)[1];
const matches = [...d.matchAll(/([MC])([^MC]+)/g)];
const samples = [];
let previous, total = 0;
for (const [, command, values] of matches) {
  const n = values.trim().split(/[\s,]+/).map(Number);
  if (command === 'M') { previous = {x: n[0], y: n[1]}; samples.push({...previous, length: 0}); continue; }
  assert.equal(n.length, 6, 'fixture reads the actual cubic S from the home');
  const start = previous;
  for (let i = 1; i <= 2000; i++) {
    const t = i / 2000, s = 1 - t;
    const point = {
      x: s ** 3 * start.x + 3 * s ** 2 * t * n[0] + 3 * s * t ** 2 * n[2] + t ** 3 * n[4],
      y: s ** 3 * start.y + 3 * s ** 2 * t * n[1] + 3 * s * t ** 2 * n[3] + t ** 3 * n[5],
    };
    assert(point.y >= previous.y, 'vertical reveal requires monotonically increasing path y');
    total += Math.hypot(point.x - previous.x, point.y - previous.y);
    samples.push({...point, length: total}); previous = point;
  }
}
const pointAtLength = distance => {
  let low = 0, high = samples.length - 1;
  while (low < high) { const mid = Math.floor((low + high) / 2); if(samples[mid].length < distance) low = mid + 1; else high = mid; }
  const b = samples[low], a = samples[Math.max(0, low - 1)];
  const t = b.length === a.length ? 0 : (distance - a.length) / (b.length - a.length);
  return {x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t};
};
const stops = [...html.matchAll(/data-step-y="(\d+)"/g)].map(match => Number(match[1]));
assert.equal(stops.length, 4);
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
  {name: 'desktop', width: 1920, height: 1000, card: 270, enabled: true},
  {name: 'zoomed laptop', width: 1353, height: 707, card: 250, enabled: true},
  {name: 'compact viewport', width: 1280, height: 640, card: 250, enabled: true},
  {name: 'mobile portrait', width: 390, height: 844, card: 300, enabled: true},
  {name: 'small mobile', width: 320, height: 640, card: 290, enabled: true},
  {name: 'large card cannot fit', width: 1280, height: 620, card: 500, enabled: false},
  {name: 'fourth card cannot fit', width: 1920, height: 700, card: 250, lastCard: 600, enabled: false},
  {name: 'short landscape', width: 844, height: 390, card: 270, enabled: false},
  {name: 'reduced motion', width: 1440, height: 900, card: 270, reduced: true, enabled: false},
  {name: 'no ResizeObserver', width: 1440, height: 900, card: 270, noRO: true, enabled: false},
  {name: 'no SVG geometry API', width: 1440, height: 900, card: 270, noPath: true, enabled: false},
  {name: 'empty SVG geometry', width: 1440, height: 900, card: 270, zeroPath: true, enabled: false},
  {name: 'zero-width track', width: 1440, height: 900, card: 270, zeroAxis: true, enabled: false},
];
for (const fixture of fixtures) {
  const events = new Map(), frames = new Map(), observers = [];
  let clock = 100, frameId = 0, scroll = 0;
  const motion = {
    matches: !!fixture.reduced,
    addEventListener(name, fn) { events.set('motion', fn); },
    removeEventListener(name, fn) { if (events.get('motion') === fn) events.delete('motion'); },
  };
  const summary = {hidden: true}, number = {}, label = {}, reveal = element(), world = element();
  const stage = {offsetHeight: fixture.height};
  const axisWidth = fixture.zeroAxis ? 0 : fixture.width - 48;
  const axisHeight = fixture.height * 3.6;
  const stemLength = fixture.width <= 700 ? 20 : 32;
  const path = fixture.noPath ? {} : {getTotalLength: () => fixture.zeroPath ? 0 : total, getPointAtLength: pointAtLength};
  const scene = element();
  const axis = Object.assign(element(), {getBoundingClientRect: () => ({width: axisWidth, height: axisHeight})});
  const stations = labels.map((_, i) => Object.assign(element(), {dataset: {stepY: String(stops[i])}}));
  const cards = labels.map((stepTitle, i) => Object.assign(element(), {
    dataset: {stepTitle}, offsetHeight: i === 3 && fixture.lastCard || fixture.card,
    offsetWidth: fixture.width <= 700 ? (fixture.width - 48) * .78 : Math.min(500, (fixture.width - 48) * .44),
  }));
  const section = Object.assign(element(), {
    dataset: {}, getBoundingClientRect: () => ({top: 1600 - scroll}),
    querySelector: selector => ({
      '.process-story-stage': stage, '.process-story-world': world, '.process-story-scene': scene, '.process-story-axis': axis, '[data-process-path]': path, '[data-process-reveal]': reveal,
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
    addEventListener(name, fn, options) { assert(options.passive, 'native scrolling stays passive'); events.set(name, fn); },
    removeEventListener(name, fn) { if (events.get(name) === fn) events.delete(name); },
  };
  if (!fixture.noRO) window.ResizeObserver = ResizeObserver;
  const context = {
    window, document: {querySelector: () => section}, ResizeObserver,
    getComputedStyle: () => ({getPropertyValue: () => `${stemLength}px`}),
    performance: {now: () => clock},
    requestAnimationFrame(fn) { frames.set(++frameId, fn); return frameId; },
    cancelAnimationFrame(id) { frames.delete(id); },
  };
  runInNewContext(source + '\nglobalThis.dispose = initProcessStory();', context);
  const flush = () => {
    let count = 0;
    while (frames.size) {
      assert(++count < 1000, `${fixture.name}: animation must settle`);
      const [id, fn] = frames.entries().next().value;
      frames.delete(id); clock += 1000 / 60; fn(clock);
    }
  };
  flush();
  assert.equal(section.classList.contains('is-process-story'), fixture.enabled, fixture.name);
  if (fixture.enabled) {
    const travel = (parseFloat(section.style.getPropertyValue('--process-story-height')) - fixture.height) / 4;
    const at = progress => { scroll = 1600 + travel * progress; events.get('scroll')(); flush(); };
    let previousCamera = 1;
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
      assert(summary.hidden === false && scene.attributes.get('aria-hidden') === 'true', 'accessible summary replaces moving copy');
      const markerX = Number.parseFloat(axis.style.getPropertyValue('--process-marker-x'));
      const markerY = Number.parseFloat(axis.style.getPropertyValue('--process-marker-y'));
      assert(Math.abs(markerY - stops[i] * axisHeight / 2600) < .001, 'marker follows actual path y');
      assert(Math.abs(markerX - [900,160,870,180][i] * axisWidth / 1000) < .001, 'milestones sit on alternating turns');
      assert(Math.abs(Number(reveal.attributes.get('height')) - stops[i] - 160) < .001, 'vertical white progress ends at marker');
      assert.equal(stations[i].style.getPropertyValue('left'), `${markerX}px`);
      assert.equal(stations[i].style.getPropertyValue('top'), `${markerY}px`);
      const cardTop = Number.parseFloat(cards[i].style.getPropertyValue('--process-card-top'));
      assert(Math.abs(cardTop - markerY) < .001);
      const left = Number.parseFloat(cards[i].style.getPropertyValue('--process-card-left'));
      assert(left >= 0 && left + cards[i].offsetWidth <= axisWidth, 'card fits horizontally');
      const stemLeft = Number.parseFloat(cards[i].style.getPropertyValue('--process-stem-left'));
      const stemWidth = Number.parseFloat(cards[i].style.getPropertyValue('--process-stem-width'));
      assert(Math.abs(left + stemLeft + (i % 2 ? 0 : stemWidth) - markerX) < .001, 'connector meets its curve point');
      assert(stemWidth >= 0);
      const camera = Number.parseFloat(world.style.getPropertyValue('--process-camera-y'));
      assert(camera < previousCamera, 'the shared plane rises between stages'); previousCamera = camera;
      assert(markerY + camera - fixture.card / 2 > 16 && markerY + camera + fixture.card / 2 < fixture.height - 16, 'active card stays in view');
      if(i === 0) assert.equal(camera, 0, 'initial title starts in place');
      else assert(-camera > fixture.height * .9, 'title has risen out with the curve');
      at(i + .65); assert.equal(section.dataset.processPhase, 'closing');
      at(i + .9); assert.equal(section.dataset.processPhase, 'moving');
      if(i < 3) {
        const y = Number.parseFloat(axis.style.getPropertyValue('--process-marker-y')) / axisHeight * 2600;
        assert(y > stops[i] && y < stops[i + 1], 'dot travels down the S between stops');
      }
    }
    at(4); assert.equal(cards[3].inert, true, 'last card closes before leaving');
    at(1.3); assert.equal(label.textContent, labels[1], 'reverse scroll');
    at(.3); assert.equal(Number.parseFloat(world.style.getPropertyValue('--process-camera-y')), 0, 'title returns on reverse scroll');
    events.get('resize')(); flush(); assert.equal(label.textContent, labels[0], 'resize preserves the active step');
    motion.matches = true; events.get('motion')(); flush();
    assert(!section.classList.contains('is-process-story'));
    assert(cards.every(card => !card.inert && !card.attributes.has('aria-hidden')));
    assert(cards.every(card => !card.style.getPropertyValue('--process-card-content')));
    assert(stations.every(station => !station.style.getPropertyValue('left') && !station.style.getPropertyValue('top')));
    assert.equal(reveal.attributes.get('height'), '0');
    assert.equal(world.style.getPropertyValue('--process-camera-y'), '');
  } else {
    assert(cards.every(card => !card.inert && !card.attributes.has('aria-hidden')));
    assert(summary.hidden);
  }
  context.dispose?.();
  assert.equal(frames.size, 0);
  assert(observers.every(observer => observer.disconnected));
  assert.equal(events.size, 0);
}
console.log(`PASS: ${fixtures.length} process fixtures; actual vertical S, alternating stops, camera/card/connector alignment, all four phases, reverse scroll, responsive guards and static fallbacks.`);
