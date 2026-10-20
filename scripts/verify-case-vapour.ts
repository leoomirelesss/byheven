import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createVapourRenderer, vaporPose, vaporProgress} from '../lib/vapour-text';

assert.equal(vaporProgress(0, 120, 500), 0);
assert.equal(vaporProgress(370, 120, 500), .5);
assert.equal(vaporProgress(2000, 120, 500), 1);
const sample = {x: 180, y: 90, alpha: .9, seed: .37};
const forward = Array.from({length: 101}, (_, i) => vaporPose(sample, i / 100, 800));
for (let i = 100; i >= 0; i--) assert.deepEqual(vaporPose(sample, i / 100, 800), forward[i], 'reverse scroll reconstructs the identical particle pose');
assert(!forward[0].released); assert.equal(forward[100].alpha, 0);
assert(forward.every(pose => Number.isFinite(pose.x) && Number.isFinite(pose.y) && pose.alpha >= 0 && pose.alpha <= 1));
let reads = 0, draws = 0;
const context = () => ({
  setTransform() {}, clearRect() {}, fillText() {}, save() {}, restore() {}, beginPath() {}, rect() {}, clip() {}, arc() {}, fill() { draws++; },
  drawImage() { draws++; }, fillRect() { draws++; }, measureText: () => ({fontBoundingBoxAscent: 80, fontBoundingBoxDescent: 20}),
  getImageData: () => { const data = new Uint8ClampedArray(400 * 200 * 4); for(let i=3;i<data.length;i+=4)data[i]=255; return {data}; },
  font: '', fillStyle: '', textBaseline: '', letterSpacing: '', globalAlpha: 1,
});
const classes = new Set<string>();
const title = {
  style: {setProperty() {}, removeProperty() {}},
  getBoundingClientRect() { reads++; return {width: 200, height: 100, top: 0, left: 0}; },
  querySelectorAll: () => [{textContent: 'Casos', getBoundingClientRect() { reads++; return {left: 0, top: 0, height: 100}; }}],
  classList: {add: (name: string) => classes.add(name), remove: (name: string) => classes.delete(name), toggle(name: string, on: boolean) { if(on)classes.add(name);else classes.delete(name); }},
};
const canvas = {width: 0, height: 0, style: {opacity: '0'}, getContext: context};
Object.assign(globalThis, {
  window: {devicePixelRatio: 1},
  document: {createElement: () => ({width: 0, height: 0, getContext: context})},
  getComputedStyle: () => ({fontSize: '100px', fontFamily: 'Outfit', fontWeight: '400', letterSpacing: '-6px', color: '#ceced7'}),
});
const renderer = createVapourRenderer(title as unknown as HTMLElement, canvas as unknown as HTMLCanvasElement)!;
renderer.measure(); renderer.render(0); assert(!classes.has('is-vaporizing'));
const measured = reads;
renderer.render(.5); assert.equal(reads, measured, 'scroll frames never measure layout'); assert(classes.has('is-vaporizing')); assert.equal(canvas.style.opacity, '1');
const rendered = draws; renderer.render(.5); assert.equal(draws, rendered, 'paused scroll performs no redraw');
renderer.render(1); assert.equal(canvas.style.opacity, '0');
renderer.render(0); assert(!classes.has('is-vaporizing'), 'returning to the top restores the real HTML title');
renderer.destroy(); assert.equal(canvas.width, 0); assert(!classes.has('is-vaporizing'));
const fallback = createVapourRenderer(title as unknown as HTMLElement, {getContext: () => null} as unknown as HTMLCanvasElement);
assert.equal(fallback, null, 'canvas failure keeps the HTML fallback');
const html = readFileSync(new URL('../case-studies/index.html', import.meta.url), 'utf8');
assert.equal((html.match(/<h1\b/g) || []).length, 1);
assert(html.includes('data-vapour-word>Casos') && html.includes('data-vapour-word>reales.'));
assert(!html.includes('/#process'));
assert(html.indexOf('/assets/scroll-story.js') < html.indexOf('/assets/case-index-motion.js'));
assert(/canvas[^>]+aria-hidden="true"/.test(html));
const runtime = readFileSync(new URL('../src/case-index-motion.ts', import.meta.url), 'utf8');
assert(!/setTimeout|setInterval|requestAnimationFrame/.test(runtime), 'the effect uses the existing scroll clock without a timed cycle');
assert.equal((html.match(/data-vapour-block(?:>|\s)/g) || []).length, 3, 'intro, title and signature participate in the effect');
assert(!/<span class="case-scroll-cue"[^>]*data-vapour-block/.test(html), 'scroll hint keeps its independent first-scroll dismissal');
// Exercise the page controller with three blocks, including font loading and reduced motion.
{
  const {transform} = await import('esbuild');
  const {default: vm} = await import('node:vm');
  const source = (await transform(runtime.replace(/^import .+;\n/gm, ''), {loader:'ts',target:'es2022'})).code;
  const clients:Array<{measure:()=>void;render:(state:{y:number;height:number;dt?:number;immediate?:boolean})=>boolean}>=[];
  const listeners:Array<(event:{persisted:boolean})=>void>=[];
  const media={matches:false,addEventListener(){},removeEventListener(){}};
  let resolveFonts:()=>void=()=>{}, geometry=0, destroyed=0, observed=0;
  const ready=new Promise<void>(resolve=>{resolveFonts=resolve;});
  const poses=[[],[],[]] as number[][];
  const elements=poses.map((values,index)=>({index,querySelector:()=>({}),values}));
  const hero={offsetHeight:400,getBoundingClientRect(){geometry++;return{top:120};},querySelectorAll:()=>elements};
  const clock={approach:(value:number,target:number,dt:number,immediate:boolean)=>immediate?target:value+(target-value)*.5,subscribe(client:typeof clients[number]){clients.push(client);return()=>{};},invalidate(){clients.forEach(client=>client.measure());}};
  vm.runInNewContext(source,{
    window:{HevenMotion:clock,innerHeight:900,scrollY:0,matchMedia:()=>media,addEventListener:(_:string,fn:typeof listeners[number])=>listeners.push(fn)},
    document:{querySelector:(selector:string)=>selector==='[data-case-vapour]'?hero:null,fonts:{ready}},
    ResizeObserver:class{observe(){observed++;}disconnect(){}},
    createCaseChoreography:()=>()=>{},createStaticVelvetHaze:()=>null,vaporProgress,
    createVapourRenderer:(element:typeof elements[number])=>({measure(){},render(value:number){element.values.push(value);},destroy(){destroyed++;}}),
  });
  clock.invalidate();clients.forEach(client=>client.render({y:308,height:900}));
  assert(poses.every(values=>values.at(-1)===0),'text stays intact until fonts are ready');
  resolveFonts();await ready;await Promise.resolve();
  const measuredGeometry=geometry;
  for(const y of [148,308,468,308,148]){
    clients.forEach(client=>client.render({y,height:900,dt:16.67,immediate:true}));
    assert(poses.every(values=>values.at(-1)===vaporProgress(y,148,320)),'all three blocks share the same reversible scroll phase');
  }
  const flowing=clients.map(client=>client.render({y:308,height:900,dt:16.67,immediate:false}));
  assert(poses.every(values=>values.at(-1)!>0&&values.at(-1)!<vaporProgress(308,148,320))&&flowing.some(Boolean),'native scroll uses finite follow easing for all hero text');
  assert.equal(geometry,measuredGeometry,'scroll does not read hero geometry');assert.equal(observed,3);
  media.matches=true;clock.invalidate();clients.forEach(client=>client.render({y:468,height:900}));
  assert(poses.every(values=>values.at(-1)===0),'reduced motion restores all text');
  listeners.forEach(fn=>fn({persisted:true}));assert.equal(destroyed,0);
  listeners.forEach(fn=>fn({persisted:false}));assert.equal(destroyed,3,'cleanup releases every text canvas');
}
console.log('PASS: vapour poses are deterministic and reversible; bounded opacity, cached drawing, no idle redraw, HTML fallback, teardown, semantic title and shared-clock integration.');

