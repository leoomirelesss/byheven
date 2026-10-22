import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const source = read('assets/site-loading.js');
const css = read('assets/site-loading.css');
const home = read('index.html');
const pages = ['index.html', 'case-studies/index.html', ...['emyasa', 'stone-kuche', 'parsomen', 'dor', 'dor-os', 'academic-quest'].map(slug => `case-studies/${slug}/index.html`)];
for (const page of pages) {
  const html = read(page);
  assert.equal((html.match(/src="\/assets\/site-loading.js"/g) || []).length, 1);
  assert(html.includes('href="/assets/site-loading.css"'));
  assert(html.includes('class="site-loader"') && html.includes('data-loading-skip'));
  assert(html.includes('loading-signature.webp" width="640" height="640"'));
}
assert(!/class="flow-phone"|class="flow-screen"|class="flow-island"/.test(home), 'the provisional hardware is not present in HTML');
assert(!/\.flow-phone \{|\.flow-phone::/.test(read('assets/shopify-hero.css') + read('assets/mobile-experience.css')), 'no CSS hardware can flash or return on failure');
assert(css.includes('prefers-reduced-motion'));
const runtime = read('tools/phone/runtime.mjs');
assert(runtime.indexOf('await renderer.compileAsync') < runtime.indexOf('host.append(canvas)'));
assert(runtime.indexOf("host.dataset.phoneState='ready'") < runtime.indexOf('Promise.allSettled([loadScreen(1),loadScreen(2)])'), 'secondary screens never delay the first ready frame');
assert(read('assets/phone/phone-entry.js').includes("scene.dataset.phoneState = 'failed'"));

const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return {promise, resolve}; };
function fixture({mobile = false, reduced = false, homePage = true, cachedImage = false} = {}) {
  const handlers = new Map(), timers = new Map(), frames = new Map();
  let id = 0, notify, resets = 0;
  const target = () => ({addEventListener(type, fn, options) {
    const list = handlers.get(this) || new Map();
    list.set(type, {fn, signal: options?.signal}); handlers.set(this, list);
  }});
  const fire = (node, type, event = {}) => {
    const entry = handlers.get(node)?.get(type);
    if (entry && !entry.signal?.aborted) entry.fn(event);
  };
  const root = {dataset: {}};
  const nav = {inert: false, matches: () => false};
  const main = {...target(), inert: false, matches: () => false, hasAttribute: () => false, setAttribute() {}, removeAttribute() {}, focus() { this.focused = true; }};
  const menu = {inert: true, matches: () => false};
  const loader = {matches: () => true, contains: active => active === loader, remove() { this.removed = true; }};
  const image = {...target(), style: {}, complete: cachedImage, naturalWidth: cachedImage ? 1080 : 0, currentSrc: '/real-model.webp', decode: () => Promise.resolve()};
  const classes = new Set();
  const scene = {dataset: {}, classList: {contains: c => classes.has(c)}, querySelector: () => image};
  const desktop = {...target(), matches: !mobile};
  const fonts = deferred();
  const document = {...target(), documentElement: root, readyState: 'loading', fonts: {ready: fonts.promise}, body: {children: [nav, main, menu, loader]}, activeElement: null,
    querySelector: selector => selector === '.site-loader' ? loader : selector === 'main' ? main : selector === '.flow-scene' ? (homePage ? scene : null) : selector === '.case-hero-media img' ? image : null};
  const window = {...target(), matchMedia: query => query.includes('min-width') ? desktop : {matches: reduced}, HevenMotion: {reset() { resets++; }}};
  vm.runInNewContext(source, {window, document, AbortController, Promise,
    MutationObserver: class {constructor(fn) { notify = fn; } observe() {} disconnect() { this.disconnected = true; }},
    setTimeout: (fn, ms) => { timers.set(++id, {fn, ms}); return id; }, clearTimeout: key => timers.delete(key),
    requestAnimationFrame: fn => { frames.set(++id, fn); return id; }, cancelAnimationFrame: key => frames.delete(key)});
  return {root, image, document, loader, main, nav, menu, desktop, fonts, frames, timers,
    mount() { fire(document, 'DOMContentLoaded'); },
    ready(state = 'ready') { scene.dataset.phoneState = state; if (state === 'ready') classes.add('has-phone-3d'); notify?.(); },
    load() { image.naturalWidth = 1080; fire(image, 'load'); },
    failImage() { fire(image, 'error'); },
    skip() { document.activeElement = loader; fire(document, 'click', {target: {closest: () => true}, preventDefault() {}}); },
    restore() { fire(window, 'pageshow', {persisted: true}); },
    resize(toDesktop) { desktop.matches = toDesktop; fire(desktop, 'change'); },
    runFrames() { for (let i = 0; i < 3 && frames.size; i++) { const batch = [...frames.values()]; frames.clear(); batch.forEach(fn => fn()); } },
    advance(ms) { for (const [key, timer] of [...timers]) if (timer.ms === ms) { timers.delete(key); timer.fn(); } },
    get resets() { return resets; }};
}
const settle = async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); };

