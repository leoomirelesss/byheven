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
}
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
const doc={querySelectorAll:()=>[track],querySelector:()=>null,getElementById:()=>null,createElement:()=>element(),addEventListener(){},body:{classList:{contains:()=>false}}};
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
mobile.matches=false;change();assert(controls.removed);assert.equal(aborted,1);assert.equal(track.getAttribute('id'),'existing-gallery');
console.log('PASS: mobile syntax, eight-page wiring, desktop no-op, gallery boundaries, buttons, reduced motion, failed-image skipping and breakpoint cleanup.');
