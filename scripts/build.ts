import {build} from "esbuild";
import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const out = resolve(root, "dist");
await build({entryPoints: [resolve(root, "src/case-index-motion.ts")], outfile: resolve(root, "assets/case-index-motion.js"), bundle: true, format: "esm", target: "es2022", minify: true});
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
const folders = new Set(["assets", "case-studies", "diseno-web-torreon"]);
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (folders.has(entry.name) || (entry.isFile() && /\.(?:html|png|jpe?g|webp|svg|ico|mov|mp4|xml|txt)$/.test(entry.name))) {
    await cp(resolve(root, entry.name), resolve(out, entry.name), { recursive: true });
  }
}
console.log("Built static one-page home; no process island or React/GSAP runtime is shipped by the home.");
