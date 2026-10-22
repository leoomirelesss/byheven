import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../assets/analytics.js', import.meta.url), 'utf8');
function fixture({host = 'www.byheven.com', path = '/', pending = false, dnt, gpc} = {}) {
  const appended = [], observers = [], idle = [], listeners = {}, formListeners = {};
  const html = {hasAttribute: () => pending};
  const document = {
    title: 'by ˈHevən', referrer: 'https://google.com/search?q=private@example.com',
    documentElement: html, head: {append: value => appended.push(value)},
    createElement: () => ({}), addEventListener: (name, fn) => listeners[name] = fn,
    getElementById: () => ({addEventListener: (name, fn) => formListeners[name] = fn})
  };
  const window = {requestIdleCallback: fn => idle.push(fn)};
  const context = vm.createContext({window, document,
    location: {hostname: host, origin: `https://${host}`, pathname: path,
      href: `https://${host}${path}`, search: '?email=private@example.com&text=SECRET&utm_source=instagram&utm_medium=social'},
    navigator: {doNotTrack: dnt, globalPrivacyControl: gpc}, URL, URLSearchParams,
    MutationObserver: class {constructor(fn) {this.fn = fn; observers.push(this);} observe() {} disconnect() {this.disconnected = true;}},
    setTimeout: fn => idle.push(fn)
  });
  const run = () => vm.runInContext(source, context);
  run();
  return {window, appended, observers, idle, listeners, formListeners, run,
    settle() {pending = false; observers.forEach(o => o.fn()); idle.splice(0).forEach(fn => fn());},
    events() {return (window.dataLayer || []).map(args => [...args]);}};
}

for (const opts of [{host:'byheven-preview.vercel.app'}, {host:'localhost'}, {dnt:'1'}, {gpc:true}]) {
  const f = fixture(opts); assert.equal(f.window.HevenAnalytics, undefined); assert.equal(f.idle.length, 0);
}
const f = fixture({pending:true, path:'/case-studies/emyasa/'});
assert.equal(f.appended.length, 0); assert.equal(f.idle.length, 0);
const config = f.events().find(e => e[0] === 'config')[2];
assert.equal(config.page_location, 'https://www.byheven.com/case-studies/emyasa/');
assert.equal(config.page_referrer, 'https://google.com/');
assert.equal(config.campaign_source, 'instagram');
assert.equal(config.allow_google_signals, false);
assert.equal(f.events().filter(e => e[1] === 'view_case_study').length, 1);
f.run(); assert.equal(f.events().filter(e => e[0] === 'config').length, 1);
f.window.HevenAnalytics.track('generate_lead', {email:'private@example.com'});
assert.equal(f.events().filter(e => e[1] === 'generate_lead').length, 0);
f.window.HevenAnalytics.track('consultation_request', {service_type:'web', name:'SECRET', message:'SECRET'});
const request = f.events().find(e => e[1] === 'consultation_request')[2];
assert.equal(request.service_type, 'web'); assert.equal(request.name, undefined); assert.equal(request.message, undefined);
const anchor = {href:'https://wa.me/528718876019?text=SECRET', closest: selector => selector === '#contact'};
f.listeners.click({type:'click', target:{closest:() => anchor}});
assert.equal(f.events().filter(e => e[1] === 'click_whatsapp').length, 1);
assert(!JSON.stringify(f.events()).includes('SECRET'));
assert(!JSON.stringify(f.events()).includes('private@example.com'));
f.settle(); assert.equal(f.appended.length, 1); assert.equal(f.appended[0].async, true);
assert(f.appended[0].src.endsWith('G-X9LYLZSKQF'));
f.settle(); assert.equal(f.appended.length, 1);

const consultation = readFileSync(new URL('../assets/consultation.js', import.meta.url), 'utf8');
assert(consultation.indexOf('form.reportValidity()') < consultation.indexOf("track('consultation_request'"));
assert(consultation.indexOf("track('consultation_request'") < consultation.indexOf('window.location.assign'));
for (const file of ['index.html', 'case-studies/index.html', ...['emyasa','stone-kuche','parsomen','dor','dor-os','academic-quest'].map(p=>`case-studies/${p}/index.html`)]) {
  const html = readFileSync(new URL('../'+file, import.meta.url), 'utf8');
  assert.equal(html.split('src="/assets/analytics.js"').length - 1, 1, file);
  assert(html.includes('<script src="/assets/analytics.js" defer></script>'), file);
}
console.log('PASS: production-only GA4, DNT/GPC, single deferred tag, loader readiness, clean URLs, bounded event parameters, no form PII, separate contact intents and validated form hook.');
