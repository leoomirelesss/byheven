import {build} from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { verifyPublicSite } from "./verify-public-site.mjs";
import { verifySEO } from "./verify-seo.mjs";
import { verifyDiscovery } from "./verify-discovery.mjs";
import { indexNowKey } from "./discovery-config.mjs";
const root = fileURLToPath(new URL("../", import.meta.url));
const out = resolve(root, "dist");
await build({entryPoints: [resolve(root, "src/case-index-motion.ts")], outfile: resolve(root, "assets/case-index-motion.js"), bundle: true, format: "esm", target: "es2022", minify: true});
await build({entryPoints: [resolve(root, "src/case-detail-background.ts")], outfile: resolve(root, "assets/case-detail-background.js"), bundle: true, format: "esm", target: "es2022", minify: true});
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
// Explicit public entry points keep old uploads and development pages out of deploys.
for (const path of ["index.html", "robots.txt", "sitemap.xml", `${indexNowKey}.txt`, "assets", "case-studies"]) {
  await cp(resolve(root, path), resolve(out, path), { recursive: true });
}
verifyPublicSite(out);
verifySEO(out);
verifyDiscovery(out);
console.log("Built static one-page home; no process island or React/GSAP runtime is shipped by the home.");
