import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {Texture,Box3,Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import validator from 'gltf-validator';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {getBounds} from '@gltf-transform/functions';

const bytes=await readFile(new URL('../../assets/phone/iphone-17-pro.glb',import.meta.url));
const result=await validator.validateBytes(new Uint8Array(bytes));
assert.equal(result.issues.numErrors,0,JSON.stringify(result.issues.messages));
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS),model=await io.readBinary(bytes);
const bounds=getBounds(model.getRoot().listScenes()[0]);
assert(Math.abs(bounds.max[0]-bounds.min[0]-2)<.01);
assert(Math.abs(bounds.max[1]-bounds.min[1]-4.104)<.01);
const display=model.getRoot().listMaterials().find(m=>m.getName()==='PLIEGUE Display');
assert(display?.getExtension('KHR_materials_unlit'));
assert(display.getBaseColorTexture().getImage().length>0);
let triangles=0;
for(const mesh of model.getRoot().listMeshes())for(const primitive of mesh.listPrimitives()){
 triangles+=(primitive.getIndices()?.getCount() || primitive.getAttribute('POSITION').getCount())/3;
 if(primitive.getMaterial()===display){const uv=primitive.getAttribute('TEXCOORD_0');for(let i=0;i<uv.getCount();i++)for(const value of uv.getElement(i,[]))assert(value>=0 && value<=1);}
}
assert(triangles<55000);assert(bytes.length<2000000);
const browserLoader=new GLTFLoader().register(()=>({name:'EXT_texture_webp',loadTexture:async()=>new Texture()}));
const loaded=await browserLoader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
let displayMesh;loaded.scene.traverse(mesh=>{if(mesh.isMesh && mesh.material?.name==='PLIEGUE Display')displayMesh=mesh;});
assert(displayMesh?.material.isMeshBasicMaterial);
const loadedSize=new Box3().setFromObject(loaded.scene).getSize(new Vector3());
assert(Math.abs(loadedSize.x-2)<.01 && Math.abs(loadedSize.y-4.104)<.01);

// Exercise the real scroll controller: emitted 3D poses, reverse, fallback and reduced motion.
const code=await readFile(new URL('../../assets/shopify-hero.js',import.meta.url),'utf8');
const listeners={}, events=[], queued=new Map();
let rafId=0,time=0;
const motion={matches:false,addEventListener:(type,fn)=>listeners.motion=fn};
const style=()=>({values:{},setProperty(key,value){this.values[key]=value;},removeProperty(key){delete this.values[key];}});
const slides=Array.from({length:3},()=>({style:style(),classList:{toggle(){},add(){}},setAttribute(){},removeAttribute(){}}));
const image={src:''},device={style:style()};
let layoutReads=0;
const scene={clientWidth:1363,get offsetHeight(){layoutReads++;return 936;},dataset:{},style:style(),querySelector:selector=>selector==='.flow-phone-position'?device:image,querySelectorAll:()=>slides,addEventListener(){}};
const win={scrollY:0,innerHeight:936,innerWidth:1363,matchMedia:query=>query.includes('reduced')?motion:{matches:true},addEventListener:(type,fn)=>listeners[type]=fn,dispatchEvent:event=>{events.push(event.detail);listeners[event.type]?.(event);}};
const story={offsetHeight:936*4.04,querySelector:()=>scene,toggleAttribute(){},getBoundingClientRect:()=>({top:-win.scrollY})};
const doc={querySelector:selector=>selector==='[data-flow-story]'?story:null,getElementById:()=>null,addEventListener:(type,fn)=>listeners[type]=fn};
const context=vm.createContext({window:win,document:doc,Image:class{decode(){return Promise.resolve();}},requestAnimationFrame:fn=>{queued.set(++rafId,fn);return rafId;},cancelAnimationFrame:id=>queued.delete(id),CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}}});
vm.runInContext(await readFile(new URL('../../assets/scroll-story.js',import.meta.url),'utf8'),context);
vm.runInContext(code,context);
const flush=()=>{let count=0;while(queued.size&&count++<150){time+=1000/60;const batch=[...queued.values()];queued.clear();batch.forEach(fn=>fn(time));}assert.equal(queued.size,0);};
const at=y=>{win.scrollY=y;listeners.scroll();flush();return events.at(-1);};
flush();
assert.equal(events.at(-1).index,0);assert(image.src.endsWith('screen-home.webp'));
const step=936*1.32;
const middle=at(step);assert.equal(middle.index,1);assert.equal(middle.ry,360);assert.equal(middle.rx,0);assert(image.src.endsWith('screen-collection.webp'));
const end=at(step*2);assert.equal(end.index,2);assert.equal(end.ry,720);assert.equal(end.rx,0);assert(image.src.endsWith('screen-product.webp'));
assert.deepEqual(at(step),middle,'Scroll must reverse to the identical pose');
assert.equal(slides[0].style.values['--slide-y'],`${-936}px`);
assert.equal(slides[1].style.values['--slide-y'],'0px');
assert.equal(slides[2].style.values['--slide-y'],`${936}px`);
assert(!('--slide-opacity' in slides[1].style.values),'Text must scroll instead of crossfading');
let previous=at(0),swaps=0;
const forward=[];
for(let i=0;i<=200;i++){
 const pose=at(step*i/100);forward.push(pose);
 assert(pose.ry>=previous.ry,'Rotation must advance continuously');
 assert(Math.abs(pose.ry-previous.ry)<8,'No rotation jumps');
 if(pose.index!==previous.index){swaps++;assert(Math.cos(pose.ry*Math.PI/180)<-.9,'Change the screen while the back is visible');}
 previous=pose;
}
assert.equal(swaps,2);
for(let i=200;i>=0;i--)assert.deepEqual(at(step*i/100),forward[i],'Reverse scroll must replay every pose exactly');
assert.equal(at(step*.1).ry,-24,'Hold the opening pose before the transition');
assert.equal(at(step*.9).ry,360,'Arrive front-facing before the next chapter');
assert.equal(at(step*1.1).ry,360,'Keep the next chapter front-facing');
assert.equal(at(-500).progress,0);assert.equal(at(99999).progress,2);
const readsBefore=layoutReads;at(step*.4);assert.equal(layoutReads,readsBefore,'scroll updates do not read layout');
scene.clientWidth=390;win.innerWidth=390;listeners.resize();flush();const mobile=at(step);assert.equal(mobile.ry,360);assert.equal(mobile.left,28);
assert.equal(at(step*2).ry,720);
motion.matches=true;listeners.motion();flush();assert.equal(events.at(-1).index,0);assert(slides.every(slide=>slide.inert===false));
const staticCount=events.length;at(1400);assert.equal(events.length,staticCount,'Reduced motion must not animate');
console.log(JSON.stringify({glbBytes:bytes.length,triangles,errors:result.issues.numErrors,warnings:result.issues.numWarnings,checks:'Geometry, glTF, UVs, full rotations, hidden screen swaps, vertical text, 201 reversible poses, mobile and reduced motion passed.'},null,2));

