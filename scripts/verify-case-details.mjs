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
  for(const [,path] of html.matchAll(/(?:src|href)="(\/assets\/[^"#]+)"/g))assert(existsSync(new URL(`..${path}`,import.meta.url)),path);
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

// Real navigation fallback: native browsers do not get intercepted; ordinary link semantics survive.
function navigation({native=false,reduced=false,entry=null,blockedStorage=false}={}) {
  const documentEvents={},bodyEvents={},windowEvents={},classes=new Set(),assigned=[];
  let resolveDeparture, canceled=0, saved=entry;
  const location={href:'https://example.com/case-studies/',origin:'https://example.com',pathname:'/case-studies/',search:'',assign:url=>assigned.push(url)};
  const window={matchMedia:()=>({matches:reduced}),addEventListener:(name,fn)=>{windowEvents[name]=fn;}};
  if(native)Object.assign(window,{CSSViewTransitionRule:class{},onpageswap:null,onpagereveal:null});
  vm.runInNewContext(read('assets/page-transitions.js'),{
    window,location,URL,
    sessionStorage:{getItem(){if(blockedStorage)throw Error('denied');return saved;},removeItem(){saved=null;},setItem(_,v){if(blockedStorage)throw Error('denied');saved=v;}},
    document:{documentElement:{classList:{add:n=>classes.add(n),remove:n=>classes.delete(n)}},addEventListener:(name,fn)=>{documentEvents[name]=fn;},
      body:{addEventListener:(name,fn)=>{bodyEvents[name]=fn;},animate(){return{finished:new Promise(resolve=>{resolveDeparture=resolve;}),cancel(){canceled++;}};}}},
  });
  const click=(href,overrides={},attributes={})=>{
    const link={href,target:attributes.target||'',hasAttribute:name=>!!attributes[name]};
    const event={target:{closest:()=>link},button:0,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},...overrides};
    return{event,done:documentEvents.click?.(event)};
  };
  return{click,assigned,classes,documentEvents,bodyEvents,windowEvents,finish:()=>resolveDeparture(),saved:()=>saved,canceled:()=>canceled};
}
assert(!navigation({native:true}).documentEvents.click,'native cross-document navigation is left to the browser');
for(const [href,event,attributes] of [
  ['https://example.com/case-studies/emyasa/',{ctrlKey:true},{}],
  ['https://example.com/case-studies/emyasa/',{}, {target:'_blank'}],
  ['https://example.com/case-studies/emyasa/',{}, {download:true}],
  ['https://example.com/case-studies/#grid',{},{}],
  ['https://outside.example/',{},{}],
  ['mailto:hello@example.com',{},{}],
])assert(!navigation().click(href,event,attributes).event.defaultPrevented,'modified/external/hash/download links stay native');
assert(!navigation({reduced:true}).click('https://example.com/case-studies/emyasa/').event.defaultPrevented);
for(const blockedStorage of [false,true]){
  const env=navigation({blockedStorage});const pending=env.click('https://example.com/case-studies/emyasa/');
  assert(pending.event.defaultPrevented);assert.equal(env.assigned.length,0);
  env.finish();await pending.done;assert.equal(env.assigned.length,1,'fallback navigates after its finite outgoing animation, even with storage blocked');
  env.windowEvents.pageshow({persisted:true});assert.equal(env.canceled(),1,'back/forward restores the unblurred document');
}
const incoming=navigation({entry:'1'});assert(incoming.classes.has('is-page-entering'));
incoming.windowEvents.pageshow({persisted:false});assert(incoming.classes.has('is-page-entering'),'initial pageshow must not cancel the entry');
incoming.bodyEvents.animationend({animationName:'heven-fallback-in'});assert(!incoming.classes.size);
for(const path of ['index.html','case-studies/index.html',...slugs.map(slug=>`case-studies/${slug}/index.html`)]){
  const html=read(path);assert(html.includes('/assets/page-transitions.css')&&html.includes('/assets/page-transitions.js'));
}
console.log('PASS: six semantic cases, matching footer, complete links/assets, reversible hero, reduced motion, native transitions and fallback link/history behavior.');