const desktop = fixture(); desktop.mount();
assert.equal(desktop.root.dataset.siteLoading, 'pending'); assert(desktop.main.inert);
desktop.ready(); await settle(); assert.equal(desktop.frames.size, 0, 'fonts and rendered model must both settle');
desktop.fonts.resolve(); await settle(); desktop.runFrames();
assert.equal(desktop.root.dataset.siteLoading, 'leaving'); assert(!desktop.main.inert);
desktop.advance(480); assert(desktop.loader.removed); assert.equal(desktop.root.dataset.siteLoading, undefined);
assert(desktop.menu.inert, 'existing inert menu stays inert'); assert.equal(desktop.timers.size, 0); assert.equal(desktop.frames.size, 0);
desktop.ready(); await settle(); assert.equal(desktop.root.dataset.siteLoading, undefined, 'later phone changes never reopen a document loader');

const mobile = fixture({mobile: true, cachedImage: true}); mobile.fonts.resolve(); mobile.mount(); await settle(); mobile.runFrames(); mobile.advance(480);
assert(mobile.loader.removed, 'cached approved mobile render releases immediately without a mandatory hold');

const broken = fixture(); broken.mount(); broken.fonts.resolve(); broken.ready('fallback'); await settle(); broken.runFrames(); broken.advance(480);
assert(broken.loader.removed, 'WebGL failure allows access without a provisional phone');

const slow = fixture(); slow.mount(); slow.advance(10000);
assert(slow.loader.removed && !slow.main.inert, 'hung imports/fonts have a finite escape');
slow.fonts.resolve(); slow.ready(); await settle(); assert.equal(slow.frames.size, 0, 'late readiness never restarts a finished loader');

const skipped = fixture(); skipped.mount(); skipped.skip();
assert(skipped.loader.removed && skipped.main.focused && !skipped.main.inert);
assert.equal(skipped.timers.size, 0, 'skip cancels deadlines and restores navigation');
const early = fixture(); early.advance(10000); early.mount(); assert(!early.main.inert, 'a delayed DOM cannot re-lock the page after timeout');

const failure = fixture({mobile: true}); failure.mount(); failure.fonts.resolve(); failure.failImage(); await settle(); failure.runFrames(); failure.advance(480);
assert(failure.loader.removed, 'failed mobile media never traps the visitor');

const switched = fixture({mobile: true}); switched.mount(); switched.fonts.resolve(); switched.resize(true); switched.ready(); await settle(); switched.runFrames(); switched.advance(480);
assert(switched.loader.removed, 'rotating/resizing while loading follows the current rendering path');

const reduced = fixture({reduced: true}); reduced.mount(); reduced.fonts.resolve(); reduced.ready(); await settle(); reduced.runFrames();
assert(reduced.loader.removed && reduced.timers.size === 0, 'reduced motion removes the exit animation');

const restored = fixture(); restored.mount(); restored.restore();
assert(restored.loader.removed && !restored.main.inert, 'history restoration never retains a loading gate');

const project = fixture({homePage: false}); project.mount(); project.fonts.resolve(); await settle(); assert.equal(project.frames.size, 0);
project.load(); await settle(); project.runFrames(); project.advance(480); assert(project.loader.removed, 'case pages wait for their actual hero image');

console.log('PASS: eight-page loading gate, real GLB first frame, no CSS hardware, cached/mobile/case media, font readiness, failure/timeout/skip, focus, reduced motion, breakpoint changes, history and cleanup.');
