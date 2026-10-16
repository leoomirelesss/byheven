import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { build, transformSync } from 'esbuild';

const root = new URL('../', import.meta.url);
const css = readFileSync(new URL('assets/process-story.css', root), 'utf8');
transformSync(css, {loader: 'css'});
const result = await build({
  entryPoints: [new URL('lib/zoom-slider-motion.ts', root).pathname], bundle: true, write: false,
  format: 'cjs', platform: 'node', plugins: [{
    name: 'motion-fixtures', setup(builder) {
      builder.onResolve({filter: /^gsap(?:\/|$)/}, args => ({path: args.path, namespace: 'fixture'}));
      builder.onLoad({filter: /.*/, namespace: 'fixture'}, args => ({contents:
        args.path === 'gsap' ? 'export const gsap = globalThis.fixtureGSAP;' :
        args.path.endsWith('SplitText') ? 'export const SplitText = globalThis.fixtureSplitText;' : 'export const ScrollTrigger = globalThis.fixtureScrollTrigger;'
      }));
    },
  }],
});
const source = result.outputFiles[0].text;
const fixtures = [
  {name: 'desktop', active: 4}, {name: 'narrow viewport', narrow: true, active: 4},
  {name: 'reduced motion', reduced: true, active: 0}, {name: 'short viewport', short: true, active: 0},
  {name: 'missing ResizeObserver', noObserver: true, active: 0},
  {name: 'missing matchMedia', noMedia: true, active: 0}, {name: 'SSR import', server: true, active: 0},
  {name: 'unmount before fonts', earlyDispose: true, active: 0}, {name: 'disconnected element', detached: true, active: 0},
  {name: 'partial row markup', incomplete: true, active: 3},
  {name: 'live motion preference', liveMotion: true, active: 4},
  {name: 'responsive resize', resize: true, active: 4},
];
for (const fixture of fixtures) {
  const rows = Array.from({length: 4}, (_, index) => {
    const nodes = new Map(['frame','poster','title','description','details'].map(name => [`[data-zoom-${name}]`, {index, name}]));
    if (fixture.incomplete && index === 3) nodes.delete('[data-zoom-title]');
    return {index, querySelector: selector => nodes.get(selector)};
  });
  const container = {isConnected: !fixture.detached, querySelectorAll: selector => selector === '[data-zoom-row]' ? rows : []};
  const animations = [], splits = [], managers = [];
  let registrations = 0;
  const makeAnimation = config => {
    const animation = {config, reverted: false, revert() { this.reverted = true; }};
    animations.push(animation); return animation;
  };
  const tween = (targets, from, to) => Object.assign(makeAnimation(to), {targets, from, to});
  const gsap = {
    registerPlugin(...plugins) { registrations++; assert.equal(plugins.length, 2); },
    timeline(config) {
      const animation = makeAnimation(config); animation.children = [];
      animation.fromTo = (targets, from, to) => { animation.children.push({targets,from,to}); return animation; };
      return animation;
    },
    fromTo: tween,
    matchMedia() {
      const manager = {
        callback: null, cleanup: null, conditions: {reduced: !!fixture.reduced, short: !!fixture.short, narrow: !!fixture.narrow},
        add(queries, callback, scope) {
          assert.equal(scope, container, 'selectors and effects stay scoped to one component');
          assert(queries.reduced && queries.short && queries.narrow);
          this.callback = callback; this.cleanup = callback({conditions: this.conditions});
        },
        change(conditions) {
          this.cleanup?.(); animations.forEach(animation => animation.revert());
          this.conditions = {...this.conditions, ...conditions}; this.cleanup = this.callback({conditions: this.conditions});
        },
        revert() { this.cleanup?.(); animations.forEach(animation => animation.revert()); this.reverted = true; },
      };
      managers.push(manager); return manager;
    },
  };
  const SplitText = {create(title, config) {
    assert.equal(config.aria, 'auto', 'split headings retain their complete accessible name');
    assert(config.autoSplit && config.mask === 'lines', 'line reveals reflow when the viewport/font changes');
    const split = {title, lines: [{title}], reverted: false, revert() { this.reverted = true; this.animation?.revert(); }};
    split.animation = config.onSplit(split); assert(split.animation, 'resplits own and clean up their returned animation');
    splits.push(split); return split;
  }};
  let ready;
  const fonts = new Promise(resolve => { ready = resolve; });
  const exports = {}, context = {
    exports, module: {exports}, document: {fonts: {ready: fonts}},
    fixtureGSAP: gsap, fixtureSplitText: SplitText, fixtureScrollTrigger: {},
  };
  if (!fixture.server) context.window = {
    ...(fixture.noObserver ? {} : {ResizeObserver: class {}}),
    ...(fixture.noMedia ? {} : {matchMedia() {}}),
    addEventListener() { throw new Error('component must not intercept global wheel, pointer or touch input'); },
  };
  runInNewContext(source, context);
  const dispose = context.module.exports.initZoomSlider(container);
  if (fixture.earlyDispose) dispose?.();
  ready(); await Promise.resolve(); await Promise.resolve();
  assert.equal(splits.filter(split => !split.reverted).length, fixture.active, fixture.name);
  if (fixture.active) {
    assert.equal(registrations, 1);
    for (const animation of animations) {
      const trigger = animation.config.scrollTrigger;
      assert(rows.includes(trigger.trigger), 'every trigger belongs to a real row');
      assert(!trigger.pin && !trigger.horizontal && !trigger.scroller, 'native page scrolling remains the source');
      assert(trigger.scrub > 0 && trigger.scrub < 1, 'bounded smoothing instead of an infinite loop');
      assert(trigger.invalidateOnRefresh);
    }
    const mediaTween = animations.find(animation => animation.children);
    const image = mediaTween.children[0];
    assert.equal(image.to.scale, 1);
    assert(image.from.scale < 1 && image.from.scale >= .9);
    assert.equal(image.to.clipPath, 'inset(0% 0% 0% 0%)');
    const copy = mediaTween.children[2];
    assert(copy.from.opacity >= .5 && copy.to.opacity === 1, 'paragraphs remain readable throughout the reveal');
    if (fixture.liveMotion) {
      managers[0].change({reduced: true});
      assert(splits.every(split => split.reverted));
      assert(animations.every(animation => animation.reverted));
      managers[0].change({reduced: false});
      assert.equal(splits.filter(split => !split.reverted).length, 4);
    }
    if (fixture.resize) {
      const first = image.from.clipPath;
      managers[0].change({narrow: true});
      const changed = animations.filter(animation => !animation.reverted && animation.children)[0].children[0].from.clipPath;
      assert.notEqual(changed, first);
      assert.equal(splits.filter(split => !split.reverted).length, 4);
    }
  } else assert.equal(animations.length, 0, 'fallback renders without animation or masked copy');
  dispose?.();
  assert(splits.every(split => split.reverted), 'unmount restores original headings');
  assert(animations.every(animation => animation.reverted), 'unmount releases all owned animation/scroll triggers');
  assert(managers.every(manager => manager.reverted), 'media-query subscriptions clean up');
}
console.log(`PASS: ${fixtures.length} Zoom Slider fixtures; scoped native scroll, reversible zoom, readable copy, responsive/reduced-motion changes, SSR/static fallbacks and cleanup.`);
