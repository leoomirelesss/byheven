import assert from 'node:assert/strict';
import {existsSync, readFileSync, readdirSync} from 'node:fs';
import {resolve} from 'node:path';

// Run against the built output: a deleted source must not leave a broken public URL.
export function verifyPublicSite(directory) {
  const files = [];
  const walk = path => {
    for (const entry of readdirSync(resolve(directory, path), {withFileTypes: true})) {
      const next = path ? path + '/' + entry.name : entry.name;
      if (entry.isDirectory()) walk(next);
      else files.push(next);
    }
  };
  walk('');
  const pages = ['index.html', 'case-studies/index.html', ...['emyasa','stone-kuche','parsomen','dor','dor-os','academic-quest'].map(slug => `case-studies/${slug}/index.html`)];
  assert.deepEqual(files.filter(path => path.endsWith('.html')).sort(), pages.sort(), 'only the eight current pages are published');
  const origin = 'https://site.invalid';
  let references = 0;
  const check = (reference, from, anchor = false) => {
    if (!reference || reference.startsWith('data:') || reference.includes('${')) return;
    const url = new URL(reference.replaceAll('&amp;', '&'), origin + '/' + from);
    if (url.origin !== origin) return;
    let target = decodeURIComponent(url.pathname).slice(1);
    if (!target || target.endsWith('/')) target += 'index.html';
    assert(existsSync(resolve(directory, target)), `${from} points to missing ${target}`);
    if (anchor && url.hash && target.endsWith('.html')) {
      const markup = readFileSync(resolve(directory, target), 'utf8');
      const ids = [...markup.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]);
      assert(ids.includes(decodeURIComponent(url.hash.slice(1))), `${from} points to missing anchor ${reference}`);
    }
    references++;
  };
  for (const page of pages) {
    const html = readFileSync(resolve(directory, page), 'utf8');
    for (const [,attribute,reference] of html.matchAll(/\b(src|href|poster)=["']([^"']+)["']/g)) check(reference, page, attribute === 'href');
    for (const [,sources] of html.matchAll(/\bsrcset=["']([^"']+)["']/g)) {
      for (const source of sources.split(',')) check(source.trim().split(/\s+/)[0], page);
    }
  }
  for (const file of files.filter(path => /\.(?:css|js)$/.test(path))) {
    const source = readFileSync(resolve(directory, file), 'utf8');
    if (file.endsWith('.css')) {
      for (const match of source.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/g)) check((match[1] ?? match[2] ?? match[3]).trim(), file);
    } else {
      for (const [,path] of source.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g)) check(path, file);
    }
  }
  // The phone builds these names at runtime, so they cannot be inferred from HTML.
  for (const path of ['iphone-17-pro.glb','screen-home.webp','screen-collection.webp','screen-product.webp','phone-scene.js','THREE-LICENSE.txt']) check('/assets/phone/' + path, 'index.html');
  for (const path of ['assets/philosophy-sequence','assets/intro','assets/process','assets/package-card-backgrounds','diseno-web-torreon','phone-model.html']) {
    assert(!existsSync(resolve(directory,path)), `obsolete or development content was published: ${path}`);
  }
  console.log(`PASS: eight public pages, ${references} local references, working anchors/imports, phone resources and no retired pages or legacy media.`);
}
