import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/case-screen-story.js', import.meta.url), 'utf8');
assert(!/requestAnimationFrame|setTimeout|setInterval/.test(source), 'the sequence has no separate timer or scroll clock');
function fixture({pending = -1} = {}) {
  let client, reads = 0, writes = 0, wakes = 0, releases = 0, resets = 0;
  const events = {}, attributes = new Map(), heights = new Map(), scrolls = [];
  const media = {matches:false,addEventListener(){},removeEventListener(){}};
  const waits = [], labels = ['Inicio','Producto','Servicios','Seguimiento'];
  const views = labels.map((label, index) => ({
    complete:index !== pending, naturalWidth:index !== pending ? 1924 : 0,
    dataset:{screenLabel:label}, style:{set opacity(value){writes++;this.value=value;}},
    decode(){return new Promise(resolve => {waits[index] = resolve;});},
  }));
  const buttons = views.map(() => ({attributes:new Map(),events:{},setAttribute(k,v){this.attributes.set(k,v);},addEventListener(k,v){this.events[k]=v;},removeEventListener(k){delete this.events[k];}}));
  const stage = {offsetHeight:900}, counter = {}, display = {setAttribute(k,v){attributes.set(k,v);}};
  const story = {
    dataset:{screenProject:'EMYASA'},
    querySelector:selector=>selector==='.case-device'?stage:selector==='.case-device-display'?display:counter,
    querySelectorAll:selector=>selector==='.case-device-view'?views:buttons,
    toggleAttribute(k,on){if(on)attributes.set(k,true);else attributes.delete(k);},
    style:{set height(value){heights.set('height',value);},removeProperty:k=>heights.delete(k)},
    getBoundingClientRect(){reads++;return{top:3000-view.scrollY};},
  };
  const clock = {
    settings:{arrivalMin:140,arrivalMax:240,arrivalDistance:.24},
    approach:(value,target,dt,immediate)=>immediate||Math.abs(target-value)<.0001?target:value+(target-value)*(1-Math.exp(-dt/70)),
    subscribe(value){client=value;return()=>releases++;},invalidate(){client.measure();},wake(){wakes++;},reset(){resets++;},
  };
  const view = {HevenMotion:clock,innerHeight:900,scrollY:0,matchMedia:()=>media,addEventListener:(k,v)=>{events[k]=v;},scrollTo:options=>scrolls.push(options),IntersectionObserver:class{}};
  let near;
  vm.runInNewContext(source,{
    window:view,document:{querySelector:()=>story},ResizeObserver:class{observe(){}disconnect(){}},
    IntersectionObserver:class{constructor(callback){near=callback;}observe(){}disconnect(){}},
  });
  client.measure();
  return {views,buttons,events,view,media,attributes,heights,counter,display,scrolls,
    measure:()=>client.measure(),render:(y,immediate=true)=>client.render({y,dt:16.67,immediate}),
    near:()=>near([{isIntersecting:true}]),resolve:index=>{views[index].naturalWidth=1924;waits[index]?.();},
    reads:()=>reads,writes:()=>writes,wakes:()=>wakes,releases:()=>releases,resets:()=>resets};
}
const hold=468, blend=216, travel=hold*4+blend*3, start=3000;
const env=fixture();assert.equal(env.heights.get('height'),`${900+travel}px`);
const reads=env.reads();
for(let index=0;index<4;index++){
  const y=start+index*(hold+blend)+hold/2;env.render(y);
  assert.equal(env.counter.textContent,`0${index+1} / 04`);
  assert.equal(env.views[index].style.value,'1');
  const pose=env.views.map(view=>view.style.value);env.render(y+hold*.1);assert.deepEqual(env.views.map(view=>view.style.value),pose,'each screen has a real reading hold');
  assert.equal(env.buttons.filter(button=>button.attributes.get('aria-pressed')==='true').length,1);
}
env.render(start+hold+blend/2);assert.equal(env.views[1].style.value,'0.5');assert.equal(env.views[0].style.value,'1','the opaque previous view prevents a dark flash');
const halfway=env.views.map(view=>view.style.value);env.render(start+travel);env.render(start+hold+blend/2);assert.deepEqual(env.views.map(view=>view.style.value),halfway,'reverse scroll is deterministic');
assert.equal(env.reads(),reads,'scroll frames do not read layout');
env.render(start+travel);const writes=env.writes();assert.equal(env.render(start+travel+1000),false);assert.equal(env.writes(),writes,'the fourth view is complete before native release, with no idle work');
env.render(start);let moving=env.render(start+900,false);for(let i=0;i<150&&moving;i++)moving=env.render(start+900,false);assert(!moving,'shared follow easing settles');
env.buttons[3].events.click();assert.equal(env.scrolls[0].top,start+3*(hold+blend)+hold/2);assert.equal(env.scrolls[0].behavior,'smooth');assert.equal(env.resets(),1);
env.media.matches=true;env.measure();assert(!env.heights.size&&!env.attributes.has('data-screen-ready'),'reduced motion removes the pinned scroll distance');
env.buttons[1].events.click();env.render(start);assert.equal(env.counter.textContent,'02 / 04');assert.equal(env.scrolls.length,1,'reduced motion buttons change only the display');
env.events.pagehide({persisted:true});assert.equal(env.releases(),0);env.events.pagehide({persisted:false});assert.equal(env.releases(),1);
const loading=fixture({pending:1});loading.near();loading.render(start+hold+blend);assert.equal(loading.views[0].style.value,'1');assert.equal(loading.views[1].style.value,'0','an undecoded image cannot replace the previous screen with a blank');
loading.resolve(1);await Promise.resolve();let catching=loading.render(start+hold+blend);assert(Number(loading.views[1].style.value)>0&&Number(loading.views[1].style.value)<1,'a late image still fades in instead of cutting');for(let i=0;i<150&&catching;i++)catching=loading.render(start+hold+blend);assert.equal(loading.views[1].style.value,'1');assert(!catching&&loading.wakes()>0);
const small=fixture();small.view.innerHeight=500;small.measure();assert(!small.heights.size,'short viewports retain direct controls and ordinary scrolling');
for(const slug of ['emyasa','stone-kuche','parsomen','dor']){
  const html=readFileSync(new URL(`../case-studies/${slug}/index.html`,import.meta.url),'utf8');
  assert.equal((html.match(/class="case-device-shell"/g)||[]).length,1,'one fixed shell per case');
  assert.equal((html.match(/class="case-device-view"/g)||[]).length,4);
  assert.equal((html.match(/data-screen-to=/g)||[]).length,4);
  assert(html.includes('/assets/case-screen-story.js'));
  for(let index=1;index<=4;index++)for(const suffix of ['', '-960']){
    const bytes=readFileSync(new URL(`../assets/cases/mac/${slug}-${index}${suffix}.webp`,import.meta.url));
    assert(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP');
  }
}
console.log('PASS: one fixed Mac, four reading holds, eased screen-only blends, reverse, final release, cached layout, finite settling, image readiness, native controls and reduced motion.');
