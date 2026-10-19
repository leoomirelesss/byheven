import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createVapourRenderer, vaporPose, vaporProgress} from '../lib/vapour-text';

assert.equal(vaporProgress(0, 120, 500), 0);
assert.equal(vaporProgress(370, 120, 500), .5);
assert.equal(vaporProgress(2000, 120, 500), 1);
const sample = {x: 180, y: 90, alpha: .9, seed: .37};
const forward = Array.from({length: 101}, (_, i) => vaporPose(sample, i / 100, 800));
for (let i = 100; i >= 0; i--) assert.deepEqual(vaporPose(sample, i / 100, 800), forward[i], 'reverse scroll reconstructs the identical particle pose');
assert(!forward[0].released); assert.equal(forward[100].alpha, 0);
assert(forward.every(pose => Number.isFinite(pose.x) && Number.isFinite(pose.y) && pose.alpha >= 0 && pose.alpha <= 1));
let reads = 0, draws = 0;
const context = () => ({
  setTransform() {}, clearRect() {}, fillText() {}, save() {}, restore() {}, beginPath() {}, rect() {}, clip() {},
  drawImage() { draws++; }, fillRect() { draws++; }, measureText: () => ({fontBoundingBoxAscent: 80, fontBoundingBoxDescent: 20}),
  getImageData: () => { const data = new Uint8ClampedArray(400 * 200 * 4); for(let i=3;i<data.length;i+=4)data[i]=255; return {data}; },
  font: '', fillStyle: '', textBaseline: '', letterSpacing: '', globalAlpha: 1,
});
const classes = new Set<string>();
const title = {
  getBoundingClientRect() { reads++; return {width: 200, height: 100, top: 0, left: 0}; },
  querySelectorAll: () => [{textContent: 'Casos', getBoundingClientRect() { reads++; return {left: 0, top: 0, height: 100}; }}],
  classList: {add: (name: string) => classes.add(name), remove: (name: string) => classes.delete(name), toggle(name: string, on: boolean) { if(on)classes.add(name);else classes.delete(name); }},
};
const canvas = {width: 0, height: 0, style: {opacity: '0'}, getContext: context};
Object.assign(globalThis, {
  window: {devicePixelRatio: 1},
  document: {createElement: () => ({width: 0, height: 0, getContext: context})},
  getComputedStyle: () => ({fontSize: '100px', fontFamily: 'Outfit', fontWeight: '400', letterSpacing: '-6px', color: '#ceced7'}),
});
const renderer = createVapourRenderer(title as unknown as HTMLElement, canvas as unknown as HTMLCanvasElement)!;
renderer.measure(); renderer.render(0); assert(!classes.has('is-vaporizing'));
const measured = reads;
renderer.render(.5); assert.equal(reads, measured, 'scroll frames never measure layout'); assert(classes.has('is-vaporizing')); assert.equal(canvas.style.opacity, '1');
const rendered = draws; renderer.render(.5); assert.equal(draws, rendered, 'paused scroll performs no redraw');
renderer.render(1); assert.equal(canvas.style.opacity, '0');
renderer.render(0); assert(!classes.has('is-vaporizing'), 'returning to the top restores the real HTML title');
renderer.destroy(); assert.equal(canvas.width, 0); assert(!classes.has('is-vaporizing'));
const fallback = createVapourRenderer(title as unknown as HTMLElement, {getContext: () => null} as unknown as HTMLCanvasElement);
assert.equal(fallback, null, 'canvas failure keeps the HTML fallback');
const html = readFileSync(new URL('../case-studies/index.html', import.meta.url), 'utf8');
assert.equal((html.match(/<h1\b/g) || []).length, 1);
assert(html.includes('data-vapour-word>Casos') && html.includes('data-vapour-word>reales.'));
assert(!html.includes('/#process'));
assert(html.indexOf('/assets/scroll-story.js') < html.indexOf('/assets/case-index-motion.js'));
assert(/canvas[^>]+aria-hidden="true"/.test(html));
const runtime = readFileSync(new URL('../src/case-index-motion.ts', import.meta.url), 'utf8');
assert(!/setTimeout|setInterval|requestAnimationFrame/.test(runtime), 'the effect uses the existing scroll clock without a timed cycle');
console.log('PASS: vapour poses are deterministic and reversible; bounded opacity, cached drawing, no idle redraw, HTML fallback, teardown, semantic title and shared-clock integration.');
