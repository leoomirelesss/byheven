import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';

export function verifyDelivery(out) {
  const paths = ['index.html','case-studies/index.html',...['emyasa','stone-kuche','parsomen','dor','dor-os','academic-quest'].map(s=>`case-studies/${s}/index.html`)];
  for (const path of paths) {
    const html = readFileSync(resolve(out,path),'utf8');
    assert(!/<link\b[^>]*rel="stylesheet"/.test(html),`${path}: no blocking stylesheet waterfall`);
    assert(!/https:\/\/fonts\.(?:googleapis|gstatic)\.com/.test(html),`${path}: fonts are local`);
    assert(html.includes('data-delivery="fonts"'));
    assert(html.includes('data-delivery="site-loading"') && html.includes('data-delivery="page-transitions"'));
    assert(!/<script src="\/assets\/(?:site-loading|page-transitions)\.js"/.test(html));
    assert(html.includes('data-delivery="/assets/mobile-experience.css"'));
    assert.equal((html.match(/<h2 class="footer-nav-title">/g)||[]).length,2,'semantic footer headings on every page');
    // Inline resources no longer have an asset-directory base URL.
    for (const [,style] of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)) {
      for (const match of style.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/g)) {
        const url=(match[1]??match[2]??match[3]).trim();
        if(url.startsWith('/')) assert(existsSync(resolve(out,url.slice(1))),`${path}: missing inline resource ${url}`);
        else assert(/^(?:data:|https?:|#)/.test(url),`${path}: relative inline URL`);
      }
    }
    const fonts=[...html.matchAll(/<link rel="preload" href="([^"]+)" as="font"/g)];
    assert.equal(fonts.length,2,'only the hero family and brand subset are preloaded');
    for(const [,url] of fonts) assert(existsSync(resolve(out,url.slice(1))));
  }
  const home=readFileSync(resolve(out,'index.html'),'utf8');
  const preload=home.match(/<link rel="preload" as="image"[^>]+>/)?.[0];
  assert(preload?.includes('media="(max-width: 899px)"'),'desktop does not preload the mobile phone');
  assert(preload.includes('type="image/avif"') && preload.includes('fetchpriority="high"'));
  const source=home.match(/<source media="\(max-width: 899px\)" type="image\/avif"[^>]+>/)?.[0];
  assert(source,'AVIF enhancement with existing WebP fallback');
  for(const attribute of ['srcset','sizes']) {
    assert.equal(source.match(new RegExp(`${attribute}="([^"]+)"`))[1],preload.match(new RegExp(`image${attribute}="([^"]+)"`))[1],'preload and visible source choose the same resource');
  }
  assert(/class="flow-mobile-device"[\s\S]*?<img[^>]+fetchpriority="high"/.test(home));
  assert.equal((home.match(/<picture><source[^>]+\/assets\/cases\/mobile\//g)||[]).length,4);
  console.log('PASS: eight optimized documents, no blocking CSS/font API chain, intact media wrappers, inline transition/loading setup, valid local fonts, mobile-only matching LCP preload and semantic footer headings.');
}