// The rollback restores the established layout; the background has no motion inputs.
assert(!html.includes('case-index-media') && !html.includes('<br><span data-vapour-word>'));
assert(html.includes('<div class="case-card-bottom">') && !/\(04 proyectos\)|\(SIGUIENTE PROYECTO\)/.test(html));
const css = readFileSync(new URL('../assets/case-index.css', import.meta.url), 'utf8');
assert(!/case-gutter|grid-template|case-reveal|case-image-y|case-ambient-y/.test(css),'effect stylesheet does not rearrange the established layout');
assert(!/pointermove|case-ambient-y|case-image-y|case-reveal/.test(runtime),'index runtime no longer moves background or cards');
console.log('PASS: established case layout preserved and static background isolated from choreography.');

const {createStaticVelvetHaze, STATIC_HAZE_FRAGMENT, hexToRgb} = await import('../lib/velvet-haze');
assert.deepEqual(hexToRgb('#fff'), [1, 1, 1]);assert.deepEqual(hexToRgb('bad-color'), [0, 0, 0]);
let paints = 0, programsFreed = 0, verticesFreed = 0, resize: () => void = () => {};
const events: Record<string,(event?:unknown)=>void> = {}, attributes = new Set<string>();
const gl = {
 VERTEX_SHADER:1, FRAGMENT_SHADER:2, COMPILE_STATUS:3, LINK_STATUS:4, TRIANGLES:5,
 createShader:()=>({}),shaderSource(){},compileShader(){},getShaderParameter:()=>true,deleteShader(){},
 createProgram:()=>({}),attachShader(){},linkProgram(){},getProgramParameter:()=>true,
 deleteProgram(){programsFreed++;},createVertexArray:()=>({}),deleteVertexArray(){verticesFreed++;},
 useProgram(){},bindVertexArray(){},viewport(){},uniform2f(){},uniform1f(){},uniform3fv(){},getUniformLocation:()=>({}),drawArrays(){paints++;},
};
const hazeCanvas = {
 clientWidth: 1200,clientHeight:800,width:0,height:0,getContext:()=>gl,
 setAttribute:(name:string)=>attributes.add(name),removeAttribute:(name:string)=>attributes.delete(name),
 addEventListener:(name:string,fn:(event?:unknown)=>void)=>{events[name]=fn;},removeEventListener:(name:string)=>{delete events[name];},
};
Object.assign(globalThis,{ResizeObserver:class{constructor(callback:()=>void){resize=callback;}observe(){}disconnect(){}}});
const disposeHaze = createStaticVelvetHaze(hazeCanvas as unknown as HTMLCanvasElement)!;
assert.equal(paints,1,'background paints a single frozen exposure');assert(attributes.has('data-haze-ready'));
resize();resize();assert.equal(paints,1,'unchanged size does not redraw');
hazeCanvas.clientWidth=900;resize();assert.equal(paints,2,'resize redraws once');
events.webglcontextlost({preventDefault(){}});assert(!attributes.has('data-haze-ready'),'context loss exposes the static CSS fallback');resize();assert.equal(paints,2);
events.webglcontextrestored();assert.equal(paints,3,'context restoration rebuilds the static frame');
disposeHaze();assert(programsFreed>=2&&verticesFreed>=2,'cleanup releases GPU objects');assert.equal(Object.keys(events).length,0);
assert.equal(createStaticVelvetHaze({getContext:()=>null} as unknown as HTMLCanvasElement),null,'WebGL-unavailable fallback');
const hazeSource=readFileSync(new URL('../lib/velvet-haze.ts',import.meta.url),'utf8');
assert(!/requestAnimationFrame|setInterval|setTimeout|pointermove|pointerdown|uTime|uFrame|uLamp|uRipple/.test(hazeSource),'static background has no clock, pointer or click effects');
assert(STATIC_HAZE_FRAGMENT.includes('smoothstep(edge-soft,edge+soft,q.y)'), 'fold uses defined smoothstep edge order');
console.log('PASS: frozen haze draws only initially/on resize, caches equal sizes, restores context, releases resources and has no pointer or time uniforms.');

