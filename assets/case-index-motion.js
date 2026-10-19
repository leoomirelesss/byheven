var H=e=>Math.max(0,Math.min(1,e)),C=e=>{let r=H(e);return r*r*r*(r*(r*6-15)+10)};function A(e,r,t,a,i=0,c=!1,u){let p=c?1:H((r+a*e.arrivalStart-t-i)/Math.min(e.arrivalMax,Math.max(e.arrivalMin,a*e.arrivalDistance))),s=u??p,d=C(s),f=C(H((s-e.lineDelay)/(1-e.lineDelay)));return{raw:p,y:e.arrivalShift*(1-d),opacity:e.arrivalOpacity+(1-e.arrivalOpacity)*d,captionY:e.arrivalShift*(1-f)}}function B(e,r,t,a,i){return Math.max(-i,Math.min(i,(e+a/2-r-t/2)/a*i))}function R(e){let r=e.settings,t=window.matchMedia("(prefers-reduced-motion: reduce)"),a=[...document.querySelectorAll(".case-index-grid .case-card")].map((n,v)=>({element:n,image:n.querySelector(".case-cover"),index:v,top:0,height:1,shift:0,value:0,last:"",done:!1})),i=[...document.querySelectorAll(".case-invitation h2, .case-invitation > .case-text-link")].map((n,v)=>({element:n,image:null,index:v,top:0,height:1,shift:0,value:0,last:"",done:!1})),c=[...a,...i],u=!1,p=!1,s=n=>{n.element.classList.remove("is-case-motion");for(let v of["--case-entry-y","--case-entry-opacity","--case-caption-y"])n.element.style.removeProperty(v);n.image?.style.removeProperty("--case-image-depth"),n.shift=0,n.last=""},d=()=>{u=!t.matches&&window.innerHeight>=600,p=window.innerWidth>=900&&window.innerHeight>=640,c.forEach(n=>{n.top=n.element.getBoundingClientRect().top+window.scrollY-n.shift,n.height=n.element.offsetHeight,n.last="",u?n.element.classList.add("is-case-motion"):s(n)})},f=e.subscribe({measure:d,render(n){if(!u)return!1;let v=!1;return c.forEach(o=>{let h=Math.min(r.staggerMax,o.index*r.stagger),l=A(r,n.y,o.top,n.height,h,o.done);o.value=e.approach(o.value,l.raw,n.dt??16.67,n.immediate??!0),v||=o.value!==l.raw;let m=A(r,n.y,o.top,n.height,h,o.done,o.value);o.value===1&&(o.done=!0);let b=o.image&&p?B(n.y,o.top,o.height,n.height,r.parallax):0,g=`${o.value}:${b}`;o.last!==g&&(o.last=g,o.shift=m.y,o.element.style.setProperty("--case-entry-y",`${m.y}px`),o.element.style.setProperty("--case-entry-opacity",String(m.opacity)),o.element.style.setProperty("--case-caption-y",`${m.captionY}px`),o.image?.style.setProperty("--case-image-depth",`${b}%`))}),v}}),x=n=>{let v=c.find(o=>o.element.contains(n.target));v&&(v.done=!0,e.invalidate())};return document.addEventListener("focusin",x),t.addEventListener("change",e.invalidate),()=>{f(),document.removeEventListener("focusin",x),t.removeEventListener("change",e.invalidate),c.forEach(s)}}var O={ink:"#0c0912",shadow:"#08060d",ember:"#49354f",violet:"#49358d",lavender:"#827294",silver:"#82788f"};function N(e){let r=e.replace(/^#/,"");return r.length===3&&(r=r.split("").map(t=>t+t).join("")),/^[a-f\d]{6}$/i.test(r)?[0,2,4].map(t=>parseInt(r.slice(t,t+2),16)/255):[0,0,0]}var W=`#version 300 es
void main(){
  vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));
  gl_Position=vec4(p*2.0-1.0,0.0,1.0);
}`,U=`#version 300 es
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
}`;function z(e,r=O){let t=e.getContext("webgl2",{alpha:!1,antialias:!1,depth:!1,powerPreference:"low-power"});if(!t)return null;let a=null,i=null,c="",u=!1,p=()=>{a&&t.deleteProgram(a),i&&t.deleteVertexArray(i),a=i=null},s=(o,h)=>{let l=t.createShader(o);return l?(t.shaderSource(l,h),t.compileShader(l),t.getShaderParameter(l,t.COMPILE_STATUS)?l:(t.deleteShader(l),null)):null},d=()=>{let o=s(t.VERTEX_SHADER,W),h=s(t.FRAGMENT_SHADER,U);if(!o||!h){o&&t.deleteShader(o),h&&t.deleteShader(h);return}if(a=t.createProgram(),!a){t.deleteShader(o),t.deleteShader(h);return}if(t.attachShader(a,o),t.attachShader(a,h),t.linkProgram(a),t.deleteShader(o),t.deleteShader(h),!t.getProgramParameter(a,t.LINK_STATUS)){p();return}i=t.createVertexArray(),c=""},f=()=>{if(!a||u)return;let o=Math.min(1.25,window.devicePixelRatio||1),h=Math.max(1,Math.round(e.clientWidth*o)),l=Math.max(1,Math.round(e.clientHeight*o)),m=`${h}:${l}:${o}`;if(m!==c){c=m,e.width=h,e.height=l,t.useProgram(a),t.bindVertexArray(i),t.viewport(0,0,h,l),t.uniform2f(t.getUniformLocation(a,"uRes"),h,l),t.uniform1f(t.getUniformLocation(a,"uDpr"),o);for(let[b,g]of Object.entries(r))t.uniform3fv(t.getUniformLocation(a,`u${b[0].toUpperCase()}${b.slice(1)}`),N(g));t.drawArrays(t.TRIANGLES,0,3),e.setAttribute("data-haze-ready","")}},x=o=>{o.preventDefault(),u=!0,e.removeAttribute("data-haze-ready")},n=()=>{u=!1,p(),d(),f()};e.addEventListener("webglcontextlost",x),e.addEventListener("webglcontextrestored",n),d(),f();let v=new ResizeObserver(f);return v.observe(e),()=>{v.disconnect(),e.removeEventListener("webglcontextlost",x),e.removeEventListener("webglcontextrestored",n),e.removeAttribute("data-haze-ready"),p()}}var S=e=>Math.max(0,Math.min(1,e)),G=e=>{let r=S(e);return r*r*(3-2*r)},V=(e,r,t)=>S((e-r)/Math.max(1,t)),$=e=>{let r=S(e);return r*r*r*(r*(r*6-15)+10)*1.5-.22};function j(e,r,t){let a=$(r),i=S((a-e.x/Math.max(1,t))/.26),c=G(i);return{x:e.x+c*(24+e.seed*72),y:e.y+Math.sin(e.seed*91)*c*22-c*c*44,alpha:e.alpha*Math.sin(Math.PI*i)*Math.pow(1-i,1.8),released:a>=e.x/Math.max(1,t)}}function D(e,r){let t=r.getContext("2d",{alpha:!0}),a=document.createElement("canvas"),i=a.getContext("2d",{willReadFrequently:!0}),c=[],u=0,p=0,s=0,d=1,f="#ceced7",x=-1,n="";return!t||!i?null:{measure:(h=!1)=>{let l=e.getBoundingClientRect(),m=getComputedStyle(e),b=[l.width,l.height,m.fontSize,m.fontFamily,m.fontWeight,m.letterSpacing,window.devicePixelRatio].join("|");if(!h&&b===n||(n=b,u=l.width,p=l.height,!u||!p))return;s=Math.min(100,Math.max(36,u*.07)),d=Math.min(1.5,window.devicePixelRatio||1),f=m.color,r.width=a.width=Math.ceil((u+s*2)*d),r.height=a.height=Math.ceil((p+s*2)*d),r.style.width=`${u+s*2}px`,r.style.height=`${p+s*2}px`,r.style.left=r.style.top=`${-s}px`,i.setTransform(d,0,0,d,0,0),i.clearRect(0,0,u+s*2,p+s*2),i.font=`${m.fontWeight} ${m.fontSize} ${m.fontFamily}`,i.fillStyle=f,i.textBaseline="alphabetic",i.letterSpacing=m.letterSpacing,e.querySelectorAll("[data-vapour-word]").forEach(y=>{let M=y.getBoundingClientRect(),E=i.measureText(y.textContent||""),L=E.fontBoundingBoxAscent||parseFloat(m.fontSize)*.8,I=E.fontBoundingBoxDescent||parseFloat(m.fontSize)*.2,k=M.top-l.top+(M.height-L-I)/2+L;i.fillText(y.textContent||"",M.left-l.left+s,k+s)});let g=i.getImageData(0,0,a.width,a.height).data;c=[];let q=Math.max(2.5,Math.sqrt(u*p/22e3));for(let y=s;y<p+s;y+=q)for(let M=s;M<u+s;M+=q){let E=(Math.floor(y*d)*a.width+Math.floor(M*d))*4;if(g[E+3]<48)continue;let L=((Math.imul(Math.floor(M),374761393)^Math.imul(Math.floor(y),668265263))>>>0)/4294967295;c.push({x:M-s,y:y-s,alpha:g[E+3]/255,seed:L})}x=-1},render:h=>{let l=S(h);if(l===x)return;x=l,t.setTransform(d,0,0,d,0,0),t.clearRect(0,0,r.width/d,r.height/d);let m=$(l)*u;if(e.style.setProperty("--vapour-front",`${m}px`),!l||l===1){e.classList.toggle("is-vaporizing",l===1),r.style.opacity="0";return}t.fillStyle=f,c.forEach(b=>{let g=j(b,l,u);!g.released||g.alpha<.01||(t.globalAlpha=g.alpha,t.beginPath(),t.arc(g.x+s,g.y+s,.45+b.seed*.35,0,Math.PI*2),t.fill())}),t.globalAlpha=1,r.style.opacity="1",e.classList.add("is-vaporizing")},destroy(){c=[],e.classList.remove("is-vaporizing"),e.style.removeProperty("--vapour-front"),r.style.opacity="0",r.width=r.height=0}}}var F=document.querySelector(".case-haze-canvas");if(F){let e=z(F);window.addEventListener("pagehide",r=>{r.persisted||e?.()})}var w=window.HevenMotion;if(w){let e=document.querySelector(".case-scroll-cue"),r=!1;w.subscribe({measure(){},render(a){return e&&!r&&a.y>1&&(r=!0,e.classList.add("is-dismissed")),!1}});let t=R(w);window.addEventListener("pagehide",a=>{a.persisted||t()})}var P=document.querySelector("[data-case-vapour]"),T=P?.querySelector("h1"),_=T?.querySelector("canvas");if(w&&P&&T&&_){let e=window.matchMedia("(prefers-reduced-motion: reduce)"),r=D(T,_);if(r){let t=0,a=1,i=!1,c=!1,u=()=>{i=!e.matches&&c,t=P.getBoundingClientRect().top+window.scrollY+28,a=Math.max(260,Math.min(window.innerHeight*.64,P.offsetHeight*.8)),i?r.measure():r.render(0)},p=w.subscribe({measure:u,render(f){return i&&r.render(V(f.y,t,a)),!1}}),s=()=>{c=!0,r.measure(!0),w.invalidate()};document.fonts.ready.then(s),e.addEventListener("change",w.invalidate);let d=new ResizeObserver(w.invalidate);d.observe(T),window.addEventListener("pagehide",f=>{f.persisted||(p(),d.disconnect(),e.removeEventListener("change",w.invalidate),r.destroy())},{once:!0})}}
