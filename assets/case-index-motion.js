var C=t=>Math.max(0,Math.min(1,t)),A=t=>{let o=C(t);return o*o*o*(o*(o*6-15)+10)};function D(t,o,e,r=0,a=!1){let c=a?1:C((t+e*.94-o-r)/Math.min(240,e*.26)),d=A(c),f=A(C((c-.16)/.84));return{raw:c,y:26*(1-d),opacity:.78+.22*d,captionY:12*(1-f)}}function B(t,o,e,r){return Math.max(-2,Math.min(2,(t+r/2-o-e/2)/r*2))}function H(t){let o=window.matchMedia("(prefers-reduced-motion: reduce)"),e=[...document.querySelectorAll(".case-index-grid .case-card")].map((n,i)=>({element:n,image:n.querySelector(".case-cover"),index:i,top:0,height:1,shift:0,last:"",done:!1})),r=[...document.querySelectorAll(".case-invitation h2, .case-invitation > .case-text-link")].map((n,i)=>({element:n,image:null,index:i,top:0,height:1,shift:0,last:"",done:!1})),a=[...e,...r],c=!1,d=2,f=n=>{n.element.classList.remove("is-case-motion");for(let i of["--case-entry-y","--case-entry-opacity","--case-caption-y"])n.element.style.removeProperty(i);n.image?.style.removeProperty("--case-image-depth"),n.shift=0,n.last=""},l=()=>{c=!o.matches&&window.innerHeight>=600,d=window.innerWidth<=600?1:2,a.forEach(n=>{n.top=n.element.getBoundingClientRect().top+window.scrollY-n.shift,n.height=n.element.offsetHeight,n.last="",c?n.element.classList.add("is-case-motion"):f(n)})},h=t.subscribe({measure:l,render(n){return c&&a.forEach(i=>{let E=i.image?i.index%d*44:i.index*28,u=D(n.y,i.top,n.height,E,i.done);u.raw===1&&(i.done=!0);let m=i.image?B(n.y,i.top,i.height,n.height)*(d===1?.65:1):0,s=`${u.raw}:${m}`;i.last!==s&&(i.last=s,i.shift=u.y,i.element.style.setProperty("--case-entry-y",`${u.y}px`),i.element.style.setProperty("--case-entry-opacity",String(u.opacity)),i.element.style.setProperty("--case-caption-y",`${u.captionY}px`),i.image?.style.setProperty("--case-image-depth",`${m}%`))}),!1}}),v=n=>{let i=a.find(E=>E.element.contains(n.target));i&&(i.done=!0,t.invalidate())};return document.addEventListener("focusin",v),o.addEventListener("change",t.invalidate),()=>{h(),document.removeEventListener("focusin",v),o.removeEventListener("change",t.invalidate),a.forEach(f)}}var N={ink:"#0c0912",shadow:"#08060d",ember:"#49354f",violet:"#49358d",lavender:"#827294",silver:"#82788f"};function W(t){let o=t.replace(/^#/,"");return o.length===3&&(o=o.split("").map(e=>e+e).join("")),/^[a-f\d]{6}$/i.test(o)?[0,2,4].map(e=>parseInt(o.slice(e,e+2),16)/255):[0,0,0]}var U=`#version 300 es
void main(){
  vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));
  gl_Position=vec4(p*2.0-1.0,0.0,1.0);
}`,G=`#version 300 es
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
}`;function R(t,o=N){let e=t.getContext("webgl2",{alpha:!1,antialias:!1,depth:!1,powerPreference:"low-power"});if(!e)return null;let r=null,a=null,c="",d=!1,f=()=>{r&&e.deleteProgram(r),a&&e.deleteVertexArray(a),r=a=null},l=(u,m)=>{let s=e.createShader(u);return s?(e.shaderSource(s,m),e.compileShader(s),e.getShaderParameter(s,e.COMPILE_STATUS)?s:(e.deleteShader(s),null)):null},h=()=>{let u=l(e.VERTEX_SHADER,U),m=l(e.FRAGMENT_SHADER,G);if(!u||!m){u&&e.deleteShader(u),m&&e.deleteShader(m);return}if(r=e.createProgram(),!r){e.deleteShader(u),e.deleteShader(m);return}if(e.attachShader(r,u),e.attachShader(r,m),e.linkProgram(r),e.deleteShader(u),e.deleteShader(m),!e.getProgramParameter(r,e.LINK_STATUS)){f();return}a=e.createVertexArray(),c=""},v=()=>{if(!r||d)return;let u=Math.min(1.25,window.devicePixelRatio||1),m=Math.max(1,Math.round(t.clientWidth*u)),s=Math.max(1,Math.round(t.clientHeight*u)),p=`${m}:${s}:${u}`;if(p!==c){c=p,t.width=m,t.height=s,e.useProgram(r),e.bindVertexArray(a),e.viewport(0,0,m,s),e.uniform2f(e.getUniformLocation(r,"uRes"),m,s),e.uniform1f(e.getUniformLocation(r,"uDpr"),u);for(let[y,g]of Object.entries(o))e.uniform3fv(e.getUniformLocation(r,`u${y[0].toUpperCase()}${y.slice(1)}`),W(g));e.drawArrays(e.TRIANGLES,0,3),t.setAttribute("data-haze-ready","")}},n=u=>{u.preventDefault(),d=!0,t.removeAttribute("data-haze-ready")},i=()=>{d=!1,f(),h(),v()};t.addEventListener("webglcontextlost",n),t.addEventListener("webglcontextrestored",i),h(),v();let E=new ResizeObserver(v);return E.observe(t),()=>{E.disconnect(),t.removeEventListener("webglcontextlost",n),t.removeEventListener("webglcontextrestored",i),t.removeAttribute("data-haze-ready"),f()}}var S=t=>Math.max(0,Math.min(1,t)),O=t=>{let o=S(t);return o*o*(3-2*o)},z=(t,o,e)=>S((t-o)/Math.max(1,e)),V=t=>{let o=S(t);return o*o*o*(o*(o*6-15)+10)*1.5-.22};function j(t,o,e){let r=V(o),a=S((r-t.x/Math.max(1,e))/.26),c=O(a);return{x:t.x+c*(24+t.seed*72),y:t.y+Math.sin(t.seed*91)*c*22-c*c*44,alpha:t.alpha*Math.sin(Math.PI*a)*Math.pow(1-a,1.8),released:r>=t.x/Math.max(1,e)}}function $(t,o){let e=o.getContext("2d",{alpha:!0}),r=document.createElement("canvas"),a=r.getContext("2d",{willReadFrequently:!0}),c=[],d=0,f=0,l=0,h=1,v="#ceced7",n=-1,i="";return!e||!a?null:{measure:(m=!1)=>{let s=t.getBoundingClientRect(),p=getComputedStyle(t),y=[s.width,s.height,p.fontSize,p.fontFamily,p.fontWeight,p.letterSpacing,window.devicePixelRatio].join("|");if(!m&&y===i||(i=y,d=s.width,f=s.height,!d||!f))return;l=Math.min(100,Math.max(36,d*.07)),h=Math.min(1.5,window.devicePixelRatio||1),v=p.color,o.width=r.width=Math.ceil((d+l*2)*h),o.height=r.height=Math.ceil((f+l*2)*h),o.style.width=`${d+l*2}px`,o.style.height=`${f+l*2}px`,o.style.left=o.style.top=`${-l}px`,a.setTransform(h,0,0,h,0,0),a.clearRect(0,0,d+l*2,f+l*2),a.font=`${p.fontWeight} ${p.fontSize} ${p.fontFamily}`,a.fillStyle=v,a.textBaseline="alphabetic",a.letterSpacing=p.letterSpacing,t.querySelectorAll("[data-vapour-word]").forEach(x=>{let b=x.getBoundingClientRect(),M=a.measureText(x.textContent||""),L=M.fontBoundingBoxAscent||parseFloat(p.fontSize)*.8,I=M.fontBoundingBoxDescent||parseFloat(p.fontSize)*.2,k=b.top-s.top+(b.height-L-I)/2+L;a.fillText(x.textContent||"",b.left-s.left+l,k+l)});let g=a.getImageData(0,0,r.width,r.height).data;c=[];let q=Math.max(2.5,Math.sqrt(d*f/22e3));for(let x=l;x<f+l;x+=q)for(let b=l;b<d+l;b+=q){let M=(Math.floor(x*h)*r.width+Math.floor(b*h))*4;if(g[M+3]<48)continue;let L=((Math.imul(Math.floor(b),374761393)^Math.imul(Math.floor(x),668265263))>>>0)/4294967295;c.push({x:b-l,y:x-l,alpha:g[M+3]/255,seed:L})}n=-1},render:m=>{let s=S(m);if(s===n)return;n=s,e.setTransform(h,0,0,h,0,0),e.clearRect(0,0,o.width/h,o.height/h);let p=V(s)*d;if(t.style.setProperty("--vapour-front",`${p}px`),!s||s===1){t.classList.toggle("is-vaporizing",s===1),o.style.opacity="0";return}e.fillStyle=v,c.forEach(y=>{let g=j(y,s,d);!g.released||g.alpha<.01||(e.globalAlpha=g.alpha,e.beginPath(),e.arc(g.x+l,g.y+l,.45+y.seed*.35,0,Math.PI*2),e.fill())}),e.globalAlpha=1,o.style.opacity="1",t.classList.add("is-vaporizing")},destroy(){c=[],t.classList.remove("is-vaporizing"),t.style.removeProperty("--vapour-front"),o.style.opacity="0",o.width=o.height=0}}}var F=document.querySelector(".case-haze-canvas");if(F){let t=R(F);window.addEventListener("pagehide",o=>{o.persisted||t?.()})}var w=window.HevenMotion;if(w){let t=H(w);window.addEventListener("pagehide",o=>{o.persisted||t()})}var P=document.querySelector("[data-case-vapour]"),T=P?.querySelector("h1"),_=T?.querySelector("canvas");if(w&&P&&T&&_){let t=window.matchMedia("(prefers-reduced-motion: reduce)"),o=$(T,_);if(o){let e=0,r=1,a=!1,c=!1,d=()=>{a=!t.matches&&c,e=P.getBoundingClientRect().top+window.scrollY+28,r=Math.max(260,Math.min(window.innerHeight*.64,P.offsetHeight*.8)),a?o.measure():o.render(0)},f=w.subscribe({measure:d,render(v){return a&&o.render(z(v.y,e,r)),!1}}),l=()=>{c=!0,o.measure(!0),w.invalidate()};document.fonts.ready.then(l),t.addEventListener("change",w.invalidate);let h=new ResizeObserver(w.invalidate);h.observe(T),window.addEventListener("pagehide",v=>{v.persisted||(f(),h.disconnect(),t.removeEventListener("change",w.invalidate),o.destroy())},{once:!0})}}