const {createStaticAuroraVeil, AURORA_FRAGMENT, AURORA_PALETTE} = await import('../lib/aurora-veil');
const beforeAurora=paints;
const disposeAurora=createStaticAuroraVeil(hazeCanvas as unknown as HTMLCanvasElement)!;
assert.equal(paints,beforeAurora+1);assert(hazeCanvas.width*hazeCanvas.height<=620_000,'detail background caps the framebuffer size');
resize();assert.equal(paints,beforeAurora+1,'frozen aurora has no idle redraw');
assert.equal(AURORA_PALETTE.shadow,'#000000');assert(AURORA_FRAGMENT.includes('smoothstep(.02,.38,fromTop)'),'upper field stays black');
events.webglcontextlost({preventDefault(){}});assert(!attributes.has('data-haze-ready'));events.webglcontextrestored();assert(attributes.has('data-haze-ready'));disposeAurora();
console.log('PASS: adapted Aurora Veil uses a black upper field, bounded framebuffer, static exposure, context recovery and cleanup.');


const {caseEntrance, caseDepth, entranceEase, createCaseChoreography} = await import('../lib/case-choreography');
const {default: profileVM} = await import('node:vm');
const profileWindow: Record<string,unknown> = {scrollY:0,innerHeight:900,matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){}};
profileVM.runInNewContext(readFileSync(new URL('../assets/scroll-story.js',import.meta.url),'utf8'),{window:profileWindow,document:{hidden:false,querySelector:()=>null,addEventListener(){}},requestAnimationFrame:()=>1,cancelAnimationFrame(){}});
const sharedProfile = profileWindow.HevenMotion as {settings:Parameters<typeof caseEntrance>[0] & {wheelGain:number;wheelEase:number;followEase:number};approach:(value:number,target:number,dt:number,immediate:boolean)=>number};
assert.equal(sharedProfile.settings.wheelGain,.68);assert.equal(sharedProfile.settings.wheelEase,110);assert.equal(sharedProfile.settings.followEase,70);
assert.equal(entranceEase(0),0);assert.equal(entranceEase(1),1);
assert(entranceEase(.1)<.02 && entranceEase(.2)-entranceEase(.1)>entranceEase(.1),'entrance starts gently and accelerates');
const first = caseEntrance(sharedProfile.settings,500,1200,900), second = caseEntrance(sharedProfile.settings,500,1200,900,sharedProfile.settings.stagger);
assert(first.y<second.y,'the second item enters after the first');assert(first.captionY>0,'caption has its own delayed arrival');
for(let y=0;y<8000;y+=50)assert(Math.abs(caseDepth(y,1200,600,900,sharedProfile.settings.parallax))<=sharedProfile.settings.parallax,'image depth stays inside the overscan');
let layoutReads=0, measuredClient: {measure:()=>void;render:(s:{y:number;height:number;dt?:number;immediate?:boolean})=>boolean};
let invalidations=0;
const mediaMotion={matches:false,addEventListener(){},removeEventListener(){}};
const frameWindow={innerHeight:900,innerWidth:1400,scrollY:0,matchMedia:()=>mediaMotion};
const motionStyle=()=>{const data:Record<string,string>={};return{data,setProperty:(k:string,v:string)=>{data[k]=v;},removeProperty:(k:string)=>{delete data[k];}};};
const photoMotion={style:motionStyle()};
const classNames=new Set<string>();
const motionCard={style:motionStyle(),offsetHeight:600,querySelector:()=>photoMotion,contains:()=>true,classList:{add:(s:string)=>classNames.add(s),remove:(s:string)=>classNames.delete(s)},getBoundingClientRect(){layoutReads++;return{top:1200-frameWindow.scrollY+(parseFloat(this.style.data['--case-entry-y'])||0)};}};
const eventHandlers:Record<string,(event:unknown)=>void>={};
Object.assign(globalThis,{window:frameWindow,document:{querySelectorAll:(s:string)=>s.includes('case-index-grid')?[motionCard]:[],addEventListener:(s:string,fn:(event:unknown)=>void)=>{eventHandlers[s]=fn;},removeEventListener:(s:string)=>{delete eventHandlers[s];}}});
const motionClock={settings:sharedProfile.settings,approach:sharedProfile.approach,subscribe(client:typeof measuredClient){measuredClient=client;return()=>{};},invalidate(){invalidations++;measuredClient.measure();}};
const disposeMotion=createCaseChoreography(motionClock);measuredClient!.measure();
const readCount=layoutReads;measuredClient!.render({y:500,height:900});assert.equal(layoutReads,readCount,'scroll frames do not measure layout');
const shiftBefore=motionCard.style.data['--case-entry-y'];measuredClient!.measure();measuredClient!.render({y:500,height:900});assert(Math.abs(parseFloat(shiftBefore)-parseFloat(motionCard.style.data['--case-entry-y']))<1e-8,'own shift never changes the trigger');
eventHandlers.focusin({target:motionCard});measuredClient!.render({y:0,height:900,dt:16.67,immediate:false});assert.equal(motionCard.style.data['--case-entry-opacity'],'1','focused content is immediately presented');assert(invalidations>0);
mediaMotion.matches=true;measuredClient!.measure();assert.equal(photoMotion.style.data['--case-image-depth'],undefined);assert.equal(motionCard.style.data['--case-entry-y'],undefined,'reduced motion clears offsets');
disposeMotion();assert.equal(classNames.size,0);assert(!('focusin' in eventHandlers));
// Every row gets the same rhythm, including after switching to one mobile column.
mediaMotion.matches=false;
const rowCards=Array.from({length:4},(_,index)=>({...motionCard,style:motionStyle(),
  getBoundingClientRect(){return{top:1200+Math.floor(index/2)*1000-frameWindow.scrollY+(parseFloat(this.style.data['--case-entry-y'])||0)};}}));
