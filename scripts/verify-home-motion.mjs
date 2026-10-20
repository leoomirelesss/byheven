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
assert(!('touchmove' in f.listeners),'touch momentum remains native');
function listenersForInput(listeners){return ['wheel','touchmove','keydown'].some(key=>key in listeners);}
for(const name of ['shopify-hero','cases','faq-scroll','services','home-finish','contact-light','chapter-arrivals'])transformSync(readFileSync(new URL(`../assets/${name}.js`,import.meta.url),'utf8'),{loader:'js'});
for(const name of ['shopify-hero','cases','home-finish','services'])transformSync(readFileSync(new URL(`../assets/${name}.css`,import.meta.url),'utf8'),{loader:'css'});
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
assert(!/id="process"|href="#process"|process-cards\.(?:js|css)|process-story\.css/.test(html),'removed chapter has no markup, dead links or runtime requests');
assert(html.indexOf('assets/scroll-story.js')<html.indexOf('assets/shopify-hero.js'),'clock loads before consumers');
assert(/id="work"[\s\S]*?<\/section>\s*<section id="faq"/.test(html),'projects lead directly into FAQ');
console.log('PASS: shared clock batching, finite settling, idle sleep, 60/120Hz timing, cached measurement, hidden-tab pause, reduced motion, anchor jumps, unsubscribe, native input and removed process assets/links.');

function element(properties={}){
 const classes=new Set(),values={},handlers={};
 return {style:{values,setProperty:(k,v)=>values[k]=v,removeProperty:k=>delete values[k]},dataset:{},
 classList:{add:k=>classes.add(k),toggle(k,on){if(on)classes.add(k);else classes.delete(k);},remove:k=>classes.delete(k),contains:k=>classes.has(k)},
 handlers,addEventListener:(type,fn)=>handlers[type]=fn,querySelector:()=>null,querySelectorAll:()=>[],...properties};
}
const g=fixture();let reads=0;const wide={matches:true,addEventListener(){}};
g.window.matchMedia=q=>q.includes('reduced')?g.media:wide;
const cards=Array.from({length:5},(_,i)=>element({offsetLeft:i*720,offsetWidth:700,closest(){return this;},focus(options){this.focusOptions=options;galleryTrack.handlers.focusin({target:this});}}));
const covers=cards.map(()=>element());cards.forEach((card,i)=>{card.querySelector=selector=>selector==='.case-cover'?covers[i]:null;});
const galleryTrack=element({scrollWidth:3580,querySelectorAll:()=>cards});
const galleryViewport=element({clientWidth:1440,offsetHeight:900,querySelector:()=>galleryTrack});
const gallery=element({querySelector:()=>galleryViewport,getBoundingClientRect(){reads++;return {top:2000-g.window.scrollY};}});
g.document.querySelector=s=>s==='[data-case-story]'?gallery:null;g.document.querySelectorAll=()=>[];g.document.body={hasAttribute:()=>false};
g.window.scrollTo=options=>{g.window.scrollY=options.top;};
g.run(readFileSync(new URL('../assets/cases.js',import.meta.url),'utf8'));g.flush();assert(gallery.classList.contains('is-pinned'));
const travel=(3580-1360)*1.25;
g.window.scrollY=2000+travel/2;g.clock.reset();g.flush();assert.equal(gallery.dataset.caseProgress,'0.5000');assert(galleryTrack.style.transform.includes('-1110px'));
const depthBefore=covers[1].style.values['--case-depth-x'];
const beforeReads=reads;g.window.scrollY+=100;g.listeners.scroll();g.flush();assert.equal(reads,beforeReads,'gallery scroll does not read layout');assert.notEqual(covers[1].style.values['--case-depth-x'],depthBefore,'cover parallax follows scroll');assert(covers.every(cover=>Math.abs(parseFloat(cover.style.values['--case-depth-x']))<=2.5),'parallax is bounded inside the crop');
g.window.scrollY=2000;g.listeners.scroll();g.flush();assert.equal(gallery.dataset.caseProgress,'0.0000');
g.window.scrollY=2000+travel;g.listeners.scroll();g.flush();assert.equal(gallery.dataset.caseProgress,'1.0000','gallery finishes at its release boundary');
galleryTrack.handlers.keydown({key:'ArrowRight',target:cards[0],preventDefault(){}});g.flush();assert(cards[1].focusOptions.preventScroll);assert(g.window.scrollY>2000,'keyboard exposes the selected card');
g.media.matches=true;g.clock.reset();g.flush();assert(!gallery.classList.contains('is-pinned'));assert.equal(galleryTrack.style.transform,'');assert(covers.every(cover=>!('--case-depth-x' in cover.style.values)),'reduced motion removes parallax');
g.media.matches=false;g.window.innerHeight=500;g.clock.reset();g.flush();assert(!gallery.classList.contains('is-pinned'),'short screens retain native horizontal access');

