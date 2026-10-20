import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import vm from 'node:vm';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const slugs = ['emyasa','stone-kuche','parsomen','dor','dor-os','academic-quest'];
const footer = page => page.slice(page.indexOf('  <div class="sticky-footer-wrapper">'),page.lastIndexOf('</body>')).replaceAll('href="/#','href="#').trim();
for (const [index, slug] of slugs.entries()) {
  const html = read(`case-studies/${slug}/index.html`);
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  assert(/<h1[^>]+aria-label="[^"]+"/.test(html),'one semantic project name labels the decorative letter treatment');
  assert(html.includes('case-hero-name" aria-hidden="true"')&&!html.includes('case-hero-ticker'),'one name replaces the repeating ticker');
  assert(html.includes(`/case-studies/${slugs[(index+1)%slugs.length]}/`),'all six cases form a complete navigation cycle');
  assert(!html.includes('/#process'));
  assert.equal(footer(html),footer(read('index.html')),'every detail page uses the home footer');
  for(const [,path] of html.matchAll(/(?:src|href)="(\/assets\/[^"#]+)"/g)){
    const file=new URL(`..${path}`,import.meta.url);assert(existsSync(file),path);
    if(path.endsWith('.webp')){const bytes=readFileSync(file);assert(bytes.length>32&&bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP','valid supplied image: '+path);}
  }
  assert(html.includes('/assets/scroll-story.js')&&html.includes('/assets/chapter-arrivals.js'));
}

// Real hero controller: deterministic decoding, stable type width and shared finite easing.
{
  let client, reads=0, writes=0, unsubscribed=0, disconnected=0;
  const data=new Map(), classes=new Set(), events={};
  let titleBottom=700;
  const storyAttrs=new Set(), storyStyles=new Map();
  const overview={offsetHeight:1200};
  const story={querySelector:()=>overview,toggleAttribute(name,on){if(on)storyAttrs.add(name);else storyAttrs.delete(name);},style:{setProperty:(k,v)=>storyStyles.set(k,v),removeProperty:k=>storyStyles.delete(k)}};
  const media={matches:false,addEventListener(){},removeEventListener(){}};
  const letters=Array.from('AcademicQuest',char=>({textContent:char,attributes:new Map(),
    setAttribute(k,v){writes++;this.attributes.set(k,v);},removeAttribute(k){writes++;this.attributes.delete(k);}}));
  const words=Array.from({length:2},()=>({style:{values:new Map(),setProperty(k,v){writes++;this.values.set(k,v);}}}));
  const title={getBoundingClientRect(){reads++;return{bottom:titleBottom};}};
  const hero={offsetHeight:1000,querySelector:selector=>selector==='.case-hero-title'?title:{classList:{add:name=>classes.add(name)}},
    querySelectorAll:selector=>selector==='.case-title-word'?words:letters,
    getBoundingClientRect(){reads++;return{top:0};},style:{setProperty(k,v){writes++;data.set(k,v);}}};
  const settings={parallax:2.5,arrivalMin:140,arrivalMax:240,arrivalDistance:.24,arrivalShift:32,lineDelay:.14,lineDelayMax:.28};
  const clock={settings,approach:(value,target,dt,immediate)=>immediate?target:Math.abs(target-value)<.0001?target:value+(target-value)*(1-Math.exp(-dt/70)),
    subscribe(value){client=value;return()=>{unsubscribed++;};},invalidate(){client.measure();}};
  const view={HevenMotion:clock,scrollY:0,innerWidth:1400,innerHeight:900,matchMedia:()=>media,addEventListener:(name,fn)=>{events[name]=fn;}};
  vm.runInNewContext(read('assets/case-detail.js'),{
    document:{querySelector:selector=>selector==='[data-case-hero]'?hero:story},window:view,ResizeObserver:class{observe(){}disconnect(){disconnected++;}},
  });
  const render=y=>client.render({y,dt:16.67,immediate:true});
  const glyphs=()=>letters.map(letter=>letter.attributes.get('data-scramble'));
  client.measure();const initialReads=reads;
  assert(storyAttrs.has('data-showcase-ready'));assert.equal(storyStyles.get('--case-overview-top'),'-324px','long copy is fully readable before it sticks');
  render(0);assert(glyphs().every(glyph=>!glyph),'initial title is complete and legible');
  render(120);const middle=glyphs();assert(middle.filter(Boolean).length>0&&middle.filter(Boolean).length<=2,'decoding is a small moving band, not a screen of noise');
  render(180);render(120);assert.deepEqual(glyphs(),middle,'reverse scroll returns the exact same glyphs without randomness or timers');
  for(let y=0;y<=700;y+=5){render(y);assert(glyphs().filter(Boolean).length<=2);}
  assert(glyphs().every(glyph=>!glyph),'letters settle when the title leaves the viewport');
  render(650);assert(glyphs().some(Boolean),'decoding continues after the old short entrance range, until the last visible part of the title');render(700);
  assert.equal(letters.map(letter=>letter.textContent).join(''),'AcademicQuest','original text and its width are never replaced');
  assert(words.every(word=>word.style.values.get('--case-word-y')==='0px'));
  render(500);assert.equal(data.get('--case-hero-y'),'12.5px');assert(!data.has('--case-title-x'),'no sideways ticker survives');
  render(250);assert.equal(data.get('--case-hero-y'),'6.25px');
  render(2000);const settledWrites=writes;render(3000);assert.equal(writes,settledWrites,'endpoints stop DOM work');
  render(0);assert(classes.has('is-dismissed'),'cue remains dismissed after returning to the top');
  let moving=client.render({y:120,dt:16.67,immediate:false});
  assert(moving&&parseFloat(data.get('--case-hero-y'))>0&&parseFloat(data.get('--case-hero-y'))<3,'native input follows shared easing');
  for(let i=0;i<150&&moving;i++)moving=client.render({y:120,dt:16.67,immediate:false});
  assert(!moving,'follow easing settles and lets the shared clock sleep');
  assert.equal(reads,initialReads,'scroll frames never read layout');
  media.matches=true;client.measure();render(120);
  assert(!storyAttrs.has('data-showcase-ready')&&!storyStyles.size,'reduced motion restores the ordinary reading flow');
  assert.equal(data.get('--case-hero-y'),'0px');assert(glyphs().every(glyph=>!glyph));assert(words.every(word=>word.style.values.get('--case-word-y')==='0px'));
  media.matches=false;view.innerWidth=375;titleBottom=840;client.measure();render(800);assert(glyphs().some(Boolean),'wrapped titles get their own full visible range');render(500);assert(!storyAttrs.has('data-showcase-ready'),'mobile keeps its native reading flow');assert.equal(data.get('--case-hero-y'),'0px','mobile has no extra image drift');
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
  }else assert(html.includes(`/assets/cases/mac/${slug}-1.webp`));
}
assert(!read('assets/page-transitions.css').includes('heven-curtain-safety'),'no fixed CSS timer can reveal an unready destination');
assert(!/border-bottom:/.test(read('assets/case-detail.css')),'detail content has no section or row dividers');
console.log('PASS: six photo teasers, supplied assets, shared footer, reversible hero, direct document transitions without overlays, native anchors and navigation, intent prefetch, history and reduced motion.');

await import('./verify-case-screens.mjs');
