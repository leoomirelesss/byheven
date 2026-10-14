import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {build} from 'esbuild';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {createPhone} from './model.mjs';

// GLTFExporter only needs Blob reading here; textures are loaded separately.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(result => { this.result=result; this.onloadend?.(); }).catch(error=>this.onerror?.(error));
  }
};
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const out=resolve(root,'assets/phone');
await mkdir(out,{recursive:true});
const glb=await new GLTFExporter().parseAsync(createPhone(),{binary:true,trs:true});
await writeFile(resolve(out,'heven-phone.glb'),Buffer.from(glb));
await build({entryPoints:[resolve(root,'tools/phone/runtime.mjs')],outfile:resolve(out,'phone-scene.js'),bundle:true,minify:true,format:'esm',target:['es2020'],legalComments:'external'});
await writeFile(resolve(out,'THREE-LICENSE.txt'),await readFile(new URL('./node_modules/three/LICENSE',import.meta.url)));
console.log(`Phone GLB: ${glb.byteLength} bytes. Runtime bundled.`);