const q=fixture();q.window.matchMedia=s=>s.includes('reduced')?q.media:{matches:false,addEventListener(){}};q.window.ResizeObserver=class{};
let faqReads=0,faqTop=6000;
const summaries=Array.from({length:10},(_,i)=>element({offsetHeight:54,matches:()=>true,getBoundingClientRect:()=>({top:i*70})}));
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
summaries[9].handlers.focus({target:summaries[9]});q.flush();assert(q.window.scrollY>faqTop,'keyboard focus reveals an off-window question');
faqTop=7000;q.clock.invalidate();q.flush();q.window.scrollY=faqTop;q.clock.reset();q.flush();assert.equal(chat.style.values['--faq-offset'],'0px','layout changes refresh the chapter start');
q.media.matches=true;q.clock.reset();q.flush();assert(!faq.classList.contains('is-scroll-story'));assert(!('--faq-offset' in chat.style.values));
console.log('PASS: real gallery/FAQ controllers with the shared clock: cached geometry, forward/reverse/endpoints, responsive fallback, keyboard reveal, changed layout and reduced motion.');

const a=fixture();let arrivalReads=0;
function arrivalNode(top,lines=[]){
 const node=element({querySelectorAll:()=>lines,contains(target){return target===this;},getBoundingClientRect(){arrivalReads++;return {top:top-a.window.scrollY+(parseFloat(node.style.values['--arrival-y'])||0)};}});
 return node;
}
const titleLines=[element(),element()],title=arrivalNode(1400,titleLines),body=arrivalNode(1500);
a.document.querySelectorAll=()=>[title,body];a.run(readFileSync(new URL('../assets/chapter-arrivals.js',import.meta.url),'utf8'));a.flush();
assert.equal(titleLines[0].style.values['--arrival-line-y'],'108%');
a.window.scrollY=660;a.listeners.scroll();a.flush();const lineY=parseFloat(titleLines[0].style.values['--arrival-line-y']);assert(lineY>0&&lineY<108,'heading enters progressively with page scroll');
const entryReads=arrivalReads;a.window.scrollY=800;a.listeners.scroll();a.flush();assert.equal(arrivalReads,entryReads,'entrances use cached positions');const bodyY=body.style.values['--arrival-y'];
a.clock.invalidate();a.flush();assert(Math.abs(parseFloat(body.style.values['--arrival-y'])-parseFloat(bodyY))<1e-8,'an element presentation shift does not move its trigger');
a.window.scrollY=1000;a.listeners.scroll();a.flush();assert(titleLines.every(line=>line.style.values['--arrival-line-y']==='0%'));assert.equal(body.style.values['--arrival-opacity'],'1');
a.window.scrollY=0;a.listeners.scroll();a.flush();assert.equal(titleLines[0].style.values['--arrival-line-y'],'0%','presented content has no artificial exit or reverse fade');
a.media.matches=true;a.listeners.motion();a.flush();assert(!title.classList.contains('is-arrival-ready'));assert(!('--arrival-y' in body.style.values));
const focused=fixture(),focusLine=element(),focusTitle=element({querySelectorAll:()=>[focusLine],getBoundingClientRect:()=>({top:1400}),contains:()=>true});focused.document.querySelectorAll=()=>[focusTitle];focused.run(readFileSync(new URL('../assets/chapter-arrivals.js',import.meta.url),'utf8'));focused.flush();focused.listeners.focusin({target:focusTitle});focused.flush();assert.equal(focusLine.style.values['--arrival-line-y'],'0%','interacted content is fully presented');

const v=fixture();v.window.innerWidth=1440;v.window.ResizeObserver=class{};
function serviceRow(open=false){
 const attrs={'aria-expanded':String(open)},button=element({setAttribute:(k,x)=>attrs[k]=x,getAttribute:k=>attrs[k]});
 const panel=element({setAttribute(){}}),symbol={};const row=element({querySelector:s=>s.includes('toggle')?button:s.includes('panel')?panel:symbol});return {row,button,panel};
}
const serviceRows=[serviceRow(true),serviceRow(),serviceRow()],inner={offsetHeight:600};
const serviceSection=element({querySelectorAll:()=>serviceRows.map(x=>x.row),querySelector:()=>inner});v.document.querySelector=()=>serviceSection;
v.run(readFileSync(new URL('../assets/services.js',import.meta.url),'utf8'));v.flush();assert.equal(parseFloat(serviceSection.style.values['--services-arrival-height']),816,'desktop hold adds 216px at 900px, up from 162px');
serviceRows[1].button.handlers.click();assert(serviceRows[0].panel.inert);assert.equal(serviceRows[1].panel.inert,false);assert.equal(serviceRows[1].button.getAttribute('aria-expanded'),'true');
v.window.innerWidth=390;v.listeners.resize();v.flush();assert(!serviceSection.classList.contains('is-arrival-paused'),'mobile services stay in native document flow');
assert(!('--services-arrival-height' in serviceSection.style.values));
inner.offsetHeight=720;v.listeners.resize();v.flush();assert(!('--services-arrival-height' in serviceSection.style.values),'mobile accordion changes do not introduce a scroll hold');
v.window.innerWidth=1440;v.listeners.resize();v.flush();assert.equal(parseFloat(serviceSection.style.values['--services-arrival-height']),936,'desktop reading hold is restored unchanged');
v.media.matches=true;v.listeners.motion();v.flush();assert(!serviceSection.classList.contains('is-arrival-paused'));assert(!('--services-arrival-height' in serviceSection.style.values));
assert(!/class="(?:home-overline|case-overline|commerce-services-label)"/.test(html),'no section labels or their dividing rules remain in home markup');
assert.equal((html.match(/class="chat-item"/g)||[]).length,10,'FAQ keeps ten distinct useful questions');
console.log('PASS: scroll-led masked arrivals, no exit fade, focus and reduced-motion fallbacks, stable cached triggers, modest responsive reading hold, accordion interaction and ten audited FAQs.');

