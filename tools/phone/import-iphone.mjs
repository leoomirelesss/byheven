// Usage: node import-iphone.mjs /path/to/user-supplied.glb
import {readFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS,KHRMaterialsUnlit,EXTTextureWebP} from '@gltf-transform/extensions';
import {textureCompress,dedup,prune,weld,quantize,getBounds,dequantize} from '@gltf-transform/functions';
import sharp from 'sharp';

if(!process.argv[2]) throw new Error('Supply the original GLB path.');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc=await io.read(process.argv[2]);
const scene=doc.getRoot().listScenes()[0],bounds=getBounds(scene);
const scale=2/(bounds.max[0]-bounds.min[0]);
const rig=doc.createNode('HevenPhone').setRotation([0,1,0,0]).setScale([scale,scale,scale]);
for(const node of [...scene.listChildren()]) {scene.removeChild(node);rig.addChild(node);}
scene.addChild(rig);
rig.setExtras({source:'User-supplied iphone-17-pro.zip',displayMaterial:'PLIEGUE Display',textureOrder:['home','collection','product']});
const display=doc.getRoot().listMaterials().find(material=>material.getName()==='OLED');
if(!display) throw new Error('OLED material not found');
const unlit=doc.createExtension(KHRMaterialsUnlit);
const home=doc.createTexture('PLIEGUE display').setImage(await readFile(resolve(root,'assets/phone/screen-home.webp'))).setMimeType('image/webp');
doc.createExtension(EXTTextureWebP).setRequired(true);
display.setName('PLIEGUE Display').setBaseColorFactor([1,1,1,1]).setBaseColorTexture(home).setEmissiveTexture(null).setEmissiveFactor([0,0,0]).setMetallicFactor(0).setRoughnessFactor(1).setExtension('KHR_materials_unlit',unlit.createUnlit());
for(const extension of display.listExtensions()) if(extension.extensionName!=='KHR_materials_unlit') display.setExtension(extension.extensionName,null);
// Source front faces -Z. The rig turns it toward our +Z camera.
// Rebuild the display UVs from the source's X/Z coordinates.
for(const mesh of doc.getRoot().listMeshes()) for(const primitive of mesh.listPrimitives()) {
  if(primitive.getMaterial()!==display) continue;
  const p=primitive.getAttribute('POSITION'),a=p.getArray(),uv=new Float32Array(p.getCount()*2),min=p.getMin([]),max=p.getMax([]);
  for(let i=0;i<p.getCount();i++) {uv[2*i]=(max[0]-a[3*i])/(max[0]-min[0]);uv[2*i+1]=(a[3*i+2]-min[2])/(max[2]-min[2]);}
  primitive.setAttribute('TEXCOORD_0',doc.createAccessor('PLIEGUE screen UV').setType('VEC2').setArray(uv).setBuffer(p.getBuffer()));
}
doc.getRoot().listMaterials().find(m=>m.getName()==='Glass')?.setBaseColorFactor([1,1,1,.025]).setAlphaMode('BLEND').setRoughnessFactor(.15);
doc.getRoot().listMaterials().find(m=>m.getName()==='Anodized aluminum')?.setBaseColorFactor([.13,.14,.16,1]).setMetallicFactor(.82).setRoughnessFactor(.29).setNormalScale(.08);
doc.getRoot().listMaterials().find(m=>m.getName()==='Frosted glass')?.setBaseColorFactor([.045,.047,.05,1]).setRoughnessFactor(.33).setNormalScale(.035);
await doc.transform(textureCompress({encoder:sharp,targetFormat:'webp',resize:[512,512],pattern:/normal|Concentrico|mesh|wallpaper/i,quality:88}),dedup(),prune(),weld(),quantize({quantizePosition:14,quantizeNormal:10,quantizeTexcoord:12}),prune());
const output=resolve(root,'assets/phone/iphone-17-pro.glb');await io.write(output,doc);
console.log(JSON.stringify({output,bytes:(await readFile(output)).length,bounds:getBounds(scene)}));
// Optional float-coordinate copy for offline renderers without quantization support.
if(process.argv[3]) {await doc.transform(dequantize());await io.write(process.argv[3],doc);}
