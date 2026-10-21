import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {transformSync} from 'esbuild';
const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
for (const file of ['assets/mobile-experience.js','assets/phone/phone-entry.js']) transformSync(read(file), {loader:'js'});
const css=read('assets/mobile-experience.css');
transformSync(css,{loader:'css'});
assert(css.trim().replace(/^\/\*[\s\S]*?\*\//,'').trim().startsWith('@media (max-width: 899px)'));
for (const page of ['index.html','case-studies/index.html',...['emyasa','stone-kuche','parsomen','dor','dor-os','academic-quest'].map(s=>'case-studies/'+s+'/index.html')]) {
 const html=read(page);
 assert.equal((html.match(/mobile-experience\.css/g)||[]).length,1);
 assert.equal((html.match(/mobile-experience\.js/g)||[]).length,1);
 assert(html.includes('media="(max-width: 899px)"'));
 assert(/<a class="cinema-nav-mark" href="(?:\/)?#inicio" aria-label="by ˈHevən, inicio">/.test(html),'the star is a real home link on every page');
 assert(!html.includes('↗'),'arrows are SVG on Safari as well as desktop');
 assert(html.includes('/assets/brand/star-mark.svg'));
}
assert(!/<image|base64|<filter/.test(read('assets/brand/star-mark.svg')),'logo uses the supplied silhouette as vector geometry');
const source=read('assets/mobile-experience.js');
let mediaChange,domReads=0;
const media={matches:false,addEventListener(type,fn){mediaChange=fn;}};
vm.runInNewContext(source,{
 window:{matchMedia:()=>media,addEventListener(){}},
 document:{querySelectorAll(){domReads++;throw Error('desktop DOM must not be modified');}}
});
assert.equal(domReads,0,'desktop creates no controls and reads no DOM');

function element(){
 const attrs=new Map(),handlers={},children=[];
 return {attrs,handlers,children,hidden:false,
 classList:{contains:()=>false},
 setAttribute(k,v){attrs.set(k,v);},getAttribute:k=>attrs.get(k)||null,removeAttribute:k=>attrs.delete(k),
 append(child){children.push(child);},remove(){this.removed=true;},
 addEventListener(k,fn){handlers[k]=fn;}
 };
}
const track=element(),parent=element(),observerCallbacks=[];
track.id='existing-gallery';track.attrs.set('id',track.id);
track.children.push(...[0,100,200,300].map(offsetLeft=>({...element(),offsetLeft})));
track.scrollLeft=0;track.scrollWidth=400;track.clientWidth=100;
track.closest=()=>parent;
track.scrollTo=options=>{track.lastScroll=options;track.scrollLeft=options.left;track.handlers.scroll();};
let change,aborted=0;
const mobile={matches:true,addEventListener(type,fn){change=fn;}}, reduced={matches:false};
const doc={querySelectorAll:q=>q==='.chat-item'?[]:[track],querySelector:()=>null,getElementById:()=>null,createElement:()=>element(),addEventListener(){},body:{classList:{contains:()=>false}}};
vm.runInNewContext(source,{
 window:{matchMedia:q=>q.includes('max-width')?mobile:reduced,addEventListener(){}},document:doc,
 AbortController:class{signal={};abort(){aborted++;}},
 ResizeObserver:class{constructor(fn){observerCallbacks.push(fn);}observe(){}disconnect(){}},
 MutationObserver:class{constructor(fn){observerCallbacks.push(fn);}observe(){}disconnect(){}}
});
const controls=parent.children[0],[prev,next]=controls.children;
assert(prev.disabled);assert(!next.disabled);
next.handlers.click();assert.equal(track.scrollLeft,100);assert.equal(track.lastScroll.behavior,'smooth');assert(!prev.disabled);
reduced.matches=true;next.handlers.click();assert.equal(track.scrollLeft,200);assert.equal(track.lastScroll.behavior,'instant');
next.handlers.click();assert.equal(track.scrollLeft,300);assert(next.disabled);
prev.handlers.click();assert.equal(track.scrollLeft,200);
track.children[1].hidden=true;track.children[2].offsetLeft=100;track.children[3].offsetLeft=200;track.scrollWidth=300;track.scrollLeft=0;
observerCallbacks.forEach(fn=>fn());next.handlers.click();assert.equal(track.scrollLeft,100,'failed/hidden images do not leave empty stops');

// Model a smooth scroll still in flight; button intent must not wait for a midpoint.
reduced.matches=false;
track.children.forEach((item,i)=>{item.hidden=false;item.offsetLeft=i*100;});
track.scrollWidth=400;track.scrollLeft=0;observerCallbacks.forEach(fn=>fn());
track.scrollTo=options=>{track.lastScroll=options;};
next.handlers.click();assert.equal(track.lastScroll.left,100);
next.handlers.click();assert.equal(track.lastScroll.left,200,'a second tap advances before the first animation finishes');
prev.handlers.click();assert.equal(track.lastScroll.left,100,'reverse immediately retargets the requested destination');
track.scrollLeft=38;track.handlers.scroll();
track.handlers.pointerdown();assert.equal(track.lastScroll.left,38);assert.equal(track.lastScroll.behavior,'instant','touch takes over at the current position');
track.scrollLeft=180;track.handlers.scroll();next.handlers.click();assert.equal(track.lastScroll.left,300,'after a native swipe the buttons use the actual position');
assert(next.disabled);assert(!prev.disabled);
track.scrollLeft=230;track.handlers.wheel();assert.equal(track.lastScroll.left,230,'wheel input can also interrupt a button animation');
prev.handlers.click();assert.equal(track.lastScroll.left,100);
track.scrollLeft=100;track.handlers.scrollend();next.handlers.click();assert.equal(track.lastScroll.left,200,'completed scrolling clears the earlier destination');
track.scrollLeft=170;track.handlers.keydown();prev.handlers.click();assert.equal(track.lastScroll.left,100,'keyboard takeover drops the pending destination');
reduced.matches=true;next.handlers.click();assert.equal(track.lastScroll.behavior,'instant');
mobile.matches=false;change();assert(controls.removed);assert.equal(aborted,1);assert.equal(track.getAttribute('id'),'existing-gallery');
console.log('PASS: mobile syntax, eight-page wiring, desktop no-op, gallery boundaries, rapid retargeting, touch/wheel/keyboard takeover, reduced motion, failed-image skipping and cleanup.');

// Exercise the actual hero at short and tall mobile heights, then restore desktop.
const heroSource = read('assets/shopify-hero.js');
for (const height of [568, 844]) {
 const style=()=>({values:new Map(),setProperty(k,v){this.values.set(k,v);},removeProperty(k){this.values.delete(k);}});
 const slide=()=>({...element(),style:style(),classList:{toggle(){},add(){}}});
 const slides=[slide(),slide(),slide()],device={style:style()},image={src:''};
 const scene={...element(),dataset:{},classList:{add(){}},style:style(),offsetHeight:900,clientWidth:1440,
  querySelector:q=>q==='.flow-phone-position'?device:image,querySelectorAll:()=>slides};
 const story={...element(),querySelector:()=>scene,getBoundingClientRect:()=>({top:0}),toggleAttribute(k,v){this.attrs.set(k,v);}};
 let client,preloads=0;
 const clock={subscribe(c){client=c;},reset(){},wake(){},approach:(a,b)=>b};
 const win={innerWidth:390,innerHeight:height,scrollY:0,HevenMotion:clock,
  matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){},dispatchEvent(){}};
 vm.runInNewContext(heroSource,{window:win,document:{querySelector:q=>q==='[data-flow-story]'?story:null,getElementById:()=>null},Image:class{constructor(){preloads++;}},CustomEvent:class{}});
 client.measure();
 assert.equal(story.attrs.get('data-scroll-ready'),false,'all mobile heights use natural hero flow');
 assert.equal(preloads,0,'mobile does not preload the discarded screens');
 assert.equal(image.src,'assets/phone/screen-home.webp');
 assert.deepEqual(slides.map(s=>s.inert),[false,true,true],'only the visible mobile chapter is focusable');
 assert.equal(client.render({y:0}),false,'mobile hero does not animate on scroll');
 win.innerWidth=1440;client.measure();
 assert.equal(story.attrs.get('data-scroll-ready'),true,'desktop story returns at the approved breakpoint');
 assert.equal(preloads,2,'only desktop prepares its two extra screens');
 for (const [y, x, angle] of [[0,619.2,-24],[1188,964.8,360],[2376,244.8,720]]) {
   client.render({y,dt:16.67,immediate:true});
   assert(Math.abs(parseFloat(scene.style.values.get('--phone-x'))-x)<.001,'approved desktop phone positions remain unchanged');
   assert.equal(parseFloat(scene.dataset.phoneTurn),angle);
 }
}

// All ten answers remain available; collapsing and breakpoint cleanup restore state.
const faqItems=Array.from({length:10},()=>({...element(),open:false})),faqParent=element();
const faqMobile={matches:true,addEventListener(type,fn){this.change=fn;}};
const faqDoc={...doc,querySelectorAll:q=>q==='.chat-item'?faqItems:[],querySelector:q=>q==='.chat-faq'?faqParent:null};
vm.runInNewContext(source,{
 window:{matchMedia:q=>q.includes('max-width')?faqMobile:reduced,addEventListener(){}},document:faqDoc,
 AbortController:class{signal={};abort(){this.signal.aborted=true;}},ResizeObserver:class{},MutationObserver:class{}
});
const more=faqParent.children[0];more.scrollIntoView=()=>{};
assert.equal(faqItems.filter(item=>!item.hidden).length,4);
assert.equal(more.getAttribute('aria-expanded'),'false');
more.handlers.click();assert(faqItems.every(item=>!item.hidden));
faqItems[6].open=true;more.handlers.click();assert(!faqItems[6].open);
assert.equal(faqItems.filter(item=>!item.hidden).length,4);
faqMobile.matches=false;faqMobile.change();assert(faqItems.every(item=>!item.hidden));assert(more.removed);
console.log('PASS: one mobile hero at short/tall heights, no extra-screen requests, desktop restoration, real home links, vector arrows/logo, compact FAQ with all answers and reversible cleanup.');

const photoClasses=new Set(),photo={...element(),complete:true,naturalWidth:0,closest:()=>({classList:{add:c=>photoClasses.add(c),remove:c=>photoClasses.delete(c)}})};
const photoMobile={matches:true,addEventListener(t,fn){this.change=fn;}};
vm.runInNewContext(source,{
 window:{matchMedia:q=>q.includes('max-width')?photoMobile:reduced,addEventListener(){}},
 document:{...doc,querySelectorAll:()=>[],querySelector:q=>q==='.flow-mobile-device img'?photo:null},
 AbortController:class{signal={};abort(){this.signal.aborted=true;}},ResizeObserver:class{},MutationObserver:class{}
});
assert(photoClasses.has('is-mobile-device-failed'),'an image already failed before script startup exposes the CSS phone');
photo.handlers.load();assert(!photoClasses.has('is-mobile-device-failed'),'a recovered image restores the supplied phone');
photo.handlers.error();assert(photoClasses.has('is-mobile-device-failed'));
photoMobile.matches=false;photoMobile.change();assert(!photoClasses.has('is-mobile-device-failed'),'desktop cleanup removes the fallback flag');
console.log('PASS: supplied mobile phone load failure, recovery and breakpoint cleanup.');

// Exercise the shared FAQ controller: mobile answers immediately, desktop keeps typing.
const finishSource=read('assets/home-finish.js');
transformSync(finishSource,{loader:'js'});
for(const width of [390,899,900,1440]) {
 const summary=element(),typing=element(),region=element(),messages=[element(),element()],classes=new Set(),delays=[];
 const item={...element(),open:false,classList:{add:c=>classes.add(c),remove:c=>classes.delete(c)},
  querySelector:q=>q==='summary'?summary:q==='.chat-typing'?typing:region,querySelectorAll:()=>messages};
 const preference={matches:false,addEventListener(t,fn){this.change=fn;}};
 vm.runInNewContext(finishSource,{
  window:{innerWidth:width,matchMedia:()=>preference,addEventListener(){}},
  document:{querySelector:()=>null,getElementById:()=>null,querySelectorAll:()=>[item],addEventListener(){}},
  setTimeout(fn,delay){delays.push(delay);return delays.length;},clearTimeout(){}
 });
 summary.handlers.click();item.open=true;item.handlers.toggle();
 if(width<900){
  assert.equal(delays.length,0,'mobile FAQ has no artificial typing timer');
  assert(messages.every(m=>!m.hidden));assert(typing.hidden);assert.equal(region.getAttribute('aria-busy'),'false');
 }else{
  assert.deepEqual(delays,[380,600],'approved desktop typing timing stays unchanged');
  assert(messages.every(m=>m.hidden));assert(!typing.hidden);
 }
 preference.matches=true;preference.change();
 assert(messages.every(m=>!m.hidden));assert(typing.hidden);assert(!classes.has('is-animated'),'reduced motion immediately exposes complete answers');
 item.open=false;item.handlers.toggle();assert.equal(region.getAttribute('aria-busy'),'false');
}

// Closing before the next frame must not send mobile focus into the hidden menu.
const menuToggle=element(),menuPanel=element(),menuMain=element(),menuClasses=new Set(),frames=[];
let linkFocus=0;
menuPanel.querySelector=()=>({focus(){linkFocus++;}});
vm.runInNewContext(finishSource,{
 window:{innerWidth:390,matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){}},
 document:{querySelector:q=>q==='.cinema-menu-toggle'?menuToggle:q==='main'?menuMain:null,
  getElementById:id=>id==='mobile-menu-panel'?menuPanel:null,querySelectorAll:()=>[],addEventListener(){},
  body:{classList:{contains:c=>menuClasses.has(c),toggle(c,on){on?menuClasses.add(c):menuClasses.delete(c);}}}},
 requestAnimationFrame:fn=>frames.push(fn)
});
menuToggle.handlers.click();menuToggle.handlers.click();frames.splice(0).forEach(fn=>fn());
assert.equal(linkFocus,0);assert(menuPanel.inert);assert(!menuMain.inert);assert.equal(menuToggle.getAttribute('aria-expanded'),'false');
menuToggle.handlers.click();menuToggle.handlers.click();menuToggle.handlers.click();frames.splice(0).forEach(fn=>fn());
assert(!menuPanel.inert);assert(menuMain.inert);assert.equal(menuToggle.getAttribute('aria-expanded'),'true');assert(linkFocus>0);
console.log('PASS: immediate mobile FAQ, unchanged desktop timing, reduced-motion answers and rapid menu reversal without hidden focus.');