// Exercise real wheel input and document movement, not only animation consumers.
function wheelFixture() {
 const w=fixture();w.document.documentElement={scrollHeight:10000};w.document.body={};
 w.window.scrollTo=({top})=>{w.window.scrollY=top;};
 w.clock.invalidate();w.flush();
 w.wheel=(delta,extra={})=>{let blocked=false;w.listeners.wheel({deltaY:delta,deltaX:0,deltaMode:0,cancelable:true,composedPath:()=>[],preventDefault(){blocked=true;},...extra});return blocked;};
 return w;
}
const wheel=wheelFixture();assert(wheel.wheel(100));assert.equal(wheel.window.scrollY,0,'wheel input accumulates without an instant jump');
wheel.step();assert(wheel.window.scrollY>0&&wheel.window.scrollY<68);wheel.flush();assert.equal(wheel.window.scrollY,68,'wheel travel is 68% of input and settles exactly');
wheel.wheel(200);wheel.step();const reverseStart=wheel.window.scrollY;wheel.wheel(-100);wheel.step();assert(wheel.window.scrollY<reverseStart,'reversal responds on the next frame');wheel.flush();
wheel.wheel(100);wheel.step();wheel.listeners.keydown({key:'PageDown'});const stopped=wheel.window.scrollY;wheel.flush();assert.equal(wheel.window.scrollY,stopped,'keyboard cancels residual momentum');
assert(!wheel.wheel(100,{ctrlKey:true}),'pinch/zoom stays native');assert(!wheel.wheel(100,{deltaX:200}),'horizontal gestures stay native');
wheel.media.matches=true;assert(!wheel.wheel(100),'reduced motion stays native');wheel.media.matches=false;
assert(!wheel.wheel(100,{composedPath:()=>[{nodeType:1,matches:()=>true}]}),'form input stays native');
wheel.window.scrollY=9090;wheel.clock.reset();wheel.flush();wheel.wheel(1000);wheel.flush();assert.equal(wheel.window.scrollY,9100,'no overshoot at page bottom');
const hz60=wheelFixture(),hz120=wheelFixture();hz60.wheel(600);hz120.wheel(600);hz60.step();hz120.step();for(let i=0;i<6;i++)hz60.step(16.6666);for(let i=0;i<12;i++)hz120.step(8.3333);assert(Math.abs(hz60.window.scrollY-hz120.window.scrollY)<.01,'document easing is refresh-rate independent');
console.log('PASS: slower wheel travel, continuous document easing, immediate reversal, finite settling, boundaries, 60/120Hz equivalence and native input escape paths.');
const rounded=wheelFixture();rounded.window.scrollTo=({top})=>{rounded.window.scrollY=Math.round(top);};rounded.wheel(100);rounded.flush();assert.equal(rounded.window.scrollY,68,'integer scroll positions cannot stall the animation');
const external=wheelFixture();external.wheel(500);external.step();external.window.scrollY=2000;external.listeners.scroll();external.flush();assert.equal(external.window.scrollY,2000,'external scroll commands take ownership');

q.media.matches=false;q.window.innerWidth=390;q.clock.reset();q.flush();
assert(!faq.classList.contains('is-scroll-story'),'mobile FAQ does not pin or hide questions');
assert(!('--faq-offset' in chat.style.values));
const mobileWheel=wheelFixture();mobileWheel.window.innerWidth=390;
assert(!mobileWheel.wheel(100),'mobile wheel/trackpad input remains native too');
mobileWheel.window.innerWidth=1440;assert(mobileWheel.wheel(100),'desktop retains approved wheel pacing');
console.log('PASS: mobile native FAQ, accordion and input; desktop timing restored at breakpoint.');

await import('./verify-mobile.mjs');
