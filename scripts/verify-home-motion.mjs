import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transformSync} from 'esbuild';

const source=readFileSync(new URL('../assets/scroll-story.js',import.meta.url),'utf8');
function fixture(){
 const listeners={},queue=new Map(),media={matches:false,addEventListener:(type,fn)=>listeners.motion=fn};
 let sequence=0,time=0;
 const document={hidden:false,querySelector:()=>null,addEventListener:(type,fn)=>listeners[type]=fn};
 const window={scrollY:0,innerHeight:900,matchMedia:()=>media,addEventListener:(type,fn)=>listeners[type]=fn};
 const context=vm.createContext({window,document,getComputedStyle:()=>({paddingLeft:'40',paddingRight:'40'}),ResizeObserver:class{observe(){}},requestAnimationFrame:fn=>{queue.set(++sequence,fn);return sequence;},cancelAnimationFrame:id=>queue.delete(id)});
 vm.runInContext(source,context);
 const step=(dt=16.667)=>{time+=dt;const pending=[...queue.values()];queue.clear();pending.forEach(fn=>fn(time));};
 const flush=()=>{let count=0;while(queue.size&&count++<150)step();assert(!queue.size,'animation must settle and stop scheduling frames');};
 return {window,document,media,listeners,queue,step,flush,clock:window.HevenMotion,run:code=>vm.runInContext(code,context)};
}
const f=fixture(),log=[];let measured=0,value=0,target=0;
const dispose=f.clock.subscribe({measure(){measured++;log.push('measure');},render(s){log.push('render');value=f.clock.approach(value,target,s.dt,s.immediate);return value!==target;}});
f.flush();assert.equal(measured,1);assert.deepEqual(log,['measure','render']);
target=1;f.window.scrollY=200;for(let i=0;i<12;i++)f.listeners.scroll();assert.equal(f.queue.size,1,'scroll events coalesce');f.step();assert(value>0&&value<1,'scroll progress is interpolated rather than jumped');f.flush();assert.equal(value,1);assert.equal(measured,1,'scroll frames never measure layout');
let fine=0,coarse=0;for(let i=0;i<12;i++)fine=f.clock.approach(fine,1,8.3333);for(let i=0;i<6;i++)coarse=f.clock.approach(coarse,1,16.6666);assert(Math.abs(fine-coarse)<1e-6,'time-based damping matches at 60/120Hz');
f.clock.invalidate();f.flush();assert.equal(measured,2);
target=0;f.clock.wake();f.step();assert(f.queue.size);f.document.hidden=true;f.listeners.visibilitychange();assert.equal(f.queue.size,0);f.document.hidden=false;f.listeners.visibilitychange();f.flush();assert.equal(value,0,'tab restoration snaps to native position');
target=1;f.media.matches=true;f.listeners.motion();f.flush();assert.equal(value,1,'reduced motion has no damping');
f.media.matches=false;target=0;f.window.scrollY=4000;f.listeners.scroll();f.step();assert.equal(value,0,'long anchor jumps synchronize immediately');assert.equal(f.queue.size,0);
dispose();f.clock.wake();const count=log.length;f.flush();assert.equal(log.length,count,'unsubscribe releases the client');
assert(!listenersForInput(f.listeners),'native wheel, touch and keyboard remain unclaimed');
function listenersForInput(listeners){return ['wheel','touchmove','keydown'].some(key=>key in listeners);}
for(const name of ['shopify-hero','cases','faq-scroll','services','home-finish','contact-light'])transformSync(readFileSync(new URL(`../assets/${name}.js`,import.meta.url),'utf8'),{loader:'js'});
for(const name of ['shopify-hero','cases','home-finish'])transformSync(readFileSync(new URL(`../assets/${name}.css`,import.meta.url),'utf8'),{loader:'css'});
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert(!/id="process"|href="#process"|process-cards\.(?:js|css)|process-story\.css/.test(html),'removed chapter has no markup, dead links or runtime requests');
assert(html.indexOf('assets/scroll-story.js')<html.indexOf('assets/shopify-hero.js'),'clock loads before consumers');
assert(/id="work"[\s\S]*?<\/section>\s*<section id="faq"/.test(html),'projects lead directly into FAQ');
console.log('PASS: shared clock batching, finite settling, idle sleep, 60/120Hz timing, cached measurement, hidden-tab pause, reduced motion, anchor jumps, unsubscribe, native input and removed process assets/links.');

