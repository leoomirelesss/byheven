import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {origin, indexNowKey} from './discovery-config.mjs';

// Run only after the production deployment is READY. No automatic build hook:
// previews and failed builds must never notify engines about unpublished URLs.
const xml = readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8');
const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
assert(urlList.length && urlList.length <= 10000);
assert.equal(new Set(urlList).size, urlList.length);
for (const value of urlList) {
  const url = new URL(value);
  assert.equal(url.origin, origin);
  assert(!url.search && !url.hash, 'submit public canonical URLs only');
}
const keyLocation = `${origin}/${indexNowKey}.txt`;
const proof = await fetch(keyLocation, {redirect: 'error', signal: AbortSignal.timeout(15000)});
assert.equal(proof.status, 200, 'production proof must be available before submission');
assert.equal((await proof.text()).trim(), indexNowKey);
const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST', headers: {'Content-Type': 'application/json; charset=utf-8'},
  body: JSON.stringify({host: new URL(origin).hostname, key: indexNowKey, keyLocation, urlList}),
  signal: AbortSignal.timeout(20000)
});
assert([200,202].includes(response.status), `IndexNow returned ${response.status}: ${(await response.text()).slice(0,300)}`);
console.log(JSON.stringify({status: response.status, submitted: urlList.length,
  meaning: response.status === 202 ? 'received; ownership validation pending' : 'received; indexing is not guaranteed'}));
