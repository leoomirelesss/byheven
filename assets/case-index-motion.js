var T=e=>Math.max(0,Math.min(1,e)),q=e=>{let r=T(e);return r*r*r*(r*(r*6-15)+10)};function A(e,r,t,o,i=0,c=!1,u){let f=c?1:T((r+o*e.arrivalStart-t-i)/Math.min(e.arrivalMax,Math.max(e.arrivalMin,o*e.arrivalDistance))),s=u??f,d=q(s),g=q(T((s-e.lineDelay)/(1-e.lineDelay)));return{raw:f,y:e.arrivalShift*(1-d),opacity:e.arrivalOpacity+(1-e.arrivalOpacity)*d,captionY:e.arrivalShift*(1-g)}}function k(e,r,t,o,i){return Math.max(-i,Math.min(i,(e+o/2-r-t/2)/o*i))}function C(e){let r=e.settings,t=window.matchMedia("(prefers-reduced-motion: reduce)"),o=[...document.querySelectorAll(".case-index-grid .case-card")].map((n,v)=>({element:n,image:n.querySelector(".case-cover"),index:v,top:0,height:1,shift:0,value:0,last:"",done:!1})),i=[...document.querySelectorAll(".case-invitation h2, .case-invitation > .case-text-link")].map((n,v)=>({element:n,image:null,index:v,top:0,height:1,shift:0,value:0,last:"",done:!1})),c=[...o,...i],u=!1,f=!1,s=n=>{n.element.classList.remove("is-case-motion");for(let v of["--case-entry-y","--case-entry-opacity","--case-caption-y"])n.element.style.removeProperty(v);n.image?.style.removeProperty("--case-image-depth"),n.shift=0,n.last=""},d=()=>{u=!t.matches&&window.innerHeight>=600,f=window.innerWidth>=900&&window.innerHeight>=640,c.forEach(n=>{n.top=n.element.getBoundingClientRect().top+window.scrollY-n.shift,n.height=n.element.offsetHeight,n.last="",u?n.element.classList.add("is-case-motion"):s(n)})},g=e.subscribe({measure:d,render(n){if(!u)return!1;let v=!1;return c.forEach(a=>{let p=Math.min(r.staggerMax,a.index*r.stagger),l=A(r,n.y,a.top,n.height,p,a.done);a.value=e.approach(a.value,l.raw,n.dt??16.67,n.immediate??!0),v||=a.value!==l.raw;let m=A(r,n.y,a.top,n.height,p,a.done,a.value);a.value===1&&(a.done=!0);let x=a.image&&f?k(n.y,a.top,a.height,n.height,r.parallax):0,b=`${a.value}:${x}`;a.last!==b&&(a.last=b,a.shift=m.y,a.element.style.setProperty("--case-entry-y",`${m.y}px`),a.element.style.setProperty("--case-entry-opacity",String(m.opacity)),a.element.style.setProperty("--case-caption-y",`${m.captionY}px`),a.image?.style.setProperty("--case-image-depth",`${x}%`))}),v}}),h=n=>{let v=c.find(a=>a.element.contains(n.target));v&&(v.done=!0,e.invalidate())};return document.addEventListener("focusin",h),t.addEventListener("change",e.invalidate),()=>{g(),document.removeEventListener("focusin",h),t.removeEventListener("change",e.invalidate),c.forEach(s)}}var B={ink:"#0c0912",shadow:"#08060d",ember:"#49354f",violet:"#49358d",lavender:"#827294",silver:"#82788f"};function O(e){let r=e.replace(/^#/,"");return r.length===3&&(r=r.split("").map(t=>t+t).join("")),/^[a-f\d]{6}$/i.test(r)?[0,2,4].map(t=>parseInt(r.slice(t,t+2),16)/255):[0,0,0]}var N=`#version 300 es
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
}`;function R(e,r=B){let t=e.getContext("webgl2",{alpha:!1,antialias:!1,depth:!1,powerPreference:"low-power"});if(!t)return null;let o=null,i=null,c="",u=!1,f=()=>{o&&t.deleteProgram(o),i&&t.deleteVertexArray(i),o=i=null},s=(a,p)=>{let l=t.createShader(a);return l?(t.shaderSource(l,p),t.compileShader(l),t.getShaderParameter(l,t.COMPILE_STATUS)?l:(t.deleteShader(l),null)):null},d=()=>{let a=s(t.VERTEX_SHADER,N),p=s(t.FRAGMENT_SHADER,W);if(!a||!p){a&&t.deleteShader(a),p&&t.deleteShader(p);return}if(o=t.createProgram(),!o){t.deleteShader(a),t.deleteShader(p);return}if(t.attachShader(o,a),t.attachShader(o,p),t.linkProgram(o),t.deleteShader(a),t.deleteShader(p),!t.getProgramParameter(o,t.LINK_STATUS)){f();return}i=t.createVertexArray(),c=""},g=()=>{if(!o||u)return;let a=Math.min(1.25,window.devicePixelRatio||1),p=Math.max(1,Math.round(e.clientWidth*a)),l=Math.max(1,Math.round(e.clientHeight*a)),m=`${p}:${l}:${a}`;if(m!==c){c=m,e.width=p,e.height=l,t.useProgram(o),t.bindVertexArray(i),t.viewport(0,0,p,l),t.uniform2f(t.getUniformLocation(o,"uRes"),p,l),t.uniform1f(t.getUniformLocation(o,"uDpr"),a);for(let[x,b]of Object.entries(r))t.uniform3fv(t.getUniformLocation(o,`u${x[0].toUpperCase()}${x.slice(1)}`),O(b));t.drawArrays(t.TRIANGLES,0,3),e.setAttribute("data-haze-ready","")}},h=a=>{a.preventDefault(),u=!0,e.removeAttribute("data-haze-ready")},n=()=>{u=!1,f(),d(),g()};e.addEventListener("webglcontextlost",h),e.addEventListener("webglcontextrestored",n),d(),g();let v=new ResizeObserver(g);return v.observe(e),()=>{v.disconnect(),e.removeEventListener("webglcontextlost",h),e.removeEventListener("webglcontextrestored",n),e.removeAttribute("data-haze-ready"),f()}}var S=e=>Math.max(0,Math.min(1,e)),U=e=>{let r=S(e);return r*r*(3-2*r)},z=(e,r,t)=>S((e-r)/Math.max(1,t)),V=e=>{let r=S(e);return r*r*r*(r*(r*6-15)+10)*1.5-.22};function G(e,r,t){let o=V(r),i=S((o-e.x/Math.max(1,t))/.26),c=U(i);return{x:e.x+c*(24+e.seed*72),y:e.y+Math.sin(e.seed*91)*c*22-c*c*44,alpha:e.alpha*Math.sin(Math.PI*i)*Math.pow(1-i,1.8),released:o>=e.x/Math.max(1,t)}}function $(e,r){let t=r.getContext("2d",{alpha:!0}),o=document.createElement("canvas"),i=o.getContext("2d",{willReadFrequently:!0}),c=[],u=0,f=0,s=0,d=1,g="#ceced7",h=-1,n="";return!t||!i?null:{measure:(p=!1)=>{let l=e.getBoundingClientRect(),m=getComputedStyle(e),x=[l.width,l.height,m.fontSize,m.fontFamily,m.fontWeight,m.letterSpacing,window.devicePixelRatio].join("|");if(!p&&x===n||(n=x,u=l.width,f=l.height,!u||!f))return;s=Math.min(100,Math.max(36,u*.07)),d=Math.min(1.5,window.devicePixelRatio||1),g=m.color,r.width=o.width=Math.ceil((u+s*2)*d),r.height=o.height=Math.ceil((f+s*2)*d),r.style.width=`${u+s*2}px`,r.style.height=`${f+s*2}px`,r.style.left=r.style.top=`${-s}px`,i.setTransform(d,0,0,d,0,0),i.clearRect(0,0,u+s*2,f+s*2),i.font=`${m.fontWeight} ${m.fontSize} ${m.fontFamily}`,i.fillStyle=g,i.textBaseline="alphabetic",i.letterSpacing=m.letterSpacing,e.querySelectorAll("[data-vapour-word]").forEach(y=>{let M=y.getBoundingClientRect(),E=i.measureText(y.textContent||""),L=E.fontBoundingBoxAscent||parseFloat(m.fontSize)*.8,_=E.fontBoundingBoxDescent||parseFloat(m.fontSize)*.2,I=M.top-l.top+(M.height-L-_)/2+L;i.fillText(y.textContent||"",M.left-l.left+s,I+s)});let b=i.getImageData(0,0,o.width,o.height).data;c=[];let H=Math.max(2.5,Math.sqrt(u*f/22e3));for(let y=s;y<f+s;y+=H)for(let M=s;M<u+s;M+=H){let E=(Math.floor(y*d)*o.width+Math.floor(M*d))*4;if(b[E+3]<48)continue;let L=((Math.imul(Math.floor(M),374761393)^Math.imul(Math.floor(y),668265263))>>>0)/4294967295;c.push({x:M-s,y:y-s,alpha:b[E+3]/255,seed:L})}h=-1},render:p=>{let l=S(p);if(l===h)return;h=l,t.setTransform(d,0,0,d,0,0),t.clearRect(0,0,r.width/d,r.height/d);let m=V(l)*u;if(e.style.setProperty("--vapour-front",`${m}px`),!l||l===1){e.classList.toggle("is-vaporizing",l===1),r.style.opacity="0";return}t.fillStyle=g,c.forEach(x=>{let b=G(x,l,u);!b.released||b.alpha<.01||(t.globalAlpha=b.alpha,t.beginPath(),t.arc(b.x+s,b.y+s,.45+x.seed*.35,0,Math.PI*2),t.fill())}),t.globalAlpha=1,r.style.opacity="1",e.classList.add("is-vaporizing")},destroy(){c=[],e.classList.remove("is-vaporizing"),e.style.removeProperty("--vapour-front"),r.style.opacity="0",r.width=r.height=0}}}var D=document.querySelector(".case-haze-canvas");if(D){let e=R(D);window.addEventListener("pagehide",r=>{r.persisted||e?.()})}var w=window.HevenMotion;if(w){let e=document.querySelector(".case-scroll-cue"),r=!1;w.subscribe({measure(){},render(o){return e&&!r&&o.y>1&&(r=!0,e.classList.add("is-dismissed")),!1}});let t=C(w);window.addEventListener("pagehide",o=>{o.persisted||t()})}var P=document.querySelector("[data-case-vapour]"),F=[...P?.querySelectorAll("[data-vapour-block]")??[]];if(w&&P&&F.length){let e=window.matchMedia("(prefers-reduced-motion: reduce)"),r=F.flatMap(t=>{let o=t.querySelector(".case-vapour-canvas"),i=o&&$(t,o);return i?[{element:t,renderer:i}]:[]});if(r.length){let t=0,o=1,i=!1,c=!1,u=!0,f=()=>{i=!e.matches&&c,t=P.getBoundingClientRect().top+window.scrollY+28,o=Math.max(260,Math.min(window.innerHeight*.64,P.offsetHeight*.8)),r.forEach(({renderer:h})=>{i?h.measure():h.render(0)})},s=w.subscribe({measure:f,render(h){if(i){let n=z(h.y,t,o);r.forEach(({renderer:v})=>v.render(n))}return!1}}),d=()=>{u&&(c=!0,r.forEach(({renderer:h})=>h.measure(!0)),w.invalidate())};document.fonts.ready.then(d),e.addEventListener("change",w.invalidate);let g=new ResizeObserver(w.invalidate);r.forEach(({element:h})=>g.observe(h)),window.addEventListener("pagehide",h=>{h.persisted||(u=!1,s(),g.disconnect(),e.removeEventListener("change",w.invalidate),r.forEach(({renderer:n})=>n.destroy()))},{once:!0})}}
