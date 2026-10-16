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
  {name: 'desktop', width: 1920, height: 1000, card: 210, enabled: true},
  {name: 'zoomed laptop', width: 1353, height: 707, card: 200, enabled: true},
  {name: 'compact viewport', width: 1280, height: 640, card: 200, enabled: true},
  {name: 'mobile portrait', width: 390, height: 844, card: 240, enabled: true},
  {name: 'small mobile', width: 320, height: 640, card: 230, enabled: true},
  {name: 'large card cannot fit', width: 1280, height: 620, card: 500, enabled: false},
  {name: 'fourth card cannot fit', width: 1920, height: 700, card: 250, lastCard: 600, enabled: false},
  {name: 'short landscape', width: 844, height: 390, card: 264, enabled: false},
  {name: 'reduced motion', width: 1440, height: 900, card: 264, reduced: true, enabled: false},
  {name: 'no ResizeObserver', width: 1440, height: 900, card: 264, noRO: true, enabled: false},
  {name: 'no SVG geometry API', width: 1440, height: 900, card: 264, noPath: true, enabled: false},
  {name: 'empty SVG geometry', width: 1440, height: 900, card: 264, zeroPath: true, enabled: false},
  {name: 'zero-width track', width: 1440, height: 900, card: 264, zeroAxis: true, enabled: false},
];
assert(samples.every(point => point.y >= 0 && point.y <= 2600), 'curve ends inside its SVG instead of being cut off');
assert.equal(samples.at(-1).y, 2600);
for (const fixture of fixtures) {
  const events = new Map(), frames = new Map(), observers = [];
  let clock = 100, frameId = 0, scroll = 0;
  const motion = {
    matches: !!fixture.reduced,
    addEventListener(name, fn) { events.set('motion', fn); },
    removeEventListener(name, fn) { if (events.get('motion') === fn) events.delete('motion'); },
  };
  const reveal = element();
  const world = Object.assign(element(), {getBoundingClientRect: () => ({top: 1600 - scroll})});
  const stage = element();
  const axisWidth = fixture.zeroAxis ? 0 : fixture.width - (fixture.width <= 360 ? 32 : 48);
  const axisHeight = Math.max(1700, fixture.height * 3);
  const stemLength = fixture.width <= 360 ? 12 : fixture.width <= 900 ? 18 : 28;
  const path = fixture.noPath ? {} : {getTotalLength: () => fixture.zeroPath ? 0 : total, getPointAtLength: pointAtLength};
  const scene = element();
  const axis = Object.assign(element(), {getBoundingClientRect: () => ({width: axisWidth, height: axisHeight})});
  const stations = labels.map((_, i) => Object.assign(element(), {dataset: {stepY: String(stops[i])}}));
  const cards = labels.map((stepTitle, i) => Object.assign(element(), {
    dataset: {stepTitle}, offsetHeight: i === 3 && fixture.lastCard || fixture.card,
    offsetWidth: fixture.width <= 900 ? Math.min(360, axisWidth * .70) : Math.min(440, axisWidth * .42),
  }));
  const section = Object.assign(element(), {
    dataset: {},
    querySelector: selector => ({
      '.process-story-stage': stage, '.process-story-world': world, '.process-story-scene': scene, '.process-story-axis': axis, '[data-process-path]': path, '[data-process-reveal]': reveal,
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
      assert(++count < 300, `${fixture.name}: animation must settle promptly`);
      const [id, fn] = frames.entries().next().value;
      frames.delete(id); clock += 1000 / 60; fn(clock);
    }
  };
  flush();
  assert.equal(section.classList.contains('is-process-story'), fixture.enabled, fixture.name);
  if (fixture.enabled) {
    const travel = (stops[1] - stops[0]) * axisHeight / 2600;
    const intro = Math.max(fixture.height * .24, stops[0] * axisHeight / 2600 - fixture.height * .62) / travel;
    const at = progress => { scroll = 1600 + travel * progress; events.get('scroll')(); flush(); };
    at(0);
    assert.equal(section.dataset.processPhase, 'intro');
    assert.equal(section.dataset.processStep, '0');
    assert.equal(reveal.attributes.get('height'), '0', 'no pre-illuminated segment');
    assert.equal(Number(axis.style.getPropertyValue('--process-axis-progress')), 0);
    assert(cards.every(card => !card.classList.contains('is-current') && card.style.getPropertyValue('--process-step-reveal') === '0'), 'content begins visually unrevealed');
    assert(cards.every(card => !card.inert && !card.attributes.has('aria-hidden')), 'all editorial text remains accessible before scrolling');
    const origin = pointAtLength(0);
    assert(Math.abs(parseFloat(axis.style.getPropertyValue('--process-marker-y')) - origin.y * axisHeight / 2600) < .001, 'ball starts at the path origin');
    at(intro / 2);
    const introY = parseFloat(axis.style.getPropertyValue('--process-marker-y')) / axisHeight * 2600;
    assert(introY > origin.y && introY < stops[0], 'approach illuminates toward the first step');
    at(intro * .75);
    const approaching = Number(cards[0].style.getPropertyValue('--process-step-reveal'));
    assert(approaching > 0 && approaching < 1, 'first milestone reveals gently as the dot approaches');
    for (let i = 0; i < 4; i++) {
      at(intro + i + .1);
      assert.equal(section.dataset.processStep, String(i + 1));
      assert.equal(section.dataset.processPhase, 'reading');
      assert.equal(cards.filter(card => card.classList.contains('is-current')).length, 1);
      assert.equal(cards[i].style.getPropertyValue('--process-step-reveal'), '1');
      assert(cards.slice(0,i+1).every(card => card.style.getPropertyValue('--process-step-reveal') === '1'), 'previous milestones stay in the native page');
      assert(cards.every(card => !card.inert && !card.attributes.has('aria-hidden')), 'visual reveal never removes editorial text from accessibility');
      assert(!scene.attributes.has('aria-hidden'));
      const markerX = Number.parseFloat(axis.style.getPropertyValue('--process-marker-x'));
      const markerY = Number.parseFloat(axis.style.getPropertyValue('--process-marker-y'));
      assert(Math.abs(markerY - stops[i] * axisHeight / 2600) < .001);
      assert(Math.abs(markerX - [800,220,780,240][i] * axisWidth / 1000) < .001);
      assert(Math.abs(Number(reveal.attributes.get('height')) - stops[i] - 160) < .001);
      assert.equal(stations[i].style.getPropertyValue('left'), `${markerX}px`);
      assert.equal(stations[i].style.getPropertyValue('top'), `${markerY}px`);
      const left = parseFloat(cards[i].style.getPropertyValue('--process-card-left'));
      const width = parseFloat(cards[i].style.getPropertyValue('--process-card-width'));
      assert(left >= 0 && left + width <= axisWidth, 'card fits horizontally');
      const topY = (markerY - fixture.card / 2) / axisHeight * 2600;
      const bottomY = (markerY + fixture.card / 2) / axisHeight * 2600;
      const near = samples.filter(point => point.y >= topY && point.y <= bottomY);
      const curveEdge = i % 2 ? Math.max(...near.map(point => point.x * axisWidth / 1000)) : Math.min(...near.map(point => point.x * axisWidth / 1000));
      assert(i % 2 ? left >= curveEdge + stemLength - .1 : left + width <= curveEdge - stemLength + .1, 'whole card clears the curve, including corners');
      const screenY = markerY + world.getBoundingClientRect().top;
      assert(screenY - fixture.card / 2 > 12 && screenY + fixture.card / 2 < fixture.height - 12, 'reading card fits the natural viewport');
      assert.equal(world.style.getPropertyValue('--process-camera-y'), '', 'no fake camera transform');
      assert.equal(section.style.getPropertyValue('--process-story-height'), '', 'no added pinned scrolling distance');
      if(i < 3) assert((stops[i+1] - stops[i]) * axisHeight / 2600 > fixture.card + 48, 'neighboring cards have a clear physical gap');
      at(intro + i + .6); assert.equal(section.dataset.processPhase, 'moving');
      assert.equal(cards[i].style.getPropertyValue('--process-step-reveal'), '1', 'milestones do not close or shrink after reading');
      const y = parseFloat(axis.style.getPropertyValue('--process-marker-y')) / axisHeight * 2600;
      assert(y > stops[i] && y < (stops[i+1] || 2600), 'dot continues down the S, including the exit tail');
    }
    at(intro + 4);
    assert.equal(section.dataset.processPhase, 'complete');
    assert(cards.every(card => card.style.getPropertyValue('--process-step-reveal') === '1'), 'all content remains on the page after the final stop');
    assert(Math.abs(parseFloat(axis.style.getPropertyValue('--process-marker-y')) - axisHeight) < .001);
    assert.equal(axis.style.getPropertyValue('--process-marker-opacity'), '0', 'dot fades into the outgoing section');
    at(intro + 1.1); assert.equal(section.dataset.processStep, '2', 'reverse scroll');
    at(0); assert.equal(reveal.attributes.get('height'), '0', 'reverse returns to unlit origin');
    assert(cards.every(card => card.style.getPropertyValue('--process-step-reveal') === '0'), 'reverse restores each reveal without closing panels');
    events.get('resize')(); flush(); assert.equal(section.dataset.processStep, '0');
    motion.matches = true; events.get('motion')(); flush();
    assert(!section.classList.contains('is-process-story'));
    assert(cards.every(card => !card.inert && !card.attributes.has('aria-hidden')));
    assert(cards.every(card => !card.style.getPropertyValue('--process-step-reveal') && !card.style.getPropertyValue('--process-card-width')));
    assert(stations.every(station => !station.style.getPropertyValue('left') && !station.style.getPropertyValue('top')));
    assert.equal(reveal.attributes.get('height'), '0');
  } else {
    assert(cards.every(card => !card.inert && !card.attributes.has('aria-hidden')));
  }
  context.dispose?.();
  assert.equal(frames.size, 0);
  assert(observers.every(observer => observer.disconnected));
  assert.equal(events.size, 0);
}
console.log(`PASS: ${fixtures.length} process fixtures; zero-lit origin, gentle/persistent editorial reveals, accessible articles, actual curve clearance, compact native flow, outgoing tail, reverse scroll and fallbacks.`);
