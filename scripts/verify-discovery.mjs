import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {origin, indexNowKey} from './discovery-config.mjs';

export function verifyDiscovery(directory) {
  const read = path => readFileSync(resolve(directory, path), 'utf8');
  const robots = read('robots.txt');
  assert.match(robots, /User-agent:\s*\*\s+Allow:\s*\//i);
  // The wildcard applies to search crawlers too; do not add narrower groups
  // that accidentally override it or hide the assets used to render a page.
  assert(!/^\s*Disallow:\s*\S/m.test(robots), 'public content must remain crawlable');
  assert(!/^\s*User-agent:\s*(?!\*\s*$)\S+/im.test(robots), 'review crawler-specific policy changes');
  assert.match(indexNowKey, /^[a-f0-9]{32}$/);
  assert.equal(read(`${indexNowKey}.txt`).trim(), indexNowKey, 'deployed ownership proof');
  const urls = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  const graph = html => JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  const home = read('index.html'), nodes = graph(home);
  const faq = nodes.find(n => n['@type'] === 'FAQPage');
  const clean = text => text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const visible = [...home.matchAll(/<details class="chat-item"[\s\S]*?<\/details>/g)].map(([item]) => ({
    question: clean(item.match(/<summary[^>]*>([\s\S]*?)<\/summary>/)[1]),
    answer: [...item.matchAll(/<p class="chat-message">([\s\S]*?)<\/p>/g)].map(m => clean(m[1])).join(' ')
  }));
  assert.equal(faq.mainEntity.length, visible.length, 'FAQ must match every existing visible answer');
  faq.mainEntity.forEach((q,i) => {
    assert.equal(q.name, visible[i].question);
    assert.equal(q.acceptedAnswer.text, visible[i].answer, 'never invent answers for search engines');
  });
  for (const service of nodes.filter(n => n['@type'] === 'Service')) {
    for (const reference of service.subjectOf) {
      const url = new URL(reference['@id']);
      assert(urls.includes(origin + url.pathname), 'evidence must be a published case');
      const project = graph(read(url.pathname.slice(1) + 'index.html')).find(n => n['@type'] === 'CreativeWork');
      assert(project.about.some(n => n['@id'] === service['@id']), 'case must identify the service it documents');
    }
  }
  console.log(`PASS: crawl access, IndexNow proof, ${visible.length} truthful FAQ answers and service/case relationships.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) verifyDiscovery(resolve(process.argv[2] || '.'));
