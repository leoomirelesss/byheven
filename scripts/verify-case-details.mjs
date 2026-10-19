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
function navigation({native=false,reduced=false,entry=null,blockedStorage=false,start='https://example.com/case-studies/',loading=false,canAnimate=true,saveData=false,imageReady=true,imageHangs=false}={}) {
  const documentEvents={},windowEvents={},classes=new Set(),assigned=[],animations=[],children=[],resources=[];
  const timers=new Map();let timerId=0,saved=entry,scrolled=0,resets=0;
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
  const window={HevenMotion:{reset(){resets++;}},innerWidth:1920,innerHeight:1080,devicePixelRatio:1,navigator:{connection:{saveData}},matchMedia:()=>({matches:reduced}),addEventListener:(name,fn)=>{windowEvents[name]=fn;}};
  if(native)Object.assign(window,{CSSViewTransitionRule:class{},onpageswap:null,onpagereveal:null});
  const document={readyState:loading?'loading':'complete',documentElement:root,createElement:tag=>tag==='link'?{}:curtain,body:{append:element=>children.push(element)},head:{append:element=>resources.push(element)},
    querySelector:selector=>selector==='main'?main:selector==='[data-case-hero] img'?{complete:imageReady,decode:()=>imageHangs?new Promise(()=>{}):Promise.resolve()}:null,
    getElementById:id=>['work','services','faq','inicio','contact'].includes(id)?{scrollIntoView(){scrolled++;}}:null,
    addEventListener:(name,fn)=>{documentEvents[name]=fn;},removeEventListener:name=>{delete documentEvents[name];}};
  vm.runInNewContext(read('assets/page-transitions.js'),{
    window,location,URL,setTimeout:(fn,delay)=>{const id=++timerId;timers.set(id,{fn,delay});return id;},clearTimeout:id=>timers.delete(id),
    sessionStorage:{getItem(){if(blockedStorage)throw Error('denied');return saved;},removeItem(){saved=null;},setItem(_,v){if(blockedStorage)throw Error('denied');saved=v;}},
    document,
  });
  const click=(href,overrides={},attributes={})=>{
    const link={href:new URL(href,location.href).href,target:attributes.target||'',hasAttribute:name=>!!attributes[name],closest:()=>attributes.studio?{}:null};
    const event={target:{closest:()=>link},button:0,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},...overrides};
    return{event,done:documentEvents.click?.(event)};
  };
  const intent=(href,type='pointerover')=>documentEvents[type]?.({target:{closest:()=>({href:new URL(href,location.href).href,hasAttribute:()=>false})}});
  return{click,intent,assigned,classes,documentEvents,windowEvents,animations,children,resources,document,location,
    timers:delay=>{for(const [id,timer] of timers)if(timer.delay===delay){timers.delete(id);timer.fn();}},
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
// Menu/footer anchors never obscure or transform the existing scroll storytelling.
for(const native of [false,true])for(const href of ['#inicio','#services','#work','#faq','#contact','/#services']){
  const env=navigation({native,start:'https://example.com/'});const pending=env.click(href,{}, {studio:true});
  assert(!pending.event.defaultPrevented,href+' stays native within the home');
  assert.equal(env.animations.length,0);assert.equal(env.assigned.length,0);assert.equal(env.resources.length,0);assert(!env.classes.size);
}
assert(!navigation().click('/case-studies').event.defaultPrevented,'canonical slash variants are the same document');
// Warm only intended page changes, once per destination, with the corresponding hero.
{
  const env=navigation({start:'https://example.com/'});
  for(const href of ['#services','/#work','https://outside.example/'])env.intent(href);
  assert.equal(env.resources.length,0);
  env.intent('/case-studies/emyasa/');env.intent('/case-studies/emyasa/#project-work','focusin');
  assert.equal(env.resources.length,2);
  assert.equal(env.resources[0].href,'https://example.com/case-studies/emyasa/');assert.equal(env.resources[0].as,'document');
  assert.equal(env.resources[1].href,'/assets/cases/heroes/emyasa.webp');assert.equal(env.resources[1].as,'image');
  assert.equal(env.animations.length,0,'warming does not start an animation');
  const saving=navigation({saveData:true});saving.intent('/case-studies/dor/');assert.equal(saving.resources.length,0);
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
  env.document.readyState='interactive';env.documentEvents.readystatechange();await flush();assert.equal(env.children.length,1);
  assert(!env.documentEvents.readystatechange,'entry mounts once before deferred modules finish');
  env.windowEvents.pageshow({persisted:false});assert(env.classes.has('is-page-leaving'),'initial pageshow does not cancel entry');
  env.finish();await flush();assert(!env.classes.size,'entry releases its curtain and content effects');
  assert(env.animations.every(a=>a.target==='curtain'),'no blur or transform on main: fixed backgrounds and sticky chapters keep their geometry');
}
{
  const url='https://example.com/#services';const env=navigation({start:url,entry:url,imageReady:false});
  assert.equal(env.scrolled(),1,'a cross-page return settles its section under the cover');await flush();
  assert.equal(env.animations.length,1);assert.equal(env.animations[0].options.duration,520);env.finish();await flush();assert(!env.classes.size);
}
{
  const url='https://example.com/case-studies/emyasa/';const env=navigation({start:url,entry:url,imageReady:false,imageHangs:true});
  assert.equal(env.animations.length,0);env.timers(150);await flush();
  assert.equal(env.animations.length,1,'a slow hero cannot hold the reveal beyond its short decoding budget');env.finish();await flush();assert(!env.classes.size);
}
{
  const env=navigation();const pending=env.click('/case-studies/dor/');env.finish();await pending.done;
  env.timers(8000);assert(!env.classes.size,'a failed or canceled navigation releases the overlay');
}
{
  const env=navigation({start:'https://example.com/case-studies/',entry:'https://example.com/case-studies',loading:true});
  assert(env.classes.has('is-page-entering'),'canonical trailing-slash redirects keep the entry animation');
}
for(const path of ['index.html','case-studies/index.html',...slugs.map(slug=>`case-studies/${slug}/index.html`)]){
  const html=read(path);assert(html.includes('/assets/page-transitions.css')&&html.includes('<script src="/assets/page-transitions.js"></script>'));
}
for(const [index,slug] of slugs.entries()){
  const html=read(`case-studies/${slug}/index.html`);
  assert(html.includes(`/assets/cases/heroes/${slug}.webp`));
  const photos=[...html.matchAll(/<img[^>]+src="([^\"]+\.webp)"/g)];
  const next=slugs[(index+1)%slugs.length];
  assert(new RegExp(`class="case-next-cover"[^>]*><img src="/assets/cases/heroes/${next}\\.webp"`).test(html),'each next-case teaser has its destination image');
  if(['dor-os','academic-quest'].includes(slug)){
    assert.equal(photos.length,2,'apps have their hero and next-case teaser');assert(!html.includes('case-showcase'),'apps have no interior screenshot gallery');
  }else assert(html.includes(`/assets/cases/screens/${slug}.webp`));
}
console.log('PASS: six photo teasers, supplied assets, apps without interior galleries, shared footer, reversible hero, cross-page transitions, native home anchors, intent prefetch, early entry, restored history and reduced motion.');