function element(properties={}){
 const classes=new Set(),values={},handlers={};
 return {style:{values,setProperty:(k,v)=>values[k]=v,removeProperty:k=>delete values[k]},dataset:{},
 classList:{toggle(k,on){if(on)classes.add(k);else classes.delete(k);},remove:k=>classes.delete(k),contains:k=>classes.has(k)},
 handlers,addEventListener:(type,fn)=>handlers[type]=fn,querySelector:()=>null,querySelectorAll:()=>[],...properties};
}
const g=fixture();let reads=0;const wide={matches:true,addEventListener(){}};
g.window.matchMedia=q=>q.includes('reduced')?g.media:wide;
const cards=Array.from({length:5},(_,i)=>element({offsetLeft:i*720,offsetWidth:700,closest(){return this;},focus(options){this.focusOptions=options;galleryTrack.handlers.focusin({target:this});}}));
const galleryTrack=element({scrollWidth:3580,querySelectorAll:()=>cards});
const galleryViewport=element({clientWidth:1440,offsetHeight:900,querySelector:()=>galleryTrack});
const gallery=element({querySelector:()=>galleryViewport,getBoundingClientRect(){reads++;return {top:2000-g.window.scrollY};}});
g.document.querySelector=s=>s==='[data-case-story]'?gallery:null;g.document.querySelectorAll=()=>[];g.document.body={hasAttribute:()=>false};
g.window.scrollTo=options=>{g.window.scrollY=options.top;};
g.run(readFileSync(new URL('../assets/cases.js',import.meta.url),'utf8'));g.flush();assert(gallery.classList.contains('is-pinned'));
const travel=(3580-1360)*1.25;
g.window.scrollY=2000+travel/2;g.clock.reset();g.flush();assert.equal(gallery.dataset.caseProgress,'0.5000');assert(galleryTrack.style.transform.includes('-1110px'));
const beforeReads=reads;g.window.scrollY+=100;g.listeners.scroll();g.flush();assert.equal(reads,beforeReads,'gallery scroll does not read layout');
g.window.scrollY=2000;g.listeners.scroll();g.flush();assert.equal(gallery.dataset.caseProgress,'0.0000');
g.window.scrollY=2000+travel;g.listeners.scroll();g.flush();assert.equal(gallery.dataset.caseProgress,'1.0000','gallery finishes at its release boundary');
galleryTrack.handlers.keydown({key:'ArrowRight',target:cards[0],preventDefault(){}});g.flush();assert(cards[1].focusOptions.preventScroll);assert(g.window.scrollY>2000,'keyboard exposes the selected card');
g.media.matches=true;g.clock.reset();g.flush();assert(!gallery.classList.contains('is-pinned'));assert.equal(galleryTrack.style.transform,'');
g.media.matches=false;g.window.innerHeight=500;g.clock.reset();g.flush();assert(!gallery.classList.contains('is-pinned'),'short screens retain native horizontal access');

const q=fixture();q.window.matchMedia=s=>s.includes('reduced')?q.media:{matches:false,addEventListener(){}};q.window.ResizeObserver=class{};
let faqReads=0,faqTop=6000;
const summaries=Array.from({length:12},(_,i)=>element({offsetHeight:54,matches:()=>true,getBoundingClientRect:()=>({top:i*70})}));
const questions=summaries.map((summary,i)=>element({offsetHeight:70,querySelector:()=>summary,getBoundingClientRect:()=>({top:i*70})}));
const chat=element({scrollHeight:1100,getBoundingClientRect:()=>({top:0})});
const chatViewport=element({clientHeight:398});
const faqStage=element({offsetHeight:900}),faqLayout=element({clientHeight:650}),faqIntro=element({offsetHeight:160}),hint=element({offsetHeight:15});
const nodes={'.faq-stage':faqStage,'.home-faq-layout':faqLayout,'.home-faq-intro':faqIntro,'.chat-hint':hint,'.chat-window':chatViewport,'.chat-stream':chat};
const faq=element({querySelector:s=>nodes[s],querySelectorAll:()=>questions,getBoundingClientRect(){faqReads++;return {top:faqTop-q.window.scrollY};}});
q.document.getElementById=()=>faq;q.window.scrollTo=options=>{q.window.scrollY=options.top;};
q.run(readFileSync(new URL('../assets/faq-scroll.js',import.meta.url),'utf8'));q.flush();assert(faq.classList.contains('is-scroll-story'));
const distance=1100-398;q.window.scrollY=faqTop+distance*1.35/2;q.clock.reset();q.flush();assert(Math.abs(parseFloat(chat.style.values['--faq-offset'])+351)<.001);
const measuredFAQ=faqReads;q.window.scrollY+=80;q.listeners.scroll();q.flush();assert.equal(faqReads,measuredFAQ,'FAQ scrolling does not read layout');
q.window.scrollY=faqTop+distance*1.35;q.listeners.scroll();q.flush();assert(Math.abs(parseFloat(chat.style.values['--faq-offset'])+702)<.001,'last FAQ reaches the visible window before release');
q.window.scrollY=faqTop;q.listeners.scroll();q.flush();assert.equal(chat.style.values['--faq-offset'],'0px','FAQ reverses fully');
summaries[11].handlers.focus({target:summaries[11]});q.flush();assert(q.window.scrollY>faqTop,'keyboard focus reveals an off-window question');
faqTop=7000;q.clock.invalidate();q.flush();q.window.scrollY=faqTop;q.clock.reset();q.flush();assert.equal(chat.style.values['--faq-offset'],'0px','layout changes refresh the chapter start');
q.media.matches=true;q.clock.reset();q.flush();assert(!faq.classList.contains('is-scroll-story'));assert(!('--faq-offset' in chat.style.values));
console.log('PASS: real gallery/FAQ controllers with the shared clock: cached geometry, forward/reverse/endpoints, responsive fallback, keyboard reveal, changed layout and reduced motion.');