Object.assign(globalThis,{document:{querySelectorAll:(selector:string)=>selector.includes('case-index-grid')?rowCards:[],addEventListener(){},removeEventListener(){}}});
const disposeRows=createCaseChoreography(motionClock);measuredClient!.measure();measuredClient!.render({y:500,height:900});
const firstRow=rowCards.slice(0,2).map(card=>card.style.data['--case-entry-y']);
measuredClient!.render({y:1500,height:900});
assert.deepEqual(rowCards.slice(2).map(card=>card.style.data['--case-entry-y']),firstRow,'row two repeats row one timing instead of accumulating delay');
disposeRows();
for(const [index,card] of rowCards.entries())card.getBoundingClientRect=()=>({top:1200+index*1000-frameWindow.scrollY+(parseFloat(card.style.data['--case-entry-y'])||0)});
const disposeMobileRows=createCaseChoreography(motionClock);
measuredClient!.measure();measuredClient!.render({y:1500,height:900});
assert.equal(rowCards[1].style.data['--case-entry-y'],firstRow[0],'single-column cards have no obsolete second-column delay');
disposeMobileRows();
console.log('PASS: eased acceleration, row stagger, caption delay, bounded image parallax, cached geometry, keyboard presentation, reduced motion and cleanup.');

// Reusing the home footer must also preserve its navigation and keyboard behavior.
const homeHtml = readFileSync(new URL('../index.html',import.meta.url),'utf8');
const homeFooter = homeHtml.slice(homeHtml.indexOf('  <div class="sticky-footer-wrapper">'),homeHtml.lastIndexOf('</body>')).trim();
const caseFooter = html.slice(html.indexOf('  <div class="sticky-footer-wrapper">'),html.lastIndexOf('</body>')).replaceAll('href="/#','href="#').trim();
assert.equal(caseFooter,homeFooter,'case page reuses exactly the home footer with cross-page anchors');
assert(html.includes('data-home-navigation')&&html.includes('/assets/home-finish.js'),'home controller owns case navigation and footer');
const {default: footerVM}=await import('node:vm');
const footerWindowEvents:Record<string,(e:any)=>void>={};
const footerDocEvents:Record<string,(e:unknown)=>void>={}, footerObservers:Array<{callback:(entries:unknown[])=>void;observe:()=>void;disconnect:()=>void}>=[];
const classList=()=>{const names=new Set<string>();return{names,contains:(n:string)=>names.has(n),add:(n:string)=>names.add(n),toggle(n:string,on:boolean){if(on)names.add(n);else names.delete(n);}};};
const menuAttrs:Record<string,string>={'aria-expanded':'false'}, footerNavAttrs:Record<string,string>={};
let menuClick:()=>void=()=>{}, homeClick:()=>void=()=>{}, panelClick:(e:any)=>void=()=>{}, escapeKey:(e:unknown)=>void=()=>{};
const footerMain={inert:false}, footerBody={classList:classList()}, footerColumns=[{classList:classList()}];
const footerLink={focused:false,focus(){this.focused=true;}}, menuLink={focus(){}};
const footerPanel={inert:true,setAttribute(){},querySelector:()=>menuLink,addEventListener:(name:string,fn:(e:any)=>void)=>{if(name==='click')panelClick=fn;}};
const footerToggle={setAttribute:(k:string,v:string)=>{menuAttrs[k]=v;},getAttribute:(k:string)=>menuAttrs[k],addEventListener:(name:string,fn:()=>void)=>{if(name==='click')menuClick=fn;},focus(){}};
const footerHome={addEventListener:(name:string,fn:()=>void)=>{if(name==='click')homeClick=fn;}};
const footerNav={inert:false,classList:classList(),setAttribute:(k:string,v:string)=>{footerNavAttrs[k]=v;},contains:()=>false,querySelector:(s:string)=>s==='.cinema-nav-mark'?footerHome:null};
const sharedFooter={inert:false,classList:classList(),querySelector:()=>footerLink,querySelectorAll:()=>footerColumns,getBoundingClientRect:()=>({top:1200,bottom:2100})};
const FooterIO=class{callback:(entries:unknown[])=>void;constructor(callback:(entries:unknown[])=>void){this.callback=callback;footerObservers.push(this);}observe(){}disconnect(){}};
footerVM.runInNewContext(readFileSync(new URL('../assets/home-finish.js',import.meta.url),'utf8'),{
 window:{innerHeight:900,matchMedia:()=>({matches:false,addEventListener(){}}),IntersectionObserver:FooterIO,addEventListener:(name:string,fn:(e:any)=>void)=>{footerWindowEvents[name]=fn;}},
 document:{body:footerBody,activeElement:null,querySelector:(s:string)=>s==='.cinema-menu-toggle'?footerToggle:s==='main'?footerMain:s==='.sticky-footer-wrapper'?sharedFooter:s==='.cinema-nav'?footerNav:null,getElementById:(s:string)=>s==='mobile-menu-panel'?footerPanel:null,querySelectorAll:()=>[],addEventListener:(s:string,fn:(e:unknown)=>void)=>{footerDocEvents[s]=fn;if(s==='keydown')escapeKey=fn;}},
 IntersectionObserver:FooterIO,requestAnimationFrame:(fn:()=>void)=>{fn();return 1;},clearTimeout(){},setTimeout(){},
});
assert(!footerNav.inert,'dock is available above the footer');
footerObservers[0].callback([{target:sharedFooter,isIntersecting:true,intersectionRect:{height:100}}]);assert(footerNav.inert&&footerNavAttrs['aria-hidden']==='true','dock hides when footer enters');
menuClick();assert(footerMain.inert&&sharedFooter.inert&&!footerPanel.inert,'menu isolates content for keyboard users');
escapeKey({key:'Escape'});assert(!footerMain.inert&&footerPanel.inert&&footerLink.focused,'escape returns focus to footer when dock is hidden');
footerObservers[0].callback([{target:sharedFooter,isIntersecting:false,intersectionRect:{height:0}}]);assert(!footerNav.inert,'dock returns when leaving footer');
menuClick();panelClick({target:{closest:(selector:string)=>selector==='a[href]'?{}:null}});
assert(!footerMain.inert&&footerPanel.inert,'Projects page link closes the mobile menu before navigation');
menuClick();homeClick();assert(!footerMain.inert&&footerPanel.inert,'home star link closes the menu and restores page access before navigation');
menuClick();footerWindowEvents.pageshow({persisted:true});
assert(!footerMain.inert&&footerPanel.inert,'back navigation cannot restore an open, inert menu state');
footerObservers[1].callback([{isIntersecting:true}]);assert(footerColumns[0].classList.contains('visible'),'footer content is revealed');
console.log('PASS: matching home footer, cross-page anchors, one navigation owner, dock visibility, menu isolation, escape focus and footer reveal.');

const menuSection=(page:string)=>page.slice(page.indexOf('id="mobile-menu-panel"'),page.indexOf('</div>',page.indexOf('id="mobile-menu-panel"')));
const studioSection=(page:string)=>page.slice(page.indexOf('id="fc1"'),page.indexOf('</ul>',page.indexOf('id="fc1"')));
const navLinks=(section:string)=>[...section.matchAll(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g)].map(match=>[match[1],match[2]]);
assert.deepEqual(navLinks(studioSection(homeHtml)),navLinks(menuSection(homeHtml)),'home studio links match its menu');
assert.deepEqual(navLinks(studioSection(html)),navLinks(menuSection(html)),'case studio links match its menu');
assert(homeFooter.includes('footer-atmosphere flow-light'),'both footers have the identical explicit gradient layer');
assert(html.includes('class="case-scroll-cue"'),'scroll cue occupies the removed counter slot');
assert(runtime.includes("state.y > 1")&&runtime.includes("cue.classList.add('is-dismissed')"),'cue dismisses on the first scroll');
console.log('PASS: identical menu/footer destinations, shared footer light, first-scroll cue and shared home motion profile.');

