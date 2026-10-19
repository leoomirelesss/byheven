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
  const clock={settings:{parallax:2.5},approach:(value,target,dt,immediate)=>immediate?target:value+(target-value)*.5,subscribe(value){client=value;return()=>{unsubscribed++;};},invalidate(){client.measure();}};
  vm.runInNewContext(read('assets/case-detail.js'),{
    document:{querySelector:()=>hero},window:{HevenMotion:clock,scrollY:0,innerWidth:1400,innerHeight:900,matchMedia:()=>media,addEventListener:(name,fn)=>{events[name]=fn;}},
    ResizeObserver:class{observe(){}disconnect(){disconnected++;}},
  });
  client.measure();const initialReads=reads;
  client.render({y:500,dt:16.67,immediate:true});assert.equal(data.get('--case-hero-y'),'12.5px');assert.equal(data.get('--case-title-x'),'112px');
  client.render({y:250,dt:16.67,immediate:true});assert.equal(data.get('--case-hero-y'),'6.25px');
  client.render({y:2000,dt:16.67,immediate:true});const settledWrites=writes;client.render({y:3000,dt:16.67,immediate:true});assert.equal(writes,settledWrites,'endpoints do no extra work');
  client.render({y:0,dt:16.67,immediate:true});assert.equal(data.get('--case-title-x'),'0px');assert(classes.has('is-dismissed'),'cue stays dismissed after returning to the top');
  assert.equal(reads,initialReads,'scroll frames use cached hero geometry');
  client.render({y:500,dt:16.67,immediate:false});assert.equal(data.get('--case-hero-y'),'6.25px','native input follows with the same finite damping instead of a jump');
  client.render({y:500,dt:16.67,immediate:false});assert.equal(data.get('--case-hero-y'),'9.375px');
  media.matches=true;client.measure();client.render({y:500,dt:16.67,immediate:true});assert.equal(data.get('--case-hero-y'),'0px');
  events.pagehide({persisted:true});assert.equal(unsubscribed,0);
  events.pagehide({persisted:false});assert.equal(unsubscribed,1);assert.equal(disconnected,1);
}

