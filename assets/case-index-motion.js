var q=e=>Math.max(0,Math.min(1,e)),H=e=>{let t=q(e);return t*t*t*(t*(t*6-15)+10)};function A(e,t,i,r,a=0,u=!1,m){let p=u?1:q((t+r*e.arrivalStart-i-a)/Math.min(e.arrivalMax,Math.max(e.arrivalMin,r*e.arrivalDistance))),c=m??p,f=H(c),b=H(q((c-e.lineDelay)/(1-e.lineDelay)));return{raw:p,y:e.arrivalShift*(1-f),opacity:e.arrivalOpacity+(1-e.arrivalOpacity)*f,captionY:e.arrivalShift*(1-b)}}function k(e,t,i,r,a){return Math.max(-a,Math.min(a,(e+r/2-t-i/2)/r*a))}function C(e){let t=e.settings,i=window.matchMedia("(prefers-reduced-motion: reduce)"),r=[...document.querySelectorAll(".case-index-grid .case-card")].map((o,d)=>({element:o,image:o.querySelector(".case-cover"),index:d,top:0,height:1,shift:0,value:0,last:"",done:!1})),a=[...document.querySelectorAll(".case-invitation h2, .case-invitation > .case-text-link")].map((o,d)=>({element:o,image:null,index:d,top:0,height:1,shift:0,value:0,last:"",done:!1})),u=[...r,...a],m=!1,p=!1,c=o=>{o.element.classList.remove("is-case-motion");for(let d of["--case-entry-y","--case-entry-opacity","--case-caption-y"])o.element.style.removeProperty(d);o.image?.style.removeProperty("--case-image-depth"),o.shift=0,o.last=""},f=()=>{m=!i.matches&&window.innerHeight>=600,p=window.innerWidth>=900&&window.innerHeight>=640;let o=-1/0,d=0;u.forEach(n=>{n.top=n.element.getBoundingClientRect().top+window.scrollY-n.shift,n.height=n.element.offsetHeight,n.image&&(Math.abs(n.top-o)>2&&(o=n.top,d=0),n.index=d++),n.last="",m?n.element.classList.add("is-case-motion"):c(n)})},b=e.subscribe({measure:f,render(o){if(!m)return!1;let d=!1;return u.forEach(n=>{let h=Math.min(t.staggerMax,n.index*t.stagger),s=A(t,o.y,n.top,o.height,h,n.done);n.value=e.approach(n.value,s.raw,o.dt??16.67,o.immediate??!0),d||=n.value!==s.raw;let l=A(t,o.y,n.top,o.height,h,n.done,n.value);n.value===1&&(n.done=!0);let x=n.image&&p?k(o.y,n.top,n.height,o.height,t.parallax):0,v=`${n.value}:${x}`;n.last!==v&&(n.last=v,n.shift=l.y,n.element.style.setProperty("--case-entry-y",`${l.y}px`),n.element.style.setProperty("--case-entry-opacity",String(l.opacity)),n.element.style.setProperty("--case-caption-y",`${l.captionY}px`),n.image?.style.setProperty("--case-image-depth",`${x}%`))}),d}}),g=o=>{let d=u.find(n=>n.element.contains(o.target));d&&(d.done=!0,d.value=1,e.invalidate())};return document.addEventListener("focusin",g),i.addEventListener("change",e.invalidate),()=>{b(),document.removeEventListener("focusin",g),i.removeEventListener("change",e.invalidate),u.forEach(c)}}var B={ink:"#0c0912",shadow:"#08060d",ember:"#49354f",violet:"#49358d",lavender:"#827294",silver:"#82788f"};function O(e){let t=e.replace(/^#/,"");return t.length===3&&(t=t.split("").map(i=>i+i).join("")),/^[a-f\d]{6}$/i.test(t)?[0,2,4].map(i=>parseInt(t.slice(i,i+2),16)/255):[0,0,0]}var N=`#version 300 es
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
}`;function R(e,t=B,i={}){let r=e.getContext("webgl2",{alpha:!1,antialias:!1,depth:!1,powerPreference:"low-power"});if(!r)return null;let a=null,u=null,m="",p=!1,c=()=>{a&&r.deleteProgram(a),u&&r.deleteVertexArray(u),a=u=null},f=(h,s)=>{let l=r.createShader(h);return l?(r.shaderSource(l,s),r.compileShader(l),r.getShaderParameter(l,r.COMPILE_STATUS)?l:(r.deleteShader(l),null)):null},b=()=>{let h=f(r.VERTEX_SHADER,N),s=f(r.FRAGMENT_SHADER,i.fragment??W);if(!h||!s){h&&r.deleteShader(h),s&&r.deleteShader(s);return}if(a=r.createProgram(),!a){r.deleteShader(h),r.deleteShader(s);return}if(r.attachShader(a,h),r.attachShader(a,s),r.linkProgram(a),r.deleteShader(h),r.deleteShader(s),!r.getProgramParameter(a,r.LINK_STATUS)){c();return}u=r.createVertexArray(),m=""},g=()=>{if(!a||p)return;let h=Math.min(1.25,window.devicePixelRatio||1),s=Math.max(1,Math.round(e.clientWidth*h)),l=Math.max(1,Math.round(e.clientHeight*h));if(i.maxPixels&&s*l>i.maxPixels){let v=Math.sqrt(i.maxPixels/(s*l));s=Math.max(1,Math.floor(s*v)),l=Math.max(1,Math.floor(l*v))}let x=`${s}:${l}:${h}`;if(x!==m){m=x,e.width=s,e.height=l,r.useProgram(a),r.bindVertexArray(u),r.viewport(0,0,s,l),r.uniform2f(r.getUniformLocation(a,"uRes"),s,l),r.uniform1f(r.getUniformLocation(a,"uDpr"),h);for(let[v,L]of Object.entries(t))r.uniform3fv(r.getUniformLocation(a,`u${v[0].toUpperCase()}${v.slice(1)}`),O(L));r.drawArrays(r.TRIANGLES,0,3),e.setAttribute("data-haze-ready","")}},o=h=>{h.preventDefault(),p=!0,e.removeAttribute("data-haze-ready")},d=()=>{p=!1,c(),b(),g()};e.addEventListener("webglcontextlost",o),e.addEventListener("webglcontextrestored",d),b(),g();let n=new ResizeObserver(g);return n.observe(e),()=>{n.disconnect(),e.removeEventListener("webglcontextlost",o),e.removeEventListener("webglcontextrestored",d),e.removeAttribute("data-haze-ready"),c()}}var S=e=>Math.max(0,Math.min(1,e)),U=e=>{let t=S(e);return t*t*(3-2*t)},z=(e,t,i)=>S((e-t)/Math.max(1,i)),V=e=>{let t=S(e);return t*t*t*(t*(t*6-15)+10)*1.5-.22};function G(e,t,i){let r=V(t),a=S((r-e.x/Math.max(1,i))/.26),u=U(a);return{x:e.x+u*(24+e.seed*72),y:e.y+Math.sin(e.seed*91)*u*22-u*u*44,alpha:e.alpha*Math.sin(Math.PI*a)*Math.pow(1-a,1.8),released:r>=e.x/Math.max(1,i)}}function $(e,t){let i=t.getContext("2d",{alpha:!0}),r=document.createElement("canvas"),a=r.getContext("2d",{willReadFrequently:!0}),u=[],m=0,p=0,c=0,f=1,b="#ceced7",g=-1,o="";return!i||!a?null:{measure:(h=!1)=>{let s=e.getBoundingClientRect(),l=getComputedStyle(e),x=[s.width,s.height,l.fontSize,l.fontFamily,l.fontWeight,l.letterSpacing,window.devicePixelRatio].join("|");if(!h&&x===o||(o=x,m=s.width,p=s.height,!m||!p))return;c=Math.min(100,Math.max(36,m*.07)),f=Math.min(1.5,window.devicePixelRatio||1),b=l.color,t.width=r.width=Math.ceil((m+c*2)*f),t.height=r.height=Math.ceil((p+c*2)*f),t.style.width=`${m+c*2}px`,t.style.height=`${p+c*2}px`,t.style.left=t.style.top=`${-c}px`,a.setTransform(f,0,0,f,0,0),a.clearRect(0,0,m+c*2,p+c*2),a.font=`${l.fontWeight} ${l.fontSize} ${l.fontFamily}`,a.fillStyle=b,a.textBaseline="alphabetic",a.letterSpacing=l.letterSpacing,e.querySelectorAll("[data-vapour-word]").forEach(M=>{let w=M.getBoundingClientRect(),E=a.measureText(M.textContent||""),P=E.fontBoundingBoxAscent||parseFloat(l.fontSize)*.8,I=E.fontBoundingBoxDescent||parseFloat(l.fontSize)*.2,_=w.top-s.top+(w.height-P-I)/2+P;a.fillText(M.textContent||"",w.left-s.left+c,_+c)});let v=a.getImageData(0,0,r.width,r.height).data;u=[];let L=Math.max(2.5,Math.sqrt(m*p/22e3));for(let M=c;M<p+c;M+=L)for(let w=c;w<m+c;w+=L){let E=(Math.floor(M*f)*r.width+Math.floor(w*f))*4;if(v[E+3]<48)continue;let P=((Math.imul(Math.floor(w),374761393)^Math.imul(Math.floor(M),668265263))>>>0)/4294967295;u.push({x:w-c,y:M-c,alpha:v[E+3]/255,seed:P})}g=-1},render:h=>{let s=S(h);if(s===g)return;g=s,i.setTransform(f,0,0,f,0,0),i.clearRect(0,0,t.width/f,t.height/f);let l=V(s)*m;if(e.style.setProperty("--vapour-front",`${l}px`),!s||s===1){e.classList.toggle("is-vaporizing",s===1),t.style.opacity="0";return}i.fillStyle=b,u.forEach(x=>{let v=G(x,s,m);!v.released||v.alpha<.01||(i.globalAlpha=v.alpha,i.beginPath(),i.arc(v.x+c,v.y+c,.45+x.seed*.35,0,Math.PI*2),i.fill())}),i.globalAlpha=1,t.style.opacity="1",e.classList.add("is-vaporizing")},destroy(){u=[],e.classList.remove("is-vaporizing"),e.style.removeProperty("--vapour-front"),t.style.opacity="0",t.width=t.height=0}}}var D=document.querySelector(".case-haze-canvas");if(D){let e=R(D);window.addEventListener("pagehide",t=>{t.persisted||e?.()})}var y=window.HevenMotion;if(y){let e=document.querySelector(".case-scroll-cue"),t=!1;y.subscribe({measure(){},render(r){return e&&!t&&r.y>1&&(t=!0,e.classList.add("is-dismissed")),!1}});let i=C(y);window.addEventListener("pagehide",r=>{r.persisted||i()})}var T=document.querySelector("[data-case-vapour]"),F=[...T?.querySelectorAll("[data-vapour-block]")??[]];if(y&&T&&F.length){let e=window.matchMedia("(prefers-reduced-motion: reduce)"),t=F.flatMap(i=>{let r=i.querySelector(".case-vapour-canvas"),a=r&&$(i,r);return a?[{element:i,renderer:a}]:[]});if(t.length){let i=0,r=1,a=!1,u=0,m=!1,p=!0,c=()=>{a=!e.matches&&m,a||(u=0),i=T.getBoundingClientRect().top+window.scrollY+28,r=Math.max(260,Math.min(window.innerHeight*.64,T.offsetHeight*.8)),t.forEach(({renderer:o})=>{a?o.measure():o.render(0)})},f=y.subscribe({measure:c,render(o){if(a){let d=z(o.y,i,r);return u=y.approach(u,d,o.dt,o.immediate||d===0||d===1),t.forEach(({renderer:n})=>n.render(u)),u!==d}return!1}}),b=()=>{p&&(m=!0,t.forEach(({renderer:o})=>o.measure(!0)),y.invalidate())};document.fonts.ready.then(b),e.addEventListener("change",y.invalidate);let g=new ResizeObserver(y.invalidate);t.forEach(({element:o})=>g.observe(o)),window.addEventListener("pagehide",o=>{o.persisted||(p=!1,f(),g.disconnect(),e.removeEventListener("change",y.invalidate),t.forEach(({renderer:d})=>d.destroy()))})}}
