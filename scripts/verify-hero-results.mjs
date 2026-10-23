import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read = p => readFileSync(new URL('../'+p,import.meta.url),'utf8');
const source = read('assets/hero-results.js');
function fixture({mobile=false,reduced=false,broken=false}={}) {
  const events={}, values=new Map(); let measured=0, pathReads=0, writes=0, client, disposed=0;
  const path={getTotalLength(){pathReads++;if(broken)throw Error('unavailable geometry');return 600;},getPointAtLength(x){pathReads++;return{x,y:150-x/5};}};
  const dot={setAttribute(k,v){values.set(k,v);writes++;}};
  const graph={style:{setProperty(k,v){values.set(k,v);writes++;}},getBoundingClientRect(){measured++;return{top:1200-win.scrollY,width:300,height:110};},querySelector:q=>q==='.flow-growth-line'?path:dot};
  const chapter={querySelector:()=>graph},scene={dataset:{storyProgress:'0'}};
  const motion={matches:reduced,addEventListener(type,fn){events.motion=fn;}};
  const clock={subscribe(c){client=c;return()=>{disposed++;client=null;};},reset(){client?.measure();}};
  const win={innerWidth:mobile?390:1440,innerHeight:900,scrollY:0,HevenMotion:clock,matchMedia:()=>motion,
    addEventListener(k,fn){events[k]=fn;},removeEventListener(k,fn){if(events[k]===fn)delete events[k];}};
  vm.runInNewContext(source,{window:win,document:{querySelector:q=>q==='[data-flow-results]'?chapter:scene}});
  return{win,events,motion,values,measure:()=>client.measure(),render:y=>{win.scrollY=y;return client.render({y});},pose:p=>events['flow:pose']?.({detail:{progress:p}}),
    get reads(){return measured+pathReads;},get writes(){return writes;},get disposed(){return disposed;}};
}
const desktop=fixture();desktop.measure();const measured=desktop.reads;
desktop.pose(1.3);assert.equal(desktop.values.get('--growth-rest'),'1');
desktop.pose(1.65);const halfway=Number(desktop.values.get('--growth-rest'));assert(Math.abs(halfway-.5)<1e-8);
desktop.pose(2);assert.equal(desktop.values.get('--growth-rest'),'0');
assert(desktop.values.get('transform').endsWith('scale(2 2)'), 'the endpoint stays round when the SVG is resized');
desktop.pose(1.65);assert.equal(Number(desktop.values.get('--growth-rest')),halfway,'reversing scroll restores the same trace position');
const writes=desktop.writes;desktop.pose(1.65);assert.equal(desktop.writes,writes,'a stationary pose performs no extra writes');
assert.equal(desktop.reads,measured,'scroll never measures DOM or SVG geometry');
assert.equal(desktop.render(800),false,'desktop trace owns no animation loop');
desktop.events.pagehide();assert.equal(desktop.disposed,1);assert(!desktop.events['flow:pose']);
desktop.events.pageshow({persisted:true});desktop.measure();desktop.pose(2);assert.equal(desktop.values.get('--growth-rest'),'0','history restoration reconnects to the shared clock');

const mobile=fixture({mobile:true});mobile.measure();const mobileReads=mobile.reads;
assert.equal(mobile.values.get('--growth-rest'),'1');
mobile.render(579);assert(Math.abs(Number(mobile.values.get('--growth-rest'))-.5)<1e-8);
mobile.render(900);assert.equal(mobile.values.get('--growth-rest'),'0');
mobile.pose(0);assert.equal(mobile.values.get('--growth-rest'),'0','phone pose events cannot interfere with native mobile scroll');
mobile.render(0);assert.equal(mobile.values.get('--growth-rest'),'1');assert.equal(mobile.reads,mobileReads);
mobile.win.innerWidth=1440;mobile.measure();mobile.pose(2);assert.equal(mobile.values.get('--growth-rest'),'0','orientation/breakpoint changes restore the desktop driver');
const reduced=fixture({reduced:true});reduced.measure();reduced.pose(0);assert.equal(reduced.values.get('--growth-rest'),'0','reduced motion keeps the complete trace');
const broken=fixture({broken:true});broken.measure();broken.pose(1.5);assert.equal(broken.values.size,0,'unavailable geometry leaves the static SVG intact');

const html=read('index.html');
assert(html.includes('flow-growth" aria-hidden="true"'),'the trace is decorative and does not pretend to encode a dataset');
assert(html.includes('100</span>') && html.includes('+$200,000</span>'));
assert(html.includes('Caso EMYASA · junio–22 oct. 2026'));
assert(!/ventas extras|ventas adicionales|más de 100 pedidos/i.test(html),'no incremental-sales or unverified-order claims');
assert.equal((html.match(/href="\/case-studies\/emyasa\/#project-work"/g)||[]).length,2,'both result links reach the published evidence');
console.log('PASS: deterministic reversible scroll trace, cached geometry, no independent frames, mobile native flow, reduced motion, breakpoint/history recovery, static fallback and attributed factual results.');
