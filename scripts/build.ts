import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { build } from "esbuild";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { ProcessCards } from "../components/process-cards";

const root = fileURLToPath(new URL("../", import.meta.url));
const out = resolve(root, "dist");
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
const folders = new Set(["assets", "case-studies", "diseno-web-torreon"]);
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (folders.has(entry.name) || (entry.isFile() && /\.(?:html|png|jpe?g|webp|svg|ico|mov|mp4|xml|txt)$/.test(entry.name))) {
    await cp(resolve(root, entry.name), resolve(out, entry.name), { recursive: true });
  }
}
const source = await readFile(resolve(root, "index.html"), "utf8");
const slot = /<!-- process-cards:start -->[\s\S]*?<!-- process-cards:end -->/;
if (!slot.test(source)) throw new Error("Missing process-card render slot in index.html");
await writeFile(resolve(out, "index.html"), source.replace(slot, `<!-- process-cards:start -->${renderToString(createElement(ProcessCards))}<!-- process-cards:end -->`));
await build({
  absWorkingDir: root,
  entryPoints: ["src/process-cards.tsx"],
  outfile: resolve(out, "assets/process-cards.js"),
  bundle: true,
  format: "iife",
  target: ["es2022"],
  minify: true,
  legalComments: "linked",
  define: { "process.env.NODE_ENV": '"production"' },
});
execFileSync(process.execPath, [resolve(root, "node_modules/@tailwindcss/cli/dist/index.mjs"), "-i", "styles/components.css", "-o", "dist/assets/process-cards.css", "--minify"], { cwd: root, stdio: "inherit" });
console.log("Built static home with server-rendered React process cards.");
