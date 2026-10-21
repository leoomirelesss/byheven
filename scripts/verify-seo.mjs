import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const origin = 'https://www.byheven.com';
const decode = value => value.replace(/&(?:amp|quot|apos|lt|gt|#39);/g, entity => ({'&amp;':'&','&quot;':'"','&apos;':"'",'&#39;':"'",'&lt;':'<','&gt;':'>'})[entity]);
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(([,key,a,b]) => [key.toLowerCase(),decode(a ?? b)]));

function jpegSize(bytes) {
  assert.equal(bytes.readUInt16BE(0), 0xffd8, 'share image must be a real JPEG');
  let offset = 2;
  while (offset + 9 < bytes.length) {
    assert.equal(bytes[offset], 0xff, 'invalid JPEG marker');
    const marker = bytes[offset + 1], length = bytes.readUInt16BE(offset + 2);
    if ([0xc0,0xc1,0xc2].includes(marker)) return {width:bytes.readUInt16BE(offset + 7),height:bytes.readUInt16BE(offset + 5)};
    assert(length >= 2, 'invalid JPEG segment'); offset += length + 2;
  }
  throw new Error('JPEG dimensions not found');
}

export function verifySEO(directory) {
  const sitemap = readFileSync(resolve(directory,'sitemap.xml'),'utf8');
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([,url]) => decode(url));
  assert.equal(urls.length,8,'sitemap must contain the eight current pages');
  assert.equal(new Set(urls).size,urls.length,'duplicate sitemap URL');
  const titles=new Set(), descriptions=new Set(), ids=new Map(), references=[];
  let imageCount=0;
  for (const url of urls) {
    assert(url.startsWith(origin+'/') && url.endsWith('/'),'canonical domain and trailing slash');
    const file = new URL(url).pathname.slice(1)+'index.html';
    const html=readFileSync(resolve(directory,file),'utf8');
    const head=html.split('</head>')[0];
    const label=message => `${file}: ${message}`;
    assert(/<meta charset=["']utf-8["']/i.test(html.slice(0,1024)),label('early UTF-8 declaration'));
    assert(/<html\b[^>]*lang="es-MX"/.test(html),label('document language'));
    assert.equal([...html.matchAll(/<h1\b/g)].length,1,label('one semantic H1'));
    const titleTags=[...head.matchAll(/<title>([^<]+)<\/title>/g)];
    assert.equal(titleTags.length,1,label('one title'));
    const title=decode(titleTags[0][1]);
    assert(!titles.has(title),label('unique title'));titles.add(title);
    assert(title.includes('by ˈHevən'),label('consistent brand'));
    const meta=new Map();
    for (const [tag] of head.matchAll(/<meta\b[^>]*>/g)) {
      const a=attrs(tag),key=a.name || a.property;
      if (!key) continue;
      assert(!meta.has(key),label(`duplicate ${key}`));meta.set(key,a.content);
    }
    for (const key of ['description','robots','og:title','og:description','og:type','og:site_name','og:locale','og:url','og:image','og:image:alt','og:image:type','og:image:width','og:image:height','twitter:card','twitter:title','twitter:description','twitter:image','twitter:image:alt']) assert(meta.get(key),label(`missing ${key}`));
    assert(!descriptions.has(meta.get('description')),label('unique description'));descriptions.add(meta.get('description'));
    assert(!/noindex|none/.test(meta.get('robots')),label('source is indexable for production'));
    assert.equal(meta.get('og:url'),url,label('Open Graph URL'));
    assert.equal(meta.get('og:title'),title,label('Open Graph title'));
    assert.equal(meta.get('og:description'),meta.get('description'),label('Open Graph description'));
    assert.equal(meta.get('twitter:title'),title,label('Twitter title'));
    assert.equal(meta.get('twitter:description'),meta.get('description'),label('Twitter description'));
    assert.equal(meta.get('twitter:card'),'summary_large_image',label('large social preview'));
    assert.equal(meta.get('twitter:image'),meta.get('og:image'),label('consistent share image'));
    const canonicals=[...head.matchAll(/<link\b[^>]*>/g)].map(([tag])=>attrs(tag)).filter(a=>a.rel==='canonical');
    assert.equal(canonicals.length,1,label('one canonical'));assert.equal(canonicals[0].href,url,label('self canonical'));
    const share=new URL(meta.get('og:image'));assert.equal(share.origin,origin,label('owned share image'));
    const bytes=readFileSync(resolve(directory,share.pathname.slice(1)));const size=jpegSize(bytes);
    assert.equal(meta.get('og:image:type'),'image/jpeg',label('image MIME type'));
    assert.equal(size.width,Number(meta.get('og:image:width')),label('image width'));
    assert.equal(size.height,Number(meta.get('og:image:height')),label('image height'));
    assert(bytes.length<500000,label('share image stays under 500 KB'));
    for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
      const a=attrs(tag);assert(Object.hasOwn(a,'alt'),label('every image has an alt attribute'));
      assert(Number(a.width)>0 && Number(a.height)>0,label('image dimensions reserve space'));
      if (a.fetchpriority==='high') assert.notEqual(a.loading,'lazy',label('priority media must not be lazy'));
      if (a.class==='case-device-view') assert(a.alt && a['data-screen-alt']===a.alt,label('descriptive gallery fallback'));
      imageCount++;
    }
    const blocks=[...head.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
    assert.equal(blocks.length,1,label('one JSON-LD graph'));
    const schema=JSON.parse(blocks[0][1]);assert.equal(schema['@context'],'https://schema.org');
    const graph=schema['@graph'];assert(Array.isArray(graph) && graph.length,label('structured graph'));
    const page=graph.find(node=>['WebPage','CollectionPage'].includes(node['@type']));
    assert(page,label('page entity'));assert.equal(page.url,url);assert.equal(page.description,meta.get('description'));
    const primary=graph.find(node=>node['@id']===page.primaryImageOfPage?.['@id']);
    assert.equal(primary?.contentUrl,share.href,label('page primary image'));
    for (const node of graph) {
      assert(!ids.has(node['@id']),label('unique entity ID'));ids.set(node['@id'],node);
      if (node['@type']==='BreadcrumbList') {
        node.itemListElement.forEach((item,i)=>{assert.equal(item.position,i+1);assert(urls.includes(item.item),label('breadcrumb destination'));});
        assert.equal(node.itemListElement.at(-1).item,url,label('breadcrumb ends at current page'));
      }
      if (node['@type']==='ItemList') {
        assert.equal(node.numberOfItems,node.itemListElement.length);
        node.itemListElement.forEach(item=>assert(html.includes(`href="${new URL(item.url).pathname}"`),label('listed project visible in HTML')));
      }
    }
    const walk=value=>{
      if (!value || typeof value!=='object') return;
      if (value['@id'] && !value['@type']) references.push(value['@id']);
      for (const child of Object.values(value)) walk(child);
    };walk(graph);
    if (url.includes('/dor-os/')) assert(graph.some(n=>n.creativeWorkStatus==='MVP'),label('preserve MVP status'));
    if (url.includes('/academic-quest/')) assert(graph.some(n=>n.creativeWorkStatus==='Prototipo'),label('preserve prototype status'));
  }
  for (const reference of references) assert(ids.has(reference),`unresolved structured entity: ${reference}`);
  assert.equal(ids.get(origin+'/#organization')?.['@type'],'Organization');
  const logo=ids.get(origin+'/#organization').logo;
  assert(logo && logo.width>=112 && logo.height>=112,'organization logo dimensions');
  assert(existsSync(resolve(directory,new URL(logo.url).pathname.slice(1))),'organization logo exists');
  assert.equal(ids.get(origin+'/#website')?.name,'by ˈHevən');
  const robots=readFileSync(resolve(directory,'robots.txt'),'utf8');
  assert(robots.includes(`Sitemap: ${origin}/sitemap.xml`),'robots references canonical sitemap');
  for (const [,url] of sitemap.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)) {
    assert.equal(new URL(url).origin,origin);assert(existsSync(resolve(directory,new URL(url).pathname.slice(1))),'sitemap image exists');
  }
  console.log(`PASS: SEO for ${urls.length} pages; unique metadata, social JPEGs, ${imageCount} image labels/dimensions, ${ids.size} structured entities, canonical and sitemap consistency.`);
}

if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) verifySEO(resolve(process.argv[2] || '.'));
