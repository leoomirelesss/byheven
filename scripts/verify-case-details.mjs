import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import vm from 'node:vm';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const slugs = ['emyasa','stone-kuche','parsomen','dor','dor-os','academic-quest'];
const footer = page => page.slice(page.indexOf('  <div class="sticky-footer-wrapper">'),page.lastIndexOf('</body>')).replaceAll('href="/#','href="#').trim();
for (const [index, slug] of slugs.entries()) {
  const html = read(`case-studies/${slug}/index.html`);
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  assert(/<h1[^>]+aria-label="[^"]+"/.test(html),'one semantic project name labels the visual ticker');
  assert(html.includes('case-hero-ticker" aria-hidden="true"'),'decorative repeats are not announced');
  assert(html.includes(`/case-studies/${slugs[(index+1)%slugs.length]}/`),'all six cases form a complete navigation cycle');
  assert(!html.includes('/#process'));
  assert.equal(footer(html),footer(read('index.html')),'every detail page uses the home footer');
  for(const [,path] of html.matchAll(/(?:src|href)="(\/assets\/[^"#]+)"/g)){
    const file=new URL(`..${path}`,import.meta.url);assert(existsSync(file),path);
    if(path.endsWith('.webp')){const bytes=readFileSync(file);assert(bytes.length>32&&bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP','valid supplied image: '+path);}
  }
  assert(html.includes('/assets/scroll-story.js')&&html.includes('/assets/chapter-arrivals.js'));
}

// Real hero controller: reversible positions, no per-frame geometry and native reduced motion.
{
  let client, reads=0, writes=0, unsubscribed=0, disconnected=0;
  const data=new Map(), classes=new Set(), events={};
  const media={matches:false,addEventListener(){},removeEventListener(){}};
  const hero={offsetHeight:1000,clientWidth:1400,querySelector:()=>({classList:{add:name=>classes.add(name)}}),
    getBoundingClientRect(){reads++;return{top:0};},style:{setProperty(k,v){writes++;data.set(k,v);}}};
  const clock={subscribe(value){client=value;return()=>{unsubscribed++;};},invalidate(){client.measure();}};
  vm.runInNewContext(read('assets/case-detail.js'),{
    document:{querySelector:()=>hero},window:{HevenMotion:clock,scrollY:0,matchMedia:()=>media,addEventListener:(name,fn)=>{events[name]=fn;}},
    ResizeObserver:class{observe(){}disconnect(){disconnected++;}},
  });
  client.measure();const initialReads=reads;
  client.render({y:500});assert.equal(data.get('--case-hero-y'),'60px');assert.equal(data.get('--case-title-x'),'112px');
  client.render({y:250});assert.equal(data.get('--case-hero-y'),'30px');
  client.render({y:2000});const settledWrites=writes;client.render({y:3000});assert.equal(writes,settledWrites,'endpoints do no extra work');
  client.render({y:0});assert.equal(data.get('--case-title-x'),'0px');assert(classes.has('is-dismissed'),'cue stays dismissed after returning to the top');
  assert.equal(reads,initialReads,'scroll frames use cached hero geometry');
  media.matches=true;client.measure();client.render({y:500});assert.equal(data.get('--case-hero-y'),'0px');
  events.pagehide({persisted:true});assert.equal(unsubscribed,0);
  events.pagehide({persisted:false});assert.equal(unsubscribed,1);assert.equal(disconnected,1);
}

// Exercise the same click controller with and without native transition APIs.
function navigation({native=false,reduced=false,entry=null,blockedStorage=false,start='https://example.com/case-studies/',loading=false,canAnimate=true}={}) {
  const documentEvents={},windowEvents={},classes=new Set(),assigned=[],animations=[],children=[];
  let saved=entry, scrolled=0, resets=0;
  const location=new URL(start);location.assign=url=>assigned.push(url);
  const classList={add:(...names)=>names.forEach(n=>classes.add(n)),remove:(...names)=>names.forEach(n=>classes.delete(n)),contains:n=>classes.has(n)};
  const animate=(target,frames,options)=>{
    let finish;const finished=new Promise(resolve=>{finish=resolve;});
    const effect={target,frames,options,finished,done:false,canceled:false,finish(){effect.done=true;finish();},cancel(){effect.canceled=true;effect.finish();}};
    animations.push(effect);return effect;
  };
  const curtain={style:{},setAttribute(){},animate:(frames,options)=>animate('curtain',frames,options)};
  const main={animate:(frames,options)=>animate('main',frames,options)};
  const root={classList,...(canAnimate?{animate(){}}:{})};
  const window={HevenMotion:{reset(){resets++;}},matchMedia:()=>({matches:reduced}),addEventListener:(name,fn)=>{windowEvents[name]=fn;}};
  if(native)Object.assign(window,{CSSViewTransitionRule:class{},onpageswap:null,onpagereveal:null});
  vm.runInNewContext(read('assets/page-transitions.js'),{
    window,location,URL,setTimeout:()=>0,
    sessionStorage:{getItem(){if(blockedStorage)throw Error('denied');return saved;},removeItem(){saved=null;},setItem(_,v){if(blockedStorage)throw Error('denied');saved=v;}},
    document:{readyState:loading?'loading':'complete',documentElement:root,createElement:()=>curtain,body:{append:element=>children.push(element)},
      querySelector:selector=>selector==='main'?main:selector==='[data-case-hero] img'?{decode:()=>Promise.resolve()}:null,
      getElementById:id=>['work','services','faq','inicio','contact'].includes(id)?{scrollIntoView(){scrolled++;}}:null,
      addEventListener:(name,fn)=>{documentEvents[name]=fn;}},
  });
  const click=(href,overrides={},attributes={})=>{
    const link={href:new URL(href,location.href).href,target:attributes.target||'',hasAttribute:name=>!!attributes[name],closest:()=>attributes.studio?{}:null};
    const event={target:{closest:()=>link},button:0,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},...overrides};
    return{event,done:documentEvents.click?.(event)};
  };
  return{click,assigned,classes,documentEvents,windowEvents,animations,children,location,
    finish:()=>animations.filter(a=>a.target==='curtain'&&!a.done).at(-1)?.finish(),saved:()=>saved,scrolled:()=>scrolled,resets:()=>resets};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
for(const [href,event,attributes] of [
  ['/case-studies/emyasa/',{ctrlKey:true},{}],
  ['/case-studies/emyasa/',{}, {target:'_blank'}],
  ['/case-studies/emyasa/',{}, {download:true}],
  ['#grid',{},{}],
  ['https://outside.example/',{},{}],
  ['mailto:hello@example.com',{},{}],
])assert(!navigation().click(href,event,attributes).event.defaultPrevented,'modified/external/hash/download links stay native');
assert(!navigation({reduced:true}).click('/case-studies/emyasa/').event.defaultPrevented);
assert(!navigation({canAnimate:false}).documentEvents.click,'no animation support keeps ordinary navigation');
for(const native of [false,true])for(const blockedStorage of [false,true]){
  for(const [source,start,href] of [
    ['carousel','https://example.com/','/case-studies/emyasa/'],
    ['menu','https://example.com/case-studies/emyasa/','/#services'],
    ['footer','https://example.com/case-studies/','/#work'],
    ['all-cases','https://example.com/case-studies/emyasa/','/case-studies/'],
    ['slashless','https://example.com/','/case-studies'],
  ]){
    const env=navigation({native,blockedStorage,start});const pending=env.click(href,{}, {studio:source==='menu'||source==='footer'});
    assert(pending.event.defaultPrevented,source+' starts the same transition in every browser');
    assert.equal(env.assigned.length,0);assert(env.classes.has('is-page-leaving'));
    env.finish();await pending.done;assert.equal(env.assigned[0],new URL(href,start).href);
    if(!blockedStorage)assert.equal(env.saved(),env.assigned[0],'entry flag identifies the exact destination including its hash');
    env.windowEvents.pageshow({persisted:true});assert(!env.classes.size,'back/forward removes all transient layers');
  }
}
// Studio anchors on the home use the same curtain while keeping one-page navigation.
for(const native of [false,true]){
  const env=navigation({native,start:'https://example.com/'});const pending=env.click('#services',{}, {studio:true});
  assert(pending.event.defaultPrevented);env.finish();await flush();
  assert.equal(env.scrolled(),1);assert.equal(env.resets(),1);assert.equal(env.location.hash,'#services');assert.equal(env.assigned.length,0);
  env.finish();await pending.done;assert(!env.classes.size);
}
// A restored page cannot finish an older departure over a newer navigation.
{
  const env=navigation();const old=env.click('/case-studies/emyasa/');
  env.windowEvents.pageshow({persisted:true});const next=env.click('/case-studies/dor/');
  await old.done;assert.equal(env.assigned.length,0);env.finish();await next.done;assert.equal(env.assigned.length,1);assert(env.assigned[0].endsWith('/dor/'));
}
{
  const url='https://example.com/case-studies/emyasa/';
  const env=navigation({start:url,entry:url,loading:true});
  assert(env.classes.has('is-page-entering'));assert.equal(env.children.length,0,'head bootstrap covers the page before body parsing');
  env.documentEvents.DOMContentLoaded();await flush();assert.equal(env.children.length,1);
  env.windowEvents.pageshow({persisted:false});assert(env.classes.has('is-page-leaving'),'initial pageshow does not cancel entry');
  env.finish();await flush();assert(!env.classes.size,'entry releases its curtain and content effects');
}
{
  const env=navigation({start:'https://example.com/case-studies/',entry:'https://example.com/case-studies',loading:true});
  assert(env.classes.has('is-page-entering'),'canonical trailing-slash redirects keep the entry animation');
}
for(const path of ['index.html','case-studies/index.html',...slugs.map(slug=>`case-studies/${slug}/index.html`)]){
  const html=read(path);assert(html.includes('/assets/page-transitions.css')&&html.includes('<script src="/assets/page-transitions.js"></script>'));
}
for(const slug of slugs){
  const html=read(`case-studies/${slug}/index.html`);
  assert(html.includes(`/assets/cases/heroes/${slug}.webp`));
  const photos=[...html.matchAll(/<img[^>]+src="([^\"]+\.webp)"/g)];
  if(['dor-os','academic-quest'].includes(slug)){
    assert.equal(photos.length,1,'apps display only their hero');assert(!html.includes('case-showcase'));
  }else assert(html.includes(`/assets/cases/screens/${slug}.webp`));
}
console.log('PASS: supplied case assets, hero-only apps, shared footer, reversible hero, menu/footer/carousel transitions, home anchors, pre-paint entry, restored history and reduced motion.');
