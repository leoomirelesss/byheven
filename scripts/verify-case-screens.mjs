import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/case-screen-story.js', import.meta.url), 'utf8');
const clockSource = readFileSync(new URL('../assets/scroll-story.js', import.meta.url), 'utf8');
const settings = vm.runInNewContext(`(${clockSource.match(/Object\.freeze\((\{[^;]+\})\)/)[1]})`);
assert(!/requestAnimationFrame|setTimeout|setInterval/.test(source), 'the sequence has no separate timer or scroll clock');
function fixture({phone = false, pending = -1, frameHeight = phone ? 850 : 911.25, width = 1440, height = 900, sources = false} = {}) {
  let client, reads = 0, writes = 0, wakes = 0, releases = 0;
  const events = {}, attributes = new Map(), heights = new Map(), frameStyles = new Map(), chapterStyles = new Map();
  const media = {matches:false,addEventListener(){},removeEventListener(){}};
  const waits = [], rejects = [], imageEvents = [], labels = phone ? ['Reporte','Inicio'] : ['Inicio','Producto','Servicios','Seguimiento'];
  const views = labels.map((label, index) => ({
    src:`/screen-${index}.webp`,srcset:sources?`/screen-${index}-small.webp 368w, /screen-${index}.webp 736w`:'',
    complete:index !== pending, naturalWidth:index !== pending ? 1924 : 0,
    dataset:{screenLabel:label}, style:{set opacity(value){writes++;this.value=value;}},
    attributes:new Map(),setAttribute(k,v){this.attributes.set(k,v);},
    addEventListener(k,v){(imageEvents[index]??={})[k]=v;},removeEventListener(k){delete imageEvents[index][k];},
    decode(){return new Promise((resolve,reject) => {waits[index] = resolve;rejects[index]=reject;});},
  }));
  const shellEvents={};
  const shell={src:'/shell.webp',srcset:sources?'/shell-small.webp 1200w, /shell.webp 2400w':'',complete:false,naturalWidth:2400,loading:'lazy',addEventListener(k,v){shellEvents[k]=v;},removeEventListener(k){delete shellEvents[k];},decode(){this.decoded=true;return Promise.resolve();}};
  const stage = {get offsetHeight(){reads++;return height;}}, display = {clientWidth:1000,scrollLeft:0,setAttribute(k,v){attributes.set(k,v);},removeAttribute(k){attributes.delete(k);},addEventListener(k,v){events['display:'+k]=v;},removeEventListener(k){delete events['display:'+k];},scrollTo({left}){this.scrollLeft=left;}};
  const frame = {get offsetHeight(){reads++;return frameHeight;},get offsetTop(){reads++;return phone?150:0;},style:{setProperty(k,v){writes++;frameStyles.set(k,v);}}};
  const phones=phone?views.map((image,index)=>({get offsetTop(){reads++;return index?0:126;},querySelector:()=>image,style:{values:new Map(),set opacity(value){writes++;this.opacityValue=value;},setProperty(k,v){writes++;this.values.set(k,v);}}})):[];
  const pin={style:{set height(value){heights.set('pin-height',value);},removeProperty(){heights.delete('pin-height');}}};
  const text = [
    {rows:[[0,24]]}, {rows:[[196,294],[300,406]],boxTop:200,boxBottom:400},
    {rows:[[600,624],[634,658],[668,692]],shift:32},
    {rows:[[940,960]]}, {rows:[[980,1000]]},
  ].map(({rows,shift=0,boxTop=rows[0][0],boxBottom=rows.at(-1)[1]})=>({
    rows,attributes:new Map(),
    style:{setProperty(k,v){writes++;this.values.set(k,v);},removeProperty(k){writes++;this.values.delete(k);},values:new Map()},
    closest:()=>({style:{getPropertyValue:()=>String(shift)}}),setAttribute(k,v){this.attributes.set(k,v);},
    getBoundingClientRect(){reads++;return{top:1000+boxTop+shift-view.scrollY,bottom:1000+boxBottom+shift-view.scrollY,left:100,right:500,width:400,height:boxBottom-boxTop};},
    getClientRects(){reads++;return rows.map(([top,bottom])=>({top:1000+top+shift-view.scrollY,bottom:1000+bottom+shift-view.scrollY,left:98,right:502,width:404,height:bottom-top}));},
  }));
  const overview = {offsetHeight:1200,querySelectorAll:()=>text,getBoundingClientRect(){reads++;return{top:1000-view.scrollY};}};
  const chapter = {querySelector:()=>overview,hasAttribute:()=>width>=900,toggleAttribute(k,v){chapterStyles.set(k,v);},style:{setProperty(k,v){writes++;chapterStyles.set(k,v);}}};
  const story = {
    dataset:{screenProject:'EMYASA'},parentElement:chapter,
    querySelector:selector=>['.case-device','.case-phone-stage'].includes(selector)?stage:['.case-device-frame','.case-phone-pair'].includes(selector)?frame:selector==='.case-phone-pin'?pin:selector==='.case-device-shell'?(phone?null:shell):phone?null:display,
    querySelectorAll:selector=>selector==='.case-app-phone'?phones:selector==='.case-device-view'?(phone?[]:views):[],
    hasAttribute:name=>name==='data-case-phone-story'?phone:attributes.has(name),
    toggleAttribute(k,on){if(on)attributes.set(k,true);else attributes.delete(k);},
    style:{set height(value){heights.set('height',value);},set paddingBottom(value){heights.set('padding-bottom',value);},removeProperty:k=>heights.delete(k)},
    getBoundingClientRect(){reads++;return{top:3000-view.scrollY};},
  };
  const clock = {
    settings,
    approach:(value,target,dt,immediate)=>immediate||Math.abs(target-value)<.0001?target:value+(target-value)*(1-Math.exp(-dt/settings.followEase)),
    subscribe(value){client=value;return()=>releases++;},invalidate(){client.measure();},wake(){wakes++;},
  };
  const view = {HevenMotion:clock,innerWidth:width,innerHeight:height,scrollY:0,matchMedia:()=>media,addEventListener:(k,v)=>{events[k]=v;},IntersectionObserver:class{}};
  let near;
  let selected;
  vm.runInNewContext(source,{
    window:view,document:{querySelector:()=>story,createRange:()=>({selectNodeContents:element=>{selected=element;},getClientRects:()=>selected.getClientRects()})},ResizeObserver:class{observe(){}disconnect(){}},
    IntersectionObserver:class{constructor(callback){near=callback;}observe(){}disconnect(){}},
  });
  client.measure();
  return {views,phones,events,view,media,attributes,heights,display,shell,frameStyles,chapterStyles,text,story,
    measure:()=>client.measure(),render:(y,immediate=true,dt=16.67)=>client.render({y,dt,immediate}),
    near:()=>near([{isIntersecting:true}]),resolve:index=>{views[index].naturalWidth=1924;waits[index]?.();},
    reject:index=>rejects[index]?.(new Error('source changed or request failed')),load:index=>{views[index].naturalWidth=1924;imageEvents[index]?.load?.();},
    fail:index=>{views[index].naturalWidth=0;imageEvents[index]?.error?.();},
    failShell:()=>{shell.naturalWidth=0;shellEvents.error?.();},loadShell:()=>{shell.naturalWidth=2400;shellEvents.load?.();},
    reads:()=>reads,writes:()=>writes,wakes:()=>wakes,releases:()=>releases};
}
const hold=468, arrivalDistance=216, blend=arrivalDistance*1.2, travel=hold*4+blend*3, start=3000;
const lead=Math.min(hold*.3,blend*.65);
const env=fixture();assert.equal(env.heights.get('height'),`${900+travel}px`);
const reads=env.reads();
for(const block of env.text){
  const [x,y]=block.style.values.get('--case-line-mask-position').split(' ').map(parseFloat);
  const [width,height]=block.style.values.get('--case-line-mask-size').split(' ').map(parseFloat);
  assert(x<-2&&width>404,'the paint surface includes horizontal glyph overhang');
  assert(y<0&&height>0,'accents have room above the box');
}
const [inkX,inkY]=env.text[1].style.values.get('--case-line-mask-position').split(' ').map(parseFloat);
const [inkWidth,inkHeight]=env.text[1].style.values.get('--case-line-mask-size').split(' ').map(parseFloat);
assert(inkY<-4&&inkY+inkHeight>206,'the mask covers glyph ascenders above and descenders below a tight heading box');
assert(inkX+inkWidth>402,'the final character also keeps its right overhang');
const center=(900-911.25)/2;
const macTop=center*2+80+911.25*71/1500;
const textBottom=900-1200-24+1000, fadeEnd=start+macTop-textBottom;
const fadeDistance=arrivalDistance*.65;
const alphas=block=>[...block.style.values.get('--case-line-mask').matchAll(/rgba\(0,0,0,([\d.]+)\)/g)].filter((_,index)=>index%2===0).map(match=>Number(match[1]));
env.render(fadeEnd-fadeDistance);assert(env.text.every(block=>alphas(block).every(alpha=>alpha===1)),'copy remains fully visible before the Mac approaches');
env.render(fadeEnd-fadeDistance/2);assert.equal(alphas(env.text[4])[0],.5,'the bottom row fades first');
assert(alphas(env.text[3])[0]>.9&&alphas(env.text[2]).every(alpha=>alpha===1),'higher rows remain legible while the lowest row fades');
env.render(fadeEnd);assert.equal(alphas(env.text[4])[0],0,'the bottom row is gone when the Mac reaches it');
env.render(fadeEnd-fadeDistance/2);assert.equal(alphas(env.text[4])[0],.5,'reverse scroll restores the same line fade');
const paragraphEnd=start+macTop-(900-1200-24+692);
env.render(paragraphEnd-fadeDistance/2);const paragraph=alphas(env.text[2]);
assert(paragraph[0]>paragraph[1]&&paragraph[1]>paragraph[2]&&paragraph[2]===.5,'wrapped paragraph lines fade with distinct bottom-to-top phases, independent of entrance transforms');
const paragraphMask=env.text[2].style.values.get('--case-line-mask');env.render(start+travel);env.render(paragraphEnd-fadeDistance/2);assert.equal(env.text[2].style.values.get('--case-line-mask'),paragraphMask,'each mask reverses exactly');
assert(!env.chapterStyles.has('--case-overview-opacity'),'the entire section and its background never fade as a group');
assert(!env.chapterStyles.has('--case-overview-rise'),'the original pinned overview never moves');
env.render(start);
assert.equal(center+parseFloat(env.frameStyles.get('--case-device-y'))+911.25,980,'the Mac moves down 32px without changing its dimensions');
env.render(start+hold*.75);
assert.equal(center+parseFloat(env.frameStyles.get('--case-device-y'))+911.25,916,'the base rests just beyond the lower fold at the marked position');
assert(center+parseFloat(env.frameStyles.get('--case-device-y'))+911.25*71/1500>=47,'the top of the hardware remains visible too');
const settledMasks=env.text.map(block=>block.style.values.get('--case-line-mask'));
env.render(start+hold*.9);assert.deepEqual(env.text.map(block=>block.style.values.get('--case-line-mask')),settledMasks,'text stays calibrated to the actual Mac edge during the stationary reading hold');
env.render(start);assert.equal(center+parseFloat(env.frameStyles.get('--case-device-y'))+911.25,980,'reversing the scroll restores the entry pose');
for(let index=0;index<4;index++){
  const y=start+index*(hold+blend)+(index?lead:0)+hold*.4;env.render(y);
  assert(env.attributes.get('aria-label').includes(`pantalla ${index+1} de 4`));
  assert.equal(env.views[index].style.value,'1');
  const pose=env.views.map(view=>view.style.value);env.render(y+hold*.1);assert.deepEqual(env.views.map(view=>view.style.value),pose,'each screen has a real reading hold');
}
env.render(start+hold+lead);assert(Number(env.views[1].style.value)<1e-12,'the first screen has a longer stable reading window after its rise');
env.render(start+hold+lead+blend/2);assert(Math.abs(Number(env.views[1].style.value)-.5)<1e-12);assert.equal(env.views[0].style.value,'1','the opaque previous view prevents a dark flash');
const halfway=env.views.map(view=>view.style.value);env.render(start+travel);env.render(start+hold+lead+blend/2);assert.deepEqual(env.views.map(view=>view.style.value),halfway,'reverse scroll is deterministic');
assert.equal(env.reads(),reads,'scroll frames do not read layout');
env.render(start+travel+1000);const writes=env.writes();assert.equal(env.render(start+travel+1000),false);assert.equal(env.writes(),writes,'the fourth view is complete before native release, with no idle work');
env.render(start);let moving=env.render(start+900,false);for(let i=0;i<150&&moving;i++)moving=env.render(start+900,false);assert(!moving,'shared follow easing settles');
env.media.matches=true;env.measure();assert(!env.heights.size&&!env.attributes.has('data-screen-ready'),'reduced motion removes the pinned scroll distance');
env.render(start);assert(env.views.every(view=>view.style.value==='1'),'all four screens remain available through native horizontal scroll');assert.equal(env.frameStyles.get('--case-device-y'),'0px');assert(env.text.every(block=>!block.style.values.has('--case-line-mask')),'reduced motion removes every line mask and keeps the original text visible');
assert.equal(env.attributes.get('role'),'region');assert.equal(env.attributes.get('tabindex'),'0');assert(env.views.every(view=>view.alt&&view.attributes.get('aria-hidden')==='false'));
for(const [key,expected] of [['ArrowRight',1000],['End',3000],['ArrowRight',3000],['ArrowLeft',2000],['Home',0],['ArrowLeft',0]]){
  let prevented=false;env.events['display:keydown']({key,preventDefault(){prevented=true;}});assert(prevented);assert.equal(env.display.scrollLeft,expected,'the native gallery supports keyboard navigation and bounded endpoints');
}
env.media.matches=false;env.measure();env.render(start);assert.equal(env.display.scrollLeft,0);assert.equal(env.attributes.get('role'),'img');assert(!env.attributes.has('tabindex'));assert.equal(env.views[3].style.value,'0','restoring motion cannot leave stale native-gallery opacities');
env.events.pagehide({persisted:true});assert.equal(env.releases(),0);env.events.pagehide({persisted:false});assert.equal(env.releases(),1);
const loading=fixture({pending:1});loading.near();assert.equal(loading.shell.loading,'eager');assert(loading.shell.decoded,'the hardware is warmed alongside the four displays');loading.render(start+hold+lead+blend);assert.equal(loading.views[0].style.value,'1');assert.equal(loading.views[1].style.value,'0','an undecoded image cannot replace the previous screen with a blank');
loading.resolve(1);await Promise.resolve();let catching=loading.render(start+hold+lead+blend);assert(Number(loading.views[1].style.value)>0&&Number(loading.views[1].style.value)<1,'a late image still fades in instead of cutting');for(let i=0;i<150&&catching;i++)catching=loading.render(start+hold+lead+blend);assert(Math.abs(Number(loading.views[1].style.value)-1)<1e-12);assert(!catching&&loading.wakes()>0);
const small=fixture();small.view.innerHeight=500;small.measure();assert(!small.heights.size,'short viewports retain the static photo and ordinary scrolling');
for(const options of [{width:390,frameHeight:229},{width:1100,frameHeight:640}]){
  const portrait=fixture(options);portrait.render(start);assert.equal(portrait.frameStyles.get('--case-device-y'),'0px','shorter Macs keep a centered native composition');
}
// Real two-phone controller: lower/left first, upper/right second, pause, native tail.
const app=fixture({phone:true}), rise=810, gap=24, appStart=start-810, release=start+rise*2+gap+hold-810;
const shifts=()=>app.phones.map(phone=>Number(parseFloat(phone.style.values.get('--case-phone-y')).toFixed(6)));
assert.equal(app.heights.get('pin-height'),`${900+release-start}px`);
assert.equal(app.heights.get('padding-bottom'),'148px','the tail reserves the complete phones after the pin ends');
const appReads=app.reads();
app.render(appStart);assert.deepEqual(shifts(),[720,990]);
app.render(appStart+rise/2);assert.deepEqual(shifts(),[360,990],'only the lower phone rises first');
app.render(appStart+rise);assert.deepEqual(shifts(),[0,990],'the lower phone settles before the upper one starts');
app.render(appStart+rise+gap+rise/2);assert.deepEqual(shifts(),[0,495],'the higher phone rises second');
const appHalf=shifts();app.render(release);app.render(appStart+rise+gap+rise/2);assert.deepEqual(shifts(),appHalf,'both entrances reverse exactly');
app.render(appStart+rise*2+gap);assert.deepEqual(shifts(),[0,0]);
app.render(release-1);assert.deepEqual(shifts(),[0,0],'the composition has a full reading hold before release');
app.render(release+100);assert.deepEqual(shifts(),[0,0],'after release only native page movement remains');
assert(150-100>=0&&150+850-100<=900,'the reserved native tail reveals both entire phones in the viewport');
assert.equal(app.reads(),appReads,'phone scroll frames never measure layout');
app.render(release+1000);const appWrites=app.writes();assert.equal(app.render(release+1500),false);assert.equal(app.writes(),appWrites,'phone rendering sleeps at rest');
app.render(appStart);let phoneMoving=app.render(appStart+rise/2,false);for(let i=0;i<150&&phoneMoving;i++)phoneMoving=app.render(appStart+rise/2,false);assert(!phoneMoving,'phone follow easing settles');
app.media.matches=true;app.measure();app.render(release);assert(!app.heights.size&&!app.attributes.has('data-phone-ready'));assert.deepEqual(shifts(),[0,0],'reduced motion shows the complete static composition');
const mobile=fixture({phone:true,width:390});mobile.render(start);assert(!mobile.heights.size&&!mobile.attributes.has('data-phone-ready'),'small screens keep ordinary scrolling');
const lateApp=fixture({phone:true,pending:1});lateApp.near();lateApp.render(release);assert.deepEqual(lateApp.phones.map(phone=>Number(parseFloat(phone.style.values.get('--case-phone-y')).toFixed(6))),[0,1022],'one pending phone never blocks the ready phone');
assert.equal(lateApp.phones[1].style.opacityValue,'0','the undecoded phone cannot flash into view');
lateApp.reject(1);await Promise.resolve();await Promise.resolve();lateApp.load(1);let lateMoving=lateApp.render(release);assert(lateMoving,'a load event recovers after decode rejection');
assert(parseFloat(lateApp.phones[1].style.values.get('--case-phone-y'))>0&&parseFloat(lateApp.phones[1].style.values.get('--case-phone-y'))<settings.arrivalShift,'a late phone uses a short arrival rather than racing through a full missed rise');
assert(Number(lateApp.phones[1].style.opacityValue)>0&&Number(lateApp.phones[1].style.opacityValue)<1,'late images fade in even during wheel frames');
for(let i=0;i<150&&lateMoving;i++)lateMoving=lateApp.render(release);assert(!lateMoving&&lateApp.wakes()>0);assert.equal(lateApp.phones[1].style.opacityValue,'1');
const failedApp=fixture({phone:true,pending:1});failedApp.near();failedApp.fail(1);failedApp.render(release);
assert(failedApp.phones[1].hidden&&!failedApp.story.hidden,'one broken phone is hidden while the valid phone remains');
assert.equal(parseFloat(failedApp.phones[0].style.values.get('--case-phone-y')),0);
failedApp.fail(0);assert(failedApp.story.hidden&&!failedApp.heights.size,'two failed images skip the empty pin instead of holding the reader');
failedApp.load(1);assert(!failedApp.story.hidden&&!failedApp.phones[1].hidden,'a recovered source restores its story');
const failedFirst=fixture();failedFirst.near();failedFirst.fail(0);failedFirst.render(start);
assert.equal(failedFirst.views[1].style.value,'1','a failed first screen falls back to the next valid view without a blank display');
const pendingFirst=fixture({pending:0});pendingFirst.render(start);assert.equal(pendingFirst.views[1].style.value,'1','a loading first screen also keeps another decoded view visible');
const nativeFailure=fixture({width:390});nativeFailure.near();nativeFailure.fail(1);assert(nativeFailure.views[1].hidden);assert(nativeFailure.attributes.get('aria-label').includes('3 vistas'),'native access counts only valid views');
nativeFailure.events['display:keydown']({key:'End',preventDefault(){}});assert.equal(nativeFailure.display.scrollLeft,2000,'keyboard navigation skips a failed view');
const retry=fixture({phone:true,pending:1,sources:true});retry.near();retry.fail(1);assert.equal(retry.views[1].src,'/screen-1-small.webp');assert.equal(retry.views[1].srcset,'');assert(!retry.phones[1].hidden,'the existing alternate resolution is attempted before hiding a phone');
retry.load(1);retry.render(release);assert(Number(retry.phones[1].style.opacityValue)>0,'successful fallback media enters normally');
const cachedFailure=fixture({pending:1,sources:true});cachedFailure.views[1].complete=true;cachedFailure.near();cachedFailure.reject(1);await Promise.resolve();await Promise.resolve();assert.equal(cachedFailure.views[1].src,'/screen-1-small.webp','a source that failed before listeners were attached still retries through decode rejection');
const failedRetry=fixture({phone:true,sources:true});failedRetry.near();failedRetry.fail(1);failedRetry.fail(1);assert(failedRetry.phones[1].hidden,'only one alternate request is made before degrading gracefully');
const failedShell=fixture({sources:true});failedShell.near();failedShell.failShell();assert.equal(failedShell.shell.src,'/shell-small.webp');failedShell.failShell();assert(failedShell.shell.hidden&&!failedShell.attributes.has('data-screen-ready'),'a broken shell falls back to the accessible screen gallery');assert(failedShell.chapterStyles.get('data-device-static'),'failed shell media also releases the sticky overview');
failedShell.loadShell();assert(!failedShell.shell.hidden&&failedShell.attributes.has('data-screen-ready'),'recovered shell media restores the sequence');
const speed=fixture({phone:true});const middle=appStart+rise+gap+rise/2;
speed.render(middle-.5);const before=parseFloat(speed.phones[1].style.values.get('--case-phone-y'));speed.render(middle+.5);const after=parseFloat(speed.phones[1].style.values.get('--case-phone-y'));
assert(before-after<(.55*990*1.875/522),'the upper phone peak displacement per scroll pixel is materially gentler than the previous short quintic rise');
const rates=[60,120].map(hz=>{
  const scene=fixture({phone:true});scene.render(appStart);
  for(let index=0;index<hz/4;index++)scene.render(appStart+rise/2,false,1000/hz);
  return parseFloat(scene.phones[0].style.values.get('--case-phone-y'));
});assert(Math.abs(rates[0]-rates[1])<1e-8,'shared time-based easing has the same pose after 250ms at 60 and 120Hz');
for(const [height,width,frameHeight] of [[768,1366,773],[1080,1920,1008]]){
  const sized=fixture({height,width,frameHeight});const h=Math.max(320,Math.min(600,height*.52)),b=Math.min(240,Math.max(140,height*.24))*1.2;
  assert.equal(sized.heights.get('height'),`${height+h*4+b*3}px`,'responsive rhythm gives the display blends more breathing room');
  sized.render(start+h*4+b*3);assert.equal(sized.views[3].style.value,'1','every viewport reaches the final screen before release');
}
for(const [slug,names] of [['dor-os',['dor-os-report','dor-os-home']],['academic-quest',['academic-quest-planner','academic-quest-campus']]]){
  const html=readFileSync(new URL(`../case-studies/${slug}/index.html`,import.meta.url),'utf8');
  assert(html.includes('data-case-phone-story')&&html.includes('data-case-showcase-story'));
  assert.equal((html.match(/class="case-app-phone(?: case-app-phone--lower)?"/g)||[]).length,2);
  assert(!html.includes('data-case-screen-story')&&!html.includes('data-screen-to='));
  assert(html.indexOf(`apps/${names[0]}.webp`)<html.indexOf(`apps/${names[1]}.webp`),'phone order matches the supplied reference');
  for(const name of names)for(const suffix of ['','-368']){
    const bytes=readFileSync(new URL(`../assets/cases/apps/${name}${suffix}.webp`,import.meta.url));
    assert(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP');
  }
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
assert(css.includes('mask-image: var(--case-line-mask, none)')&&!css.includes('--case-overview-opacity')&&!css.includes('--case-overview-rise'),'the original curtain overlap fades only actual text lines');
assert(css.includes('mask-clip: no-clip')&&css.includes('mask-size: var(--case-line-mask-size')&&css.includes('mask-position: var(--case-line-mask-position'),'mask painting extends beyond tight text boxes without changing layout');
assert(css.includes('.case-phone-story { position: relative; z-index: 2; background: transparent; }'));
console.log('PASS: gentler sequential phone rise and Mac settling/blends, short late-media arrival, bounded source fallback, available-view keyboard access, shell recovery, reverse, responsive endpoints, moving-front line fades, shared 60/120Hz timing, cached layout and finite settling.');
