import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { build, transformSync } from 'esbuild';

const root = new URL('../', import.meta.url);
transformSync(readFileSync(new URL('assets/process-story.css', root), 'utf8'), {loader:'css'});
const result = await build({
 entryPoints:[new URL('lib/process-story-motion.ts',root).pathname],bundle:true,write:false,format:'cjs',platform:'node',
 plugins:[{name:'motion-fixtures',setup(builder){
  builder.onResolve({filter:/^gsap(?:\/|$)/},args=>({path:args.path,namespace:'fixture'}));
  builder.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:args.path==='gsap'?'export const gsap=globalThis.fixtureGSAP;':'export const ScrollTrigger=globalThis.fixtureScrollTrigger;'}));
 }}],
});
const fixtures=[
 {name:'desktop',active:true},{name:'mobile',narrow:true,active:true},
 {name:'reduced motion',reduced:true},{name:'short viewport',short:true},
 {name:'SSR',server:true},{name:'no matchMedia',noMedia:true},
 {name:'unmount before fonts',earlyDispose:true},{name:'detached',detached:true},
 {name:'incomplete title',incomplete:true},{name:'missing index',missingIndex:true},
 {name:'live motion preference',liveMotion:true,active:true},{name:'responsive resize',resize:true,active:true},
];
for(const fixture of fixtures){
 const classes=new Set(), indices=Array.from({length:4},()=>({})), fill={},dot={};
 const pages=Array.from({length:4},(_,i)=>{
  const lines=[{i,line:0},{i,line:1}],copy=[{i,copy:0},{i,copy:1}];
  return {i,lines,copy,querySelector:s=>fixture.incomplete&&i===3?null:lines[0],querySelectorAll:s=>s==='[data-process-line]'?lines:copy};
 });
 const container={isConnected:!fixture.detached,classList:{add:v=>classes.add(v),remove:v=>classes.delete(v)},
  querySelectorAll:s=>s==='[data-process-page]'?pages:fixture.missingIndex?indices.slice(0,3):indices,
  querySelector:s=>s==='[data-process-fill]'?fill:dot};
 const sequences=[],managers=[];let refreshed=0;
 const gsap={
  registerPlugin(...plugins){assert.equal(plugins.length,1);},set(){},
  timeline(config){const sequence={config,children:[],set(targets,to,at){this.children.push({kind:'set',targets,to,at});return this;},
   fromTo(targets,from,to,at){this.children.push({kind:'fromTo',targets,from,to,at});return this;},
   to(targets,to,at){this.children.push({kind:'to',targets,to,at});return this;}};sequences.push(sequence);return sequence;},
  matchMedia(){const manager={conditions:{reduced:!!fixture.reduced,short:!!fixture.short,narrow:!!fixture.narrow},
   add(queries,callback,scope){assert.equal(scope,container);assert(queries.reduced&&queries.short&&queries.narrow);this.callback=callback;this.cleanup=callback({conditions:this.conditions});},
   change(conditions){this.cleanup?.();this.conditions={...this.conditions,...conditions};this.cleanup=this.callback({conditions:this.conditions});},
   revert(){this.cleanup?.();this.reverted=true;}};managers.push(manager);return manager;}
 };
 let ready;const fonts=new Promise(resolve=>{ready=resolve;});const exports={},context={exports,module:{exports},document:{fonts:{ready:fonts}},fixtureGSAP:gsap,fixtureScrollTrigger:{refresh(){refreshed++;}}};
 if(!fixture.server)context.window={...(fixture.noMedia?{}:{matchMedia(){}}),addEventListener(){throw Error('No global wheel/touch interception');}};
 runInNewContext(result.outputFiles[0].text,context);
 const dispose=context.module.exports.initProcessStory(container);if(fixture.earlyDispose)dispose?.();ready();await Promise.resolve();await Promise.resolve();
 assert.equal(sequences.length,fixture.active?1:0,fixture.name);
 assert.equal(classes.has('is-process-story'),!!fixture.active,fixture.name);
 if(fixture.active){
  assert.equal(refreshed,1);const sequence=sequences[0],trigger=sequence.config.scrollTrigger;
  assert.equal(trigger.trigger,container);assert.equal(trigger.start,'top top');assert.equal(trigger.end,'bottom bottom');
  assert(trigger.scrub>0&&trigger.scrub<1&&trigger.invalidateOnRefresh);assert(!trigger.pin&&!trigger.horizontal&&!trigger.scroller);
  pages.forEach((page,i)=>{
   const entry=sequence.children.find(t=>t.targets===page.lines&&t.kind==='fromTo');
   assert.equal(entry.at,i);assert.equal(entry.from.yPercent,112);assert.equal(entry.to.yPercent,0);
   const exit=sequence.children.find(t=>t.targets===page.lines&&t.kind==='to');
   if(i<3){assert(exit.to.yPercent< -100);assert(exit.at>entry.at+entry.to.duration+.4,'a readable hold separates entry from exit');
    assert(exit.at+exit.to.duration+exit.to.stagger<i+1,'the outgoing title clears before the next arrives');}
   else assert(!exit,'the last chapter remains readable as the native sticky stage releases');
  });
  const progress=sequence.children.find(t=>t.targets===fill);assert.equal(progress.from.scaleY,0);assert.equal(progress.to.scaleY,1);
  if(fixture.liveMotion){managers[0].change({reduced:true});assert(!classes.has('is-process-story'));managers[0].change({reduced:false});assert(classes.has('is-process-story'));}
  if(fixture.resize){managers[0].change({narrow:true});assert(classes.has('is-process-story'));}
 }
 dispose?.();assert(!classes.has('is-process-story'),'unmount restores the native list');assert(managers.every(m=>m.reverted),'media contexts clean up');
}
console.log(`PASS: ${fixtures.length} process-story fixtures; one scrubbed sequence, ordered masked entries/exits, reading holds, zero-start progress, native release and static/reduced-motion fallbacks.`);
