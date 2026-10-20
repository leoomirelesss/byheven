import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/case-screen-story.js', import.meta.url), 'utf8');
assert(!/requestAnimationFrame|setTimeout|setInterval/.test(source), 'the sequence has no separate timer or scroll clock');
function fixture({pending = -1, frameHeight = 911.25, width = 1440} = {}) {
  let client, reads = 0, writes = 0, wakes = 0, releases = 0;
  const events = {}, attributes = new Map(), heights = new Map(), frameStyles = new Map(), chapterStyles = new Map();
  const media = {matches:false,addEventListener(){},removeEventListener(){}};
  const waits = [], labels = ['Inicio','Producto','Servicios','Seguimiento'];
  const views = labels.map((label, index) => ({
    complete:index !== pending, naturalWidth:index !== pending ? 1924 : 0,
    dataset:{screenLabel:label}, style:{set opacity(value){writes++;this.value=value;}},
    decode(){return new Promise(resolve => {waits[index] = resolve;});},
  }));
  const stage = {get offsetHeight(){reads++;return 900;}}, display = {setAttribute(k,v){attributes.set(k,v);}};
  const frame = {get offsetHeight(){reads++;return frameHeight;},style:{setProperty(k,v){writes++;frameStyles.set(k,v);}}};
  const copy = {getBoundingClientRect(){reads++;return{bottom:2000-view.scrollY};}};
  const overview = {offsetHeight:1200,querySelector:()=>copy,getBoundingClientRect(){reads++;return{top:1000-view.scrollY};}};
  const chapter = {querySelector:()=>overview,hasAttribute:()=>width>=900,style:{setProperty(k,v){writes++;chapterStyles.set(k,v);}}};
  const story = {
    dataset:{screenProject:'EMYASA'},parentElement:chapter,
    querySelector:selector=>selector==='.case-device'?stage:selector==='.case-device-frame'?frame:display,
    querySelectorAll:()=>views,
    toggleAttribute(k,on){if(on)attributes.set(k,true);else attributes.delete(k);},
    style:{set height(value){heights.set('height',value);},removeProperty:k=>heights.delete(k)},
    getBoundingClientRect(){reads++;return{top:3000-view.scrollY};},
  };
  const clock = {
    settings:{arrivalMin:140,arrivalMax:240,arrivalDistance:.24},
    approach:(value,target,dt,immediate)=>immediate||Math.abs(target-value)<.0001?target:value+(target-value)*(1-Math.exp(-dt/70)),
    subscribe(value){client=value;return()=>releases++;},invalidate(){client.measure();},wake(){wakes++;},
  };
  const view = {HevenMotion:clock,innerWidth:width,innerHeight:900,scrollY:0,matchMedia:()=>media,addEventListener:(k,v)=>{events[k]=v;},IntersectionObserver:class{}};
  let near;
  vm.runInNewContext(source,{
    window:view,document:{querySelector:()=>story},ResizeObserver:class{observe(){}disconnect(){}},
    IntersectionObserver:class{constructor(callback){near=callback;}observe(){}disconnect(){}},
  });
  client.measure();
  return {views,events,view,media,attributes,heights,display,frameStyles,chapterStyles,
    measure:()=>client.measure(),render:(y,immediate=true)=>client.render({y,dt:16.67,immediate}),
    near:()=>near([{isIntersecting:true}]),resolve:index=>{views[index].naturalWidth=1924;waits[index]?.();},
    reads:()=>reads,writes:()=>writes,wakes:()=>wakes,releases:()=>releases};
}
const hold=468, blend=216, travel=hold*4+blend*3, start=3000;
const env=fixture();assert.equal(env.heights.get('height'),`${900+travel}px`);
const reads=env.reads();
const center=(900-911.25)/2;
const macTop=center*2+80+911.25*71/1500;
const textBottom=900-1200-24+1000, fadeEnd=start+macTop-textBottom;
env.render(fadeEnd-blend);assert.equal(env.chapterStyles.get('--case-overview-opacity'),'1','copy remains fully visible before the Mac approaches');
env.render(fadeEnd-blend/2);assert(Math.abs(Number(env.chapterStyles.get('--case-overview-opacity'))-.5)<1e-10,'the sticky text fades gradually across the shared arrival distance');
env.render(fadeEnd);assert.equal(env.chapterStyles.get('--case-overview-opacity'),'0','the copy is invisible when the Mac reaches the last line');
env.render(fadeEnd-blend/2);assert(Math.abs(Number(env.chapterStyles.get('--case-overview-opacity'))-.5)<1e-10,'reverse scroll restores the same fade');
assert(!env.chapterStyles.has('--case-overview-rise'),'the original pinned overview never moves');
env.render(start);
assert.equal(center+parseFloat(env.frameStyles.get('--case-device-y'))+911.25,980,'the Mac moves down 32px without changing its dimensions');
env.render(start+hold*.55);
assert.equal(center+parseFloat(env.frameStyles.get('--case-device-y'))+911.25,916,'the base rests just beyond the lower fold at the marked position');
assert(center+parseFloat(env.frameStyles.get('--case-device-y'))+911.25*71/1500>=47,'the top of the hardware remains visible too');
env.render(start);assert.equal(center+parseFloat(env.frameStyles.get('--case-device-y'))+911.25,980,'reversing the scroll restores the entry pose');
for(let index=0;index<4;index++){
  const y=start+index*(hold+blend)+hold/2;env.render(y);
  assert(env.attributes.get('aria-label').includes(`pantalla ${index+1} de 4`));
  assert.equal(env.views[index].style.value,'1');
  const pose=env.views.map(view=>view.style.value);env.render(y+hold*.1);assert.deepEqual(env.views.map(view=>view.style.value),pose,'each screen has a real reading hold');
}
env.render(start+hold+blend/2);assert.equal(env.views[1].style.value,'0.5');assert.equal(env.views[0].style.value,'1','the opaque previous view prevents a dark flash');
const halfway=env.views.map(view=>view.style.value);env.render(start+travel);env.render(start+hold+blend/2);assert.deepEqual(env.views.map(view=>view.style.value),halfway,'reverse scroll is deterministic');
assert.equal(env.reads(),reads,'scroll frames do not read layout');
env.render(start+travel);const writes=env.writes();assert.equal(env.render(start+travel+1000),false);assert.equal(env.writes(),writes,'the fourth view is complete before native release, with no idle work');
env.render(start);let moving=env.render(start+900,false);for(let i=0;i<150&&moving;i++)moving=env.render(start+900,false);assert(!moving,'shared follow easing settles');
env.media.matches=true;env.measure();assert(!env.heights.size&&!env.attributes.has('data-screen-ready'),'reduced motion removes the pinned scroll distance');
env.render(start);assert.equal(env.views[0].style.value,'1');assert.equal(env.views[3].style.value,'0');assert.equal(env.frameStyles.get('--case-device-y'),'0px');assert.equal(env.chapterStyles.get('--case-overview-opacity'),'1','reduced motion keeps all copy visible in ordinary document flow');
env.events.pagehide({persisted:true});assert.equal(env.releases(),0);env.events.pagehide({persisted:false});assert.equal(env.releases(),1);
const loading=fixture({pending:1});loading.near();loading.render(start+hold+blend);assert.equal(loading.views[0].style.value,'1');assert.equal(loading.views[1].style.value,'0','an undecoded image cannot replace the previous screen with a blank');
loading.resolve(1);await Promise.resolve();let catching=loading.render(start+hold+blend);assert(Number(loading.views[1].style.value)>0&&Number(loading.views[1].style.value)<1,'a late image still fades in instead of cutting');for(let i=0;i<150&&catching;i++)catching=loading.render(start+hold+blend);assert.equal(loading.views[1].style.value,'1');assert(!catching&&loading.wakes()>0);
const small=fixture();small.view.innerHeight=500;small.measure();assert(!small.heights.size,'short viewports retain the static photo and ordinary scrolling');
for(const options of [{width:390,frameHeight:229},{width:1100,frameHeight:640}]){
  const portrait=fixture(options);portrait.render(start);assert.equal(portrait.frameStyles.get('--case-device-y'),'0px','shorter Macs keep a centered native composition');
}
for(const slug of ['emyasa','stone-kuche','parsomen','dor']){
  const html=readFileSync(new URL(`../case-studies/${slug}/index.html`,import.meta.url),'utf8');
  assert.equal((html.match(/class="case-device-shell"/g)||[]).length,1,'one fixed shell per case');
  assert.equal((html.match(/class="case-device-view"/g)||[]).length,4);
  assert(!/case-screen-nav|case-screen-counter|data-screen-to=/.test(html),'no visible pagination or counter remains');
  assert(html.includes('/assets/case-screen-story.js'));
  for(let index=1;index<=4;index++)for(const suffix of ['', '-960']){
    const bytes=readFileSync(new URL(`../assets/cases/mac/${slug}-${index}${suffix}.webp`,import.meta.url));
    assert(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP');
  }
}
const css=readFileSync(new URL('../assets/case-detail.css',import.meta.url),'utf8');
for(const selector of ['.case-screen-story','.case-showcase.case-device']){
  const rule=css.slice(css.indexOf('\n'+selector+' {')).split('}')[0];
  assert(rule.includes('background: transparent;'),'the existing page atmosphere remains visible');
}
assert(!/case-screen-nav|case-screen-controls|case-screen-counter|padding-bottom: 116px/.test(css));
assert(css.includes('opacity: var(--case-overview-opacity, 1)')&&!css.includes('--case-overview-rise'),'the original curtain overlap uses only a subtle opacity fade');
console.log('PASS: original curtain overlap, contact-based reversible text fade, unchanged Mac size shifted down 32px, transparent stage, no pagination, four reading holds and blends, native release, cached layout, finite settling, image readiness and reduced motion.');
