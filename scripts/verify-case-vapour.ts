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
  setTransform() {}, clearRect() {}, fillText() {}, save() {}, restore() {}, beginPath() {}, rect() {}, clip() {}, arc() {}, fill() { draws++; },
  drawImage() { draws++; }, fillRect() { draws++; }, measureText: () => ({fontBoundingBoxAscent: 80, fontBoundingBoxDescent: 20}),
  getImageData: () => { const data = new Uint8ClampedArray(400 * 200 * 4); for(let i=3;i<data.length;i+=4)data[i]=255; return {data}; },
  font: '', fillStyle: '', textBaseline: '', letterSpacing: '', globalAlpha: 1,
});
const classes = new Set<string>();
const title = {
  style: {setProperty() {}, removeProperty() {}},
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

// The rollback restores the established layout; the background has no motion inputs.
assert(!html.includes('case-index-media') && !html.includes('<br><span data-vapour-word>'));
assert(html.includes('<div class="case-card-bottom">') && html.includes('(04 proyectos)'));
const css = readFileSync(new URL('../assets/case-index.css', import.meta.url), 'utf8');
assert(!/case-gutter|grid-template|case-reveal|case-image-y|case-ambient-y/.test(css),'effect stylesheet does not rearrange the established layout');
assert(!/pointermove|case-ambient-y|case-image-y|case-reveal/.test(runtime),'index runtime no longer moves background or cards');
console.log('PASS: established case layout restored and motion limited to the title.');

const {createStaticVelvetHaze, STATIC_HAZE_FRAGMENT, hexToRgb} = await import('../lib/velvet-haze');
assert.deepEqual(hexToRgb('#fff'), [1, 1, 1]);assert.deepEqual(hexToRgb('bad-color'), [0, 0, 0]);
let paints = 0, programsFreed = 0, verticesFreed = 0, resize: () => void = () => {};
const events: Record<string,(event?:unknown)=>void> = {}, attributes = new Set<string>();
const gl = {
 VERTEX_SHADER:1, FRAGMENT_SHADER:2, COMPILE_STATUS:3, LINK_STATUS:4, TRIANGLES:5,
 createShader:()=>({}),shaderSource(){},compileShader(){},getShaderParameter:()=>true,deleteShader(){},
 createProgram:()=>({}),attachShader(){},linkProgram(){},getProgramParameter:()=>true,
 deleteProgram(){programsFreed++;},createVertexArray:()=>({}),deleteVertexArray(){verticesFreed++;},
 useProgram(){},bindVertexArray(){},viewport(){},uniform2f(){},uniform1f(){},uniform3fv(){},getUniformLocation:()=>({}),drawArrays(){paints++;},
};
const hazeCanvas = {
 clientWidth: 1200,clientHeight:800,width:0,height:0,getContext:()=>gl,
 setAttribute:(name:string)=>attributes.add(name),removeAttribute:(name:string)=>attributes.delete(name),
 addEventListener:(name:string,fn:(event?:unknown)=>void)=>{events[name]=fn;},removeEventListener:(name:string)=>{delete events[name];},
};
Object.assign(globalThis,{ResizeObserver:class{constructor(callback:()=>void){resize=callback;}observe(){}disconnect(){}}});
const disposeHaze = createStaticVelvetHaze(hazeCanvas as unknown as HTMLCanvasElement)!;
assert.equal(paints,1,'background paints a single frozen exposure');assert(attributes.has('data-haze-ready'));
resize();resize();assert.equal(paints,1,'unchanged size does not redraw');
hazeCanvas.clientWidth=900;resize();assert.equal(paints,2,'resize redraws once');
events.webglcontextlost({preventDefault(){}});assert(!attributes.has('data-haze-ready'),'context loss exposes the static CSS fallback');resize();assert.equal(paints,2);
events.webglcontextrestored();assert.equal(paints,3,'context restoration rebuilds the static frame');
disposeHaze();assert(programsFreed>=2&&verticesFreed>=2,'cleanup releases GPU objects');assert.equal(Object.keys(events).length,0);
assert.equal(createStaticVelvetHaze({getContext:()=>null} as unknown as HTMLCanvasElement),null,'WebGL-unavailable fallback');
const hazeSource=readFileSync(new URL('../lib/velvet-haze.ts',import.meta.url),'utf8');
assert(!/requestAnimationFrame|setInterval|setTimeout|pointermove|pointerdown|uTime|uFrame|uLamp|uRipple/.test(hazeSource),'static background has no clock, pointer or click effects');
assert(STATIC_HAZE_FRAGMENT.includes('smoothstep(edge-soft,edge+soft,q.y)'), 'fold uses defined smoothstep edge order');
console.log('PASS: frozen haze draws only initially/on resize, caches equal sizes, restores context, releases resources and has no pointer or time uniforms.');
