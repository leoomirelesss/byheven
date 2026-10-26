import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transformSync} from 'esbuild';
const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const source = read('assets/interaction-feel.js');
transformSync(source, {loader: 'js'}); transformSync(read('assets/interaction-feel.css'), {loader: 'css'});
function fixture() {
  const events = {}, values = new Map(); let client, wakes = 0, subscriptions = 0, geometry = 0;
  const style = {scrollSnapType: '', scrollBehavior: '', translate: '', setProperty(k,v){values.set(k,v);},removeProperty(k){values.delete(k);}};
  const button = {style, matches:()=>false, closest:s=>s.includes('[inert]')?null:s.includes('a[href]')?button:null};
  let position = 0;
  const track = {style:{...style,translate:''},closest:s=>s.includes('is-pinned')?null:s.includes('.case-track')?track:null,setPointerCapture(){},releasePointerCapture(){},
    get scrollWidth(){geometry++;return 2400;},get clientWidth(){geometry++;return 400;},get scrollLeft(){return position;},set scrollLeft(x){position=Math.max(0,Math.min(2000,x));}};
  const motion = {matches:false,addEventListener(k,fn){events.preference=fn;}};
  const clock = {subscribe(c){client=c;subscriptions++;return()=>{client=null;subscriptions--;};},wake(){wakes++;}};
  const doc = {hidden:false,documentElement:{setAttribute(){}},addEventListener(k,fn){(events[k] ||= []).push(fn);}};
  const win = {HevenMotion:clock,matchMedia:()=>motion,addEventListener(k,fn){(events[k] ||= []).push(fn);}};
  vm.runInNewContext(source,{window:win,document:doc});
  const event = (type, data={}) => {const e={type,target:button,pointerId:1,pointerType:'mouse',button:0,detail:1,clientX:100,clientY:10,timeStamp:0,preventDefault(){this.prevented=true;},stopImmediatePropagation(){this.stopped=true;},...data};events[type]?.forEach(fn=>fn(e));return e;};
  const tick = (dt=16.667) => client?.render({dt});
  const finish = () => {let count=0;while(tick() && count++<500){}assert(count<500,'physics must settle and let the shared clock sleep');};
  return {win,doc,motion,events,button,track,values,event,tick,finish,api:win.HevenFeel,get geometry(){return geometry;},get wakes(){return wakes;},get subscriptions(){return subscriptions;}};
}
const f=fixture(),api=f.api;
const peak={value:0,velocity:0,target:1};api.spring(peak,261.7993878);
assert(Math.abs(peak.value-1.015164619)<1e-8,'damping .8 gives the requested ~1.5% overshoot');
const a={value:0,velocity:0,target:500},b={...a};for(let i=0;i<60;i++)api.spring(a,1000/60);for(let i=0;i<120;i++)api.spring(b,1000/120);
assert(Math.abs(a.value-b.value)<1e-8 && Math.abs(a.velocity-b.velocity)<1e-8,'spring is independent of refresh rate');
assert(Math.abs(api.rubber(200)-86)<1e-9);assert(Math.abs(api.rubber(-200)+86)<1e-9);assert(api.rubber(200.01)-86<.01,'rubberband has no jump at 200px');assert(api.rubber(10000)<=100,'stretch stays bounded');
const initial=1000 * -Math.log(.998), one=api.momentum(initial,1000);let distance=0,velocity=initial;
for(let i=0;i<120;i++){const step=api.momentum(velocity,1000/120);distance+=step.distance;velocity=step.velocity;}
assert(Math.abs(distance-one.distance)<1e-8);assert(Math.abs(velocity-one.velocity)<1e-10);assert(Math.abs(one.distance+one.velocity/-Math.log(.998)-1000)<1e-8,'reference throw has a 1000px glide at .998 per ms');
f.event('pointerdown');assert.equal(f.values.get('--feel-scale'),'0.98');assert.equal(f.wakes,0,'press paints synchronously before any frame');
f.event('pointerup');assert(f.wakes>0);f.tick();const returning=Number(f.values.get('--feel-scale'));assert(returning>.98);
f.event('pointerdown');assert.equal(Number(f.values.get('--feel-scale')),.98,'repress interrupts a release immediately');f.event('pointerup');f.finish();assert(!f.values.has('--feel-scale'));
f.event('keydown',{key:' ',repeat:false});assert.equal(Number(f.values.get('--feel-scale')),.98);f.event('keyup',{key:' '});f.finish();
api.scrollTo(f.track,1000);const reads=f.geometry;for(let i=0;i<8;i++)f.tick();assert.equal(f.geometry,reads,'frames never measure geometry');const before=f.track.scrollLeft;
api.scrollTo(f.track,0);assert.equal(f.track.scrollLeft,before,'retarget preserves position');for(let i=0;i<5;i++)f.tick();assert(f.track.scrollLeft<before,'reversal responds without a 180ms lock');f.finish();assert.equal(f.track.scrollLeft,0);assert(!api.isScrolling(f.track));
api.scrollTo(f.track,700);f.tick();const current=f.track.scrollLeft;f.event('wheel',{target:f.track});assert(!api.isScrolling(f.track));f.tick();assert.equal(f.track.scrollLeft,current,'native wheel takes ownership immediately');assert.equal(f.track.style.scrollSnapType,'');
f.track.scrollLeft=0;f.event('pointerdown',{target:f.track,pointerType:'touch'});const touch=f.event('pointermove',{target:f.track,pointerType:'touch',clientX:300,timeStamp:30});assert(!touch.prevented,'native touch momentum is never replaced');
f.event('pointerdown',{target:f.track});const pull=f.event('pointermove',{target:f.track,clientX:300,timeStamp:50});assert(pull.prevented);assert(Math.abs(parseFloat(f.track.style.translate)-86)<1e-8);f.event('pointercancel',{target:f.track,timeStamp:60});f.finish();assert.equal(f.track.style.translate,'');
const blocked=f.event('click',{target:f.track});assert(blocked.prevented);const keyboardClick=f.event('click',{target:f.button,detail:0});assert(!keyboardClick.prevented,'drag suppression cannot swallow keyboard activation');
f.event('pointerdown',{target:f.track,clientX:500,timeStamp:100});f.event('pointermove',{target:f.track,clientX:300,timeStamp:150});f.event('pointerup',{target:f.track,clientX:300,timeStamp:151});assert(api.isScrolling(f.track));f.event('pointerdown',{target:f.track,clientX:300,timeStamp:160});assert(!api.isScrolling(f.track),'new input cancels inertia without delay');f.event('pointerup',{target:f.track});
f.motion.matches=true;f.events.preference();f.event('pointerdown');assert(!f.values.has('--feel-scale'));api.scrollTo(f.track,500);assert.equal(f.track.scrollLeft,500);assert(!api.isScrolling(f.track),'reduced motion remains complete and instantaneous');
f.event('pagehide');assert.equal(f.subscriptions,0);f.event('pageshow',{persisted:true});assert.equal(f.subscriptions,1,'history restoration has one clock client');f.event('pagehide');
for(const page of ['index.html','case-studies/index.html',...['emyasa','stone-kuche','parsomen','dor','dor-os','academic-quest'].map(s=>'case-studies/'+s+'/index.html')]) {
 const html=read(page);assert.equal((html.match(/interaction-feel\.js/g)||[]).length,1);assert.equal((html.match(/interaction-feel\.css/g)||[]).length,1);assert(html.indexOf('scroll-story.js')<html.indexOf('interaction-feel.js'));assert(html.indexOf('interaction-feel.js')<html.indexOf('mobile-experience.js'));
}
console.log('PASS: zero-wait press and re-press; .8 spring / 1.5% overshoot; 60/120Hz equivalence; .998 / 1000px reference glide; smooth 200→86 rubberband; immediate interruption, native touch, keyboard, reduced motion, finite settling, no frame geometry and eight-page wiring.');
