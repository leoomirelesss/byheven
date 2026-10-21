import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../assets/consultation.js',import.meta.url),'utf8');
const home=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const formMarkup=home.match(/<form\b[^>]*id="contact-form"[\s\S]*?<\/form>/)?.[0];
assert(formMarkup,'the actual consultation form exists');
assert(home.includes('src="assets/consultation.js" defer'),'home loads the controller');
assert(!readFileSync(new URL('../assets/home-finish.js',import.meta.url),'utf8').includes("getElementById('contact-form')"),'one submission owner');
assert(/name="service" required><option value="" selected>/.test(formMarkup),'service is a deliberate choice');
assert(formMarkup.includes('Consulta gratuita de 25 minutos'));
assert(formMarkup.includes('Envíala para que coordinemos la fecha y hora contigo.'),'no unconnected booking promise');
assert(!/type="email"|name="decision|type="datetime-local"/.test(formMarkup),'no redundant contact, authority or fake time slot fields');

function environment() {
  const fields=new Map();
  for (const match of formMarkup.matchAll(/<(input)\b([^>]*)>|<(select|textarea)\b([^>]*)>([\s\S]*?)<\/\3>/g)) {
    const tag=match[1] || match[3],attributes=match[2] || match[4],content=match[5] || '';
    const name=attributes.match(/\bname="([^"]+)"/)?.[1];if (!name) continue;
    const handlers={},attrs=new Map();
    const options=tag==='select'?[...content.matchAll(/<option(?: value="([^"]*)")?[^>]*>([^<]*)<\/option>/g)].map(([,value,textContent])=>({value:value ?? textContent,textContent})):[];
    const input={name,tag,options,value:'',required:/\brequired\b/.test(attributes),disabled:false,validity:'',handlers,attrs,
      addEventListener(type,handler){(handlers[type] ||= []).push(handler);},setCustomValidity(value){this.validity=value;},
      setAttribute(key,value){attrs.set(key,value);},removeAttribute(key){attrs.delete(key);},
      get selectedOptions(){return options.filter(option=>option.value===this.value);}};
    fields.set(name,input);
  }
  assert.equal(fields.size,6,'test uses all six real form controls');
  const ids=new Map(['contact-budget-label','contact-budget-note','home-form-status'].map(id=>[id,{textContent:''}]));
  const listeners={},events={},destinations=[];
  const form={action:formMarkup.match(/action="([^"]+)"/)[1],elements:{namedItem:name=>fields.get(name)},
    querySelectorAll:()=>[...fields.values()].filter(field=>field.required),
    addEventListener(type,handler){listeners[type]=handler;},
    reportValidity(){const invalid=[...fields.values()].find(field=>field.validity || (field.required&&!field.value));if(invalid)invalid.handlers.invalid.forEach(fn=>fn());return !invalid;}};
  vm.runInNewContext(source,{document:{getElementById:id=>id==='contact-form'?form:ids.get(id)},
    window:{addEventListener(type,handler){events[type]=handler;},location:{assign:url=>destinations.push(url)}},URL,queueMicrotask:fn=>fn()});
  return {fields,ids,events,listeners,destinations,
    set(name,value){fields.get(name).value=value;fields.get(name).handlers.input?.forEach(fn=>fn());fields.get(name).handlers.change?.forEach(fn=>fn());},
    submit(){let prevented=false;listeners.submit({preventDefault(){prevented=true;}});assert(prevented);},
    message(){return new URL(destinations.at(-1)).searchParams.get('text');}};
}

const e=environment();
assert(e.fields.get('budget').disabled,'no budget period guessed before a service is chosen');
e.submit();assert.equal(e.destinations.length,0,'incomplete request never navigates');
assert.equal(e.fields.get('name').attrs.get('aria-invalid'),'true');
e.set('name','   ');e.submit();assert.equal(e.destinations.length,0,'whitespace-only names rejected');
e.set('name','Ana María & José');assert(!e.fields.get('name').attrs.has('aria-invalid'));
e.set('text','Quiero ordenar mi catálogo & pedidos.');e.submit();assert.equal(e.destinations.length,0,'service is required');
e.set('service','Administración de Shopify');assert(!e.fields.get('budget').disabled);
assert.equal(e.ids.get('contact-budget-label').textContent,'Presupuesto mensual estimado');
e.set('business','https://ejemplo.com/?a=1&b=2');e.set('budget','200-500');e.set('start','En 1–3 meses');e.submit();
assert.equal(new URL(e.destinations.at(-1)).origin,'https://wa.me');
assert.equal(new URL(e.destinations.at(-1)).pathname,'/528718876019');
assert(e.message().includes('Ana María & José')&&e.message().includes('https://ejemplo.com/?a=1&b=2'),'Unicode and URL separators survive encoding');
assert(e.message().includes('US$500 al mes'),'Shopify estimate is monthly');
assert(e.message().includes('En 1–3 meses')&&e.message().includes('consulta gratuita de 25 minutos'));
assert(e.ids.get('home-form-status').textContent.includes('todavía no hay una cita reservada'));
e.set('service','Diseño y desarrollo web');assert.equal(e.fields.get('budget').value,'','monthly amount is not silently reused for a project');
assert.equal(e.ids.get('contact-budget-label').textContent,'Presupuesto estimado del proyecto');
e.set('budget','500-1000');e.set('service','Automatización e IA');assert.equal(e.fields.get('budget').value,'500-1000','same period preserves an estimate');
e.submit();assert(e.message().includes('US$1,000 por proyecto'));
e.events.pageshow();assert.equal(e.fields.get('budget').value,'500-1000','history restoration does not erase the request');
e.set('service','Quiero orientación');assert.equal(e.fields.get('budget').value,'');
e.set('business','');e.set('start','');e.submit();
assert(e.message().includes('Sin presupuesto establecido aún')&&e.message().includes('Sin fecha definida'));
assert(!e.message().includes('Negocio o sitio:'),'optional details may be omitted');
e.set('budget','under-200');e.submit();assert(e.message().includes('periodicidad por definir'),'orientation never invents a monthly commitment');
e.set('text','   ');e.submit();const count=e.destinations.length;assert(e.fields.get('text').validity);
e.set('text','Necesito una tienda.');assert.equal(e.fields.get('text').validity,'');e.submit();assert.equal(e.destinations.length,count+1);
for(const field of e.fields.values()) field.value='';e.listeners.reset();assert(e.fields.get('budget').disabled,'form reset restores the initial budget state');
assert(!/localStorage|sessionStorage|fetch\(|\.reset\(/.test(source),'no personal-data persistence, unconfigured network calls or premature form clearing');
console.log('PASS: real consultation fields; required/optional validation, budget periods and resets, encoded WhatsApp request, bfcache, accessible errors and honest handoff.');
