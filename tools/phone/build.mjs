import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {build} from 'esbuild';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const out=resolve(root,'assets/phone');
await mkdir(out,{recursive:true});
await build({entryPoints:[resolve(root,'tools/phone/runtime.mjs')],outfile:resolve(out,'phone-scene.js'),bundle:true,minify:true,format:'esm',target:['es2020'],legalComments:'external'});
await writeFile(resolve(out,'THREE-LICENSE.txt'),await readFile(new URL('./node_modules/three/LICENSE',import.meta.url)));
console.log('Phone runtime bundled.');