// Native links remain usable with/without transitions, denied storage or reduced motion.
function navigation({reduced=false,saveData=false,start='https://example.com/',blockedStorage=false}={}) {
  const documentEvents={},windowEvents={},resources=[];
  let resets=0;
  const location=new URL(start);
  vm.runInNewContext(read('assets/page-transitions.js'),{
    location,URL,
    sessionStorage:{removeItem(){if(blockedStorage)throw Error('denied');}},
    window:{innerWidth:1920,innerHeight:1080,devicePixelRatio:1,
      navigator:{connection:{saveData}},matchMedia:()=>({matches:reduced}),
      HevenMotion:{reset(){resets++;}},addEventListener:(name,fn)=>{windowEvents[name]=fn;}},
    document:{createElement:()=>({}),head:{append:resource=>resources.push(resource)},
      addEventListener:(name,fn)=>{documentEvents[name]=fn;}},
  });
  const event=(href,extra={},attributes={})=>({
    target:{closest:()=>({href:new URL(href,start).href,target:attributes.target||'',hasAttribute:name=>!!attributes[name]})},
    button:0,defaultPrevented:false,preventDefault(){throw Error('navigation must never be intercepted');},...extra,
  });
  return{resources,windowEvents,resets:()=>resets,
    click:(...args)=>documentEvents.click(event(...args)),
    intent:href=>documentEvents.pointerover(event(href))};
}
for(const blockedStorage of [false,true])for(const reduced of [false,true]){
  for(const [start,href] of [
    ['https://example.com/','/case-studies/emyasa/'],
    ['https://example.com/case-studies/emyasa/','/#services'],
    ['https://example.com/case-studies/','/#work'],
    ['https://example.com/case-studies/emyasa/','/case-studies/'],
    ['https://example.com/','/case-studies'],
  ]) navigation({start,blockedStorage,reduced}).click(href);
}
for(const href of ['#inicio','#services','#work','#faq','#contact','/#services','https://outside.example/','mailto:hello@example.com']){
  const env=navigation();env.click(href);env.intent(href);assert.equal(env.resources.length,0,'section/external links never fetch pages');
}
for(const [extra,attributes] of [[{ctrlKey:true},{}],[{metaKey:true},{}],[{button:1},{}],[{defaultPrevented:true},{}],[{},{target:'_blank'}],[{},{download:true}]]){
  const env=navigation();env.click('/case-studies/emyasa/',extra,attributes);assert.equal(env.resources.length,0);
}
{
  const env=navigation();env.intent('/case-studies/emyasa/');env.click('/case-studies/emyasa/#project-work');
  assert.equal(env.resources.length,2,'intent deduplicates document and responsive hero prefetch');
  assert.equal(env.resources[0].href,'https://example.com/case-studies/emyasa/');
  assert.equal(env.resources[1].href,'/assets/cases/heroes/emyasa.webp');
  const saving=navigation({saveData:true});saving.intent('/case-studies/dor/');assert.equal(saving.resources.length,0);
  const same=navigation({start:'https://example.com/case-studies/'});same.intent('/case-studies');assert.equal(same.resources.length,0);
}
for(const reduced of [false,true]){
  const env=navigation({reduced});let skipped=0;
  const event={viewTransition:{skipTransition(){skipped++;}}};
  env.windowEvents.pageswap(event);env.windowEvents.pagereveal(event);
  assert.equal(skipped,reduced?2:0);assert.equal(env.resets(),1);
  env.windowEvents.pagereveal({}); // unsupported transition / cold load
  env.windowEvents.pageshow({persisted:true});assert.equal(env.resets(),3);
}
const transitionCSS=read('assets/page-transitions.css');
assert(transitionCSS.includes('@view-transition { navigation: auto; }'));
assert(transitionCSS.includes('::view-transition-new(root)')&&transitionCSS.includes('clip-path: inset(100% 0 0 0)'));
assert(!/page-curtain|is-page-entering|is-page-leaving/.test(read('assets/page-transitions.js')+transitionCSS),'no intermediate color overlay can appear or block slow/failed navigation');
for(const path of ['index.html','case-studies/index.html',...slugs.map(slug=>`case-studies/${slug}/index.html`)]){
  const html=read(path);assert(html.includes('/assets/page-transitions.css')&&html.includes('<script src="/assets/page-transitions.js"></script>'));
}
for(const [index,slug] of slugs.entries()){
  const html=read(`case-studies/${slug}/index.html`);
  assert(html.includes(`/assets/cases/heroes/${slug}.webp`));
  assert(html.includes('/assets/case-detail-background.js')&&html.includes('class="case-detail-atmosphere"'),'every detail page shares the adapted aurora');
  const photos=[...html.matchAll(/<img[^>]+src="([^\"]+\.webp)"/g)];
  const next=slugs[(index+1)%slugs.length];
  assert(new RegExp(`class="case-next-cover"[^>]*><img src="/assets/cases/heroes/${next}\\.webp"`).test(html),'each next-case teaser has its destination image');
  if(['dor-os','academic-quest'].includes(slug)){
    assert.equal(photos.length,2,'apps have their hero and next-case teaser');assert(!html.includes('case-showcase'),'apps have no interior screenshot gallery');
  }else assert(html.includes(`/assets/cases/screens/${slug}.webp`));
}
assert(!read('assets/page-transitions.css').includes('heven-curtain-safety'),'no fixed CSS timer can reveal an unready destination');
assert(!/border-bottom:/.test(read('assets/case-detail.css')),'detail content has no section or row dividers');
console.log('PASS: six photo teasers, supplied assets, shared footer, reversible hero, direct document transitions without overlays, native anchors and navigation, intent prefetch, history and reduced motion.');
