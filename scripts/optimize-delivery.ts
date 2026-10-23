import { readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { transform } from 'esbuild';

// Keep the authoring files and cascade intact. Ship complete styles in the
// document so the first composition needs no blocking stylesheet round trips.
export async function optimizeDelivery(out: string) {
  const fonts = await readFile(resolve(out, 'assets/fonts/fonts.css'), 'utf8');
  const cache = new Map<string, string>();
  const css = async (source: string) => {
    if (!cache.has(source)) cache.set(source, (await transform(source, {
      loader: 'css', minify: true, target: ['chrome100', 'safari16', 'firefox110'],
    })).code.trim());
    return cache.get(source)!;
  };
  const pages: string[] = [];
  async function walk(directory: string) {
    for (const entry of await readdir(directory, {withFileTypes: true})) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.name.endsWith('.html')) pages.push(path);
    }
  }
  await walk(out);
  for (const page of pages) {
    let html = await readFile(page, 'utf8');
    let hostedFonts = false;
    // Async replacements are applied in source order, including media wrappers.
    const links = [...html.matchAll(/<link\b[^>]*>/g)];
    for (const [link] of links) {
      const href = link.match(/\bhref="([^"]+)"/)?.[1];
      if (!href) continue;
      if (/fonts\.(?:googleapis|gstatic)\.com/.test(href)) {
        const replacement = /rel="stylesheet"/.test(link) && !hostedFonts
          ? `<style data-delivery="fonts">${await css(fonts)}</style>` : '';
        if (replacement) hostedFonts = true;
        html = html.replace(link, replacement);
      } else if (/rel="stylesheet"/.test(link)) {
        const path = resolve(out, href.replace(/^\//, ''));
        const source = await readFile(path, 'utf8');
        // Inlined CSS resolves relative URLs against the document, not its old
        // asset directory. All current resources use root or data URLs.
        for (const match of source.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/g)) {
          const url = (match[1] ?? match[2] ?? match[3]).trim();
          if (!/^(?:data:|https?:|\/|#)/.test(url)) {
            throw new Error(`Relative CSS URL must be rebased before inlining: ${href}`);
          }
        }
        const media = link.match(/\bmedia="([^"]+)"/)?.[1];
        html = html.replace(link, `<style data-delivery="${href}">${await css(media ? `@media ${media}{${source}}` : source)}</style>`);
      }
    }
    // These two small head initializers must remain synchronous (loading veil
    // and cross-document transitions); inline them instead of blocking on JS.
    for (const name of ['page-transitions', 'site-loading']) {
      const source = await readFile(resolve(out, `assets/${name}.js`), 'utf8');
      const js = (await transform(source, {loader:'js', minify:true, target:'es2022'})).code;
      html = html.replace(`<script src="/assets/${name}.js"></script>`,
        `<script data-delivery="${name}">${js.replaceAll('</script', '<\\/script')}</script>`);
    }
    const outfit = '/assets/fonts/outfit-latin-QGYvz_MVcBeNP4NJtEtq.woff2';
    const outfitExtended = '/assets/fonts/outfit-latin-ext-QGYvz_MVcBeNP4NJuktqQ4E.woff2';
    let priority = `<link rel="preload" href="${outfit}" as="font" type="font/woff2" crossorigin>`;
    // The brand contains ə and ˈ, supplied by the matching extended subset.
    priority += `<link rel="preload" href="${outfitExtended}" as="font" type="font/woff2" crossorigin>`;
    if (page === resolve(out, 'index.html')) {
      priority += '<link rel="preload" as="image" type="image/avif" media="(max-width: 899px)" href="/assets/phone/mobile-home-810.avif" imagesrcset="/assets/phone/mobile-home-540.avif 540w, /assets/phone/mobile-home-810.avif 810w, /assets/phone/mobile-home-1080.avif 1080w" imagesizes="(max-width: 388px) calc(86vw - 34.4px), 300px" fetchpriority="high">';
    }
    html = html.replace(/(<meta charset="[^"]+">)/i, `$1\n${priority}`);
    await writeFile(page, html);
  }
  console.log(`Optimized delivery: ${pages.length} pages, local fonts, media-aware inline CSS and synchronous inline readiness/transition initializers.`);
}
