var q=e=>Math.max(0,Math.min(1,e)),H=e=>{let t=q(e);return t*t*t*(t*(t*6-15)+10)};function A(e,t,o,r,a=0,u=!1,d){let p=u?1:q((t+r*e.arrivalStart-o-a)/Math.min(e.arrivalMax,Math.max(e.arrivalMin,r*e.arrivalDistance))),l=d??p,h=H(l),b=H(q((l-e.lineDelay)/(1-e.lineDelay)));return{raw:p,y:e.arrivalShift*(1-h),opacity:e.arrivalOpacity+(1-e.arrivalOpacity)*h,captionY:e.arrivalShift*(1-b)}}function k(e,t,o,r,a){return Math.max(-a,Math.min(a,(e+r/2-t-o/2)/r*a))}function C(e){let t=e.settings,o=window.matchMedia("(prefers-reduced-motion: reduce)"),r=[...document.querySelectorAll(".case-index-grid .case-card")].map((n,v)=>({element:n,image:n.querySelector(".case-cover"),index:v,top:0,height:1,shift:0,value:0,last:"",done:!1})),a=[...document.querySelectorAll(".case-invitation h2, .case-invitation > .case-text-link")].map((n,v)=>({element:n,image:null,index:v,top:0,height:1,shift:0,value:0,last:"",done:!1})),u=[...r,...a],d=!1,p=!1,l=n=>{n.element.classList.remove("is-case-motion");for(let v of["--case-entry-y","--case-entry-opacity","--case-caption-y"])n.element.style.removeProperty(v);n.image?.style.removeProperty("--case-image-depth"),n.shift=0,n.last=""},h=()=>{d=!o.matches&&window.innerHeight>=600,p=window.innerWidth>=900&&window.innerHeight>=640,u.forEach(n=>{n.top=n.element.getBoundingClientRect().top+window.scrollY-n.shift,n.height=n.element.offsetHeight,n.last="",d?n.element.classList.add("is-case-motion"):l(n)})},b=e.subscribe({measure:h,render(n){if(!d)return!1;let v=!1;return u.forEach(c=>{let m=Math.min(t.staggerMax,c.index*t.stagger),i=A(t,n.y,c.top,n.height,m,c.done);c.value=e.approach(c.value,i.raw,n.dt??16.67,n.immediate??!0),v||=c.value!==i.raw;let s=A(t,n.y,c.top,n.height,m,c.done,c.value);c.value===1&&(c.done=!0);let x=c.image&&p?k(n.y,c.top,c.height,n.height,t.parallax):0,g=`${c.value}:${x}`;c.last!==g&&(c.last=g,c.shift=s.y,c.element.style.setProperty("--case-entry-y",`${s.y}px`),c.element.style.setProperty("--case-entry-opacity",String(s.opacity)),c.element.style.setProperty("--case-caption-y",`${s.captionY}px`),c.image?.style.setProperty("--case-image-depth",`${x}%`))}),v}}),f=n=>{let v=u.find(c=>c.element.contains(n.target));v&&(v.done=!0,e.invalidate())};return document.addEventListener("focusin",f),o.addEventListener("change",e.invalidate),()=>{b(),document.removeEventListener("focusin",f),o.removeEventListener("change",e.invalidate),u.forEach(l)}}var B={ink:"#0c0912",shadow:"#08060d",ember:"#49354f",violet:"#49358d",lavender:"#827294",silver:"#82788f"};function O(e){let t=e.replace(/^#/,"");return t.length===3&&(t=t.split("").map(o=>o+o).join("")),/^[a-f\d]{6}$/i.test(t)?[0,2,4].map(o=>parseInt(t.slice(o,o+2),16)/255):[0,0,0]}var N=`#version 300 es
void main(){
  vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));
  gl_Position=vec4(p*2.0-1.0,0.0,1.0);
}`,W=`#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uDpr;
uniform vec3 uInk, uShadow, uEmber, uViolet, uLavender, uSilver;
out vec4 frag;
float hash12(vec2 p){
  vec3 p3=fract(vec3(p.xyx)*.1031);
  p3+=dot(p3,p3.yzx+33.33);
  return fract((p3.x+p3.y)*p3.z);
}
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p), u=f*f*(3.0-2.0*f);
  return mix(mix(hash12(i),hash12(i+vec2(1,0)),u.x),mix(hash12(i+vec2(0,1)),hash12(i+vec2(1,1)),u.x),u.y);
}
float fbm(vec2 p){
  float v=0.0,a=.5;
  mat2 r=mat2(.8,-.6,.6,.8);
  for(int i=0;i<4;i++){v+=a*noise(p);p=r*p*2.03+11.7;a*=.5;}
  return v;
}
float lobe(vec2 p,vec2 c,vec2 s){vec2 d=(p-c)/s;return exp(-dot(d,d));}
void main(){
  vec2 uv=gl_FragCoord.xy/uRes;uv.y=1.0-uv.y;
  vec2 q=uv;
  // The folds and film grain are frozen at one deterministic exposure.
  vec2 warp=vec2(fbm(q*1.4+vec2(0,.54)),fbm(q*1.4+vec2(5.2,.868)))-.5;
  q+=warp*.14;
  float sway=sin(q.x*3.3+1.89)*.025+sin(q.x*7.1-1.17)*.01;
  float edge=.45+.2*smoothstep(.02,.5,q.x)-.1*smoothstep(.45,1.0,q.x)+sway;
  float soft=mix(.03,.12,smoothstep(0.0,.8,q.x))+.004;
  float folded=1.0-smoothstep(edge-soft,edge+soft,q.y);
  vec2 lc=vec2(.34,.2);
  float haze=lobe(q,lc,vec2(.75,.52));
  float under=lobe(q,lc+vec2(.1,.36),vec2(.24,.1))*.34;
  float silver=(min(haze*1.18,1.0)*folded+under)*.48;
  float violet=lobe(q,vec2(.7,0),vec2(.27,.24))*.72;
  float lavender=lobe(q,vec2(.5,.02),vec2(.3,.24));
  float ember=lobe(q,vec2(.66,.28),vec2(.18,.09))*.3;
  vec3 col=mix(uInk,mix(uSilver,uLavender,lavender*.8),clamp(silver,0.0,1.0));
  col=mix(col,uViolet,clamp(violet,0.0,1.0)*.72);
  col=mix(col,uEmber,clamp(ember,0.0,1.0)*.75);
  float sd=dot(q-vec2(.6,.37),vec2(.874,.486))+sway*.8;
  col=mix(col,uShadow,smoothstep(-.14,.26,sd)*.97);
  col+=uSilver*lobe(q,vec2(.67,.53),vec2(.13,.05))*.067;
  col=mix(col,uInk,smoothstep(.62,.92,uv.y)*.8);
  vec2 v=(uv-vec2(.36,.3))*vec2(1,1.1);
  col=mix(col,uInk*.85,.5*smoothstep(.45,1.1,length(v)));
  vec2 gp=floor(gl_FragCoord.xy/max(uDpr,1.0));
  float grain=(hash12(gp)-.5)*.8+(hash12(floor(gp*.5)+7.3)-.5)*.35;
  col+=grain*.023;
  frag=vec4(clamp(col,0.0,1.0),1.0);
}`;function R(e,t=B,o={}){let r=e.getContext("webgl2",{alpha:!1,antialias:!1,depth:!1,powerPreference:"low-power"});if(!r)return null;let a=null,u=null,d="",p=!1,l=()=>{a&&r.deleteProgram(a),u&&r.deleteVertexArray(u),a=u=null},h=(m,i)=>{let s=r.createShader(m);return s?(r.shaderSource(s,i),r.compileShader(s),r.getShaderParameter(s,r.COMPILE_STATUS)?s:(r.deleteShader(s),null)):null},b=()=>{let m=h(r.VERTEX_SHADER,N),i=h(r.FRAGMENT_SHADER,o.fragment??W);if(!m||!i){m&&r.deleteShader(m),i&&r.deleteShader(i);return}if(a=r.createProgram(),!a){r.deleteShader(m),r.deleteShader(i);return}if(r.attachShader(a,m),r.attachShader(a,i),r.linkProgram(a),r.deleteShader(m),r.deleteShader(i),!r.getProgramParameter(a,r.LINK_STATUS)){l();return}u=r.createVertexArray(),d=""},f=()=>{if(!a||p)return;let m=Math.min(1.25,window.devicePixelRatio||1),i=Math.max(1,Math.round(e.clientWidth*m)),s=Math.max(1,Math.round(e.clientHeight*m));if(o.maxPixels&&i*s>o.maxPixels){let g=Math.sqrt(o.maxPixels/(i*s));i=Math.max(1,Math.floor(i*g)),s=Math.max(1,Math.floor(s*g))}let x=`${i}:${s}:${m}`;if(x!==d){d=x,e.width=i,e.height=s,r.useProgram(a),r.bindVertexArray(u),r.viewport(0,0,i,s),r.uniform2f(r.getUniformLocation(a,"uRes"),i,s),r.uniform1f(r.getUniformLocation(a,"uDpr"),m);for(let[g,L]of Object.entries(t))r.uniform3fv(r.getUniformLocation(a,`u${g[0].toUpperCase()}${g.slice(1)}`),O(L));r.drawArrays(r.TRIANGLES,0,3),e.setAttribute("data-haze-ready","")}},n=m=>{m.preventDefault(),p=!0,e.removeAttribute("data-haze-ready")},v=()=>{p=!1,l(),b(),f()};e.addEventListener("webglcontextlost",n),e.addEventListener("webglcontextrestored",v),b(),f();let c=new ResizeObserver(f);return c.observe(e),()=>{c.disconnect(),e.removeEventListener("webglcontextlost",n),e.removeEventListener("webglcontextrestored",v),e.removeAttribute("data-haze-ready"),l()}}var S=e=>Math.max(0,Math.min(1,e)),U=e=>{let t=S(e);return t*t*(3-2*t)},z=(e,t,o)=>S((e-t)/Math.max(1,o)),V=e=>{let t=S(e);return t*t*t*(t*(t*6-15)+10)*1.5-.22};function G(e,t,o){let r=V(t),a=S((r-e.x/Math.max(1,o))/.26),u=U(a);return{x:e.x+u*(24+e.seed*72),y:e.y+Math.sin(e.seed*91)*u*22-u*u*44,alpha:e.alpha*Math.sin(Math.PI*a)*Math.pow(1-a,1.8),released:r>=e.x/Math.max(1,o)}}function $(e,t){let o=t.getContext("2d",{alpha:!0}),r=document.createElement("canvas"),a=r.getContext("2d",{willReadFrequently:!0}),u=[],d=0,p=0,l=0,h=1,b="#ceced7",f=-1,n="";return!o||!a?null:{measure:(m=!1)=>{let i=e.getBoundingClientRect(),s=getComputedStyle(e),x=[i.width,i.height,s.fontSize,s.fontFamily,s.fontWeight,s.letterSpacing,window.devicePixelRatio].join("|");if(!m&&x===n||(n=x,d=i.width,p=i.height,!d||!p))return;l=Math.min(100,Math.max(36,d*.07)),h=Math.min(1.5,window.devicePixelRatio||1),b=s.color,t.width=r.width=Math.ceil((d+l*2)*h),t.height=r.height=Math.ceil((p+l*2)*h),t.style.width=`${d+l*2}px`,t.style.height=`${p+l*2}px`,t.style.left=t.style.top=`${-l}px`,a.setTransform(h,0,0,h,0,0),a.clearRect(0,0,d+l*2,p+l*2),a.font=`${s.fontWeight} ${s.fontSize} ${s.fontFamily}`,a.fillStyle=b,a.textBaseline="alphabetic",a.letterSpacing=s.letterSpacing,e.querySelectorAll("[data-vapour-word]").forEach(y=>{let M=y.getBoundingClientRect(),E=a.measureText(y.textContent||""),P=E.fontBoundingBoxAscent||parseFloat(s.fontSize)*.8,_=E.fontBoundingBoxDescent||parseFloat(s.fontSize)*.2,I=M.top-i.top+(M.height-P-_)/2+P;a.fillText(y.textContent||"",M.left-i.left+l,I+l)});let g=a.getImageData(0,0,r.width,r.height).data;u=[];let L=Math.max(2.5,Math.sqrt(d*p/22e3));for(let y=l;y<p+l;y+=L)for(let M=l;M<d+l;M+=L){let E=(Math.floor(y*h)*r.width+Math.floor(M*h))*4;if(g[E+3]<48)continue;let P=((Math.imul(Math.floor(M),374761393)^Math.imul(Math.floor(y),668265263))>>>0)/4294967295;u.push({x:M-l,y:y-l,alpha:g[E+3]/255,seed:P})}f=-1},render:m=>{let i=S(m);if(i===f)return;f=i,o.setTransform(h,0,0,h,0,0),o.clearRect(0,0,t.width/h,t.height/h);let s=V(i)*d;if(e.style.setProperty("--vapour-front",`${s}px`),!i||i===1){e.classList.toggle("is-vaporizing",i===1),t.style.opacity="0";return}o.fillStyle=b,u.forEach(x=>{let g=G(x,i,d);!g.released||g.alpha<.01||(o.globalAlpha=g.alpha,o.beginPath(),o.arc(g.x+l,g.y+l,.45+x.seed*.35,0,Math.PI*2),o.fill())}),o.globalAlpha=1,t.style.opacity="1",e.classList.add("is-vaporizing")},destroy(){u=[],e.classList.remove("is-vaporizing"),e.style.removeProperty("--vapour-front"),t.style.opacity="0",t.width=t.height=0}}}var D=document.querySelector(".case-haze-canvas");if(D){let e=R(D);window.addEventListener("pagehide",t=>{t.persisted||e?.()})}var w=window.HevenMotion;if(w){let e=document.querySelector(".case-scroll-cue"),t=!1;w.subscribe({measure(){},render(r){return e&&!t&&r.y>1&&(t=!0,e.classList.add("is-dismissed")),!1}});let o=C(w);window.addEventListener("pagehide",r=>{r.persisted||o()})}var T=document.querySelector("[data-case-vapour]"),F=[...T?.querySelectorAll("[data-vapour-block]")??[]];if(w&&T&&F.length){let e=window.matchMedia("(prefers-reduced-motion: reduce)"),t=F.flatMap(o=>{let r=o.querySelector(".case-vapour-canvas"),a=r&&$(o,r);return a?[{element:o,renderer:a}]:[]});if(t.length){let o=0,r=1,a=!1,u=!1,d=!0,p=()=>{a=!e.matches&&u,o=T.getBoundingClientRect().top+window.scrollY+28,r=Math.max(260,Math.min(window.innerHeight*.64,T.offsetHeight*.8)),t.forEach(({renderer:f})=>{a?f.measure():f.render(0)})},l=w.subscribe({measure:p,render(f){if(a){let n=z(f.y,o,r);t.forEach(({renderer:v})=>v.render(n))}return!1}}),h=()=>{d&&(u=!0,t.forEach(({renderer:f})=>f.measure(!0)),w.invalidate())};document.fonts.ready.then(h),e.addEventListener("change",w.invalidate);let b=new ResizeObserver(w.invalidate);t.forEach(({element:f})=>b.observe(f)),window.addEventListener("pagehide",f=>{f.persisted||(d=!1,l(),b.disconnect(),e.removeEventListener("change",w.invalidate),t.forEach(({renderer:n})=>n.destroy()))},{once:!0})}}
