var $={ink:"#090909",shadow:"#07060a",ember:"#49354f",violet:"#49358d",lavender:"#827294",silver:"#82788f"};function k(t){let r=t.replace(/^#/,"");return r.length===3&&(r=r.split("").map(e=>e+e).join("")),/^[a-f\d]{6}$/i.test(r)?[0,2,4].map(e=>parseInt(r.slice(e,e+2),16)/255):[0,0,0]}var D=`#version 300 es
void main(){
  vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));
  gl_Position=vec4(p*2.0-1.0,0.0,1.0);
}`,B=`#version 300 es
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
}`;function A(t,r=$){let e=t.getContext("webgl2",{alpha:!1,antialias:!1,depth:!1,powerPreference:"low-power"});if(!e)return null;let o=null,a=null,c="",d=!1,f=()=>{o&&e.deleteProgram(o),a&&e.deleteVertexArray(a),o=a=null},i=(u,s)=>{let n=e.createShader(u);return n?(e.shaderSource(n,s),e.compileShader(n),e.getShaderParameter(n,e.COMPILE_STATUS)?n:(e.deleteShader(n),null)):null},l=()=>{let u=i(e.VERTEX_SHADER,D),s=i(e.FRAGMENT_SHADER,B);if(!u||!s){u&&e.deleteShader(u),s&&e.deleteShader(s);return}if(o=e.createProgram(),!o){e.deleteShader(u),e.deleteShader(s);return}if(e.attachShader(o,u),e.attachShader(o,s),e.linkProgram(o),e.deleteShader(u),e.deleteShader(s),!e.getProgramParameter(o,e.LINK_STATUS)){f();return}a=e.createVertexArray(),c=""},m=()=>{if(!o||d)return;let u=Math.min(1.25,window.devicePixelRatio||1),s=Math.max(1,Math.round(t.clientWidth*u)),n=Math.max(1,Math.round(t.clientHeight*u)),h=`${s}:${n}:${u}`;if(h!==c){c=h,t.width=s,t.height=n,e.useProgram(o),e.bindVertexArray(a),e.viewport(0,0,s,n),e.uniform2f(e.getUniformLocation(o,"uRes"),s,n),e.uniform1f(e.getUniformLocation(o,"uDpr"),u);for(let[x,p]of Object.entries(r))e.uniform3fv(e.getUniformLocation(o,`u${x[0].toUpperCase()}${x.slice(1)}`),k(p));e.drawArrays(e.TRIANGLES,0,3),t.setAttribute("data-haze-ready","")}},b=u=>{u.preventDefault(),d=!0,t.removeAttribute("data-haze-ready")},w=()=>{d=!1,f(),l(),m()};t.addEventListener("webglcontextlost",b),t.addEventListener("webglcontextrestored",w),l(),m();let T=new ResizeObserver(m);return T.observe(t),()=>{T.disconnect(),t.removeEventListener("webglcontextlost",b),t.removeEventListener("webglcontextrestored",w),t.removeAttribute("data-haze-ready"),f()}}var E=t=>Math.max(0,Math.min(1,t)),q=t=>{let r=E(t);return r*r*(3-2*r)},z=(t,r,e)=>E((t-r)/Math.max(1,e)),H=t=>q(t)*1.5-.22;function N(t,r,e){let o=H(r),a=E((o-t.x/Math.max(1,e))/.26),c=q(a);return{x:t.x+c*(24+t.seed*72),y:t.y+Math.sin(t.seed*91)*c*22-c*c*44,alpha:t.alpha*Math.sin(Math.PI*a)*Math.pow(1-a,1.8),released:o>=t.x/Math.max(1,e)}}function C(t,r){let e=r.getContext("2d",{alpha:!0}),o=document.createElement("canvas"),a=o.getContext("2d",{willReadFrequently:!0}),c=[],d=0,f=0,i=0,l=1,m="#ceced7",b=-1,w="";return!e||!a?null:{measure:(s=!1)=>{let n=t.getBoundingClientRect(),h=getComputedStyle(t),x=[n.width,n.height,h.fontSize,h.fontFamily,h.fontWeight,h.letterSpacing,window.devicePixelRatio].join("|");if(!s&&x===w||(w=x,d=n.width,f=n.height,!d||!f))return;i=Math.min(100,Math.max(36,d*.07)),l=Math.min(1.5,window.devicePixelRatio||1),m=h.color,r.width=o.width=Math.ceil((d+i*2)*l),r.height=o.height=Math.ceil((f+i*2)*l),r.style.width=`${d+i*2}px`,r.style.height=`${f+i*2}px`,r.style.left=r.style.top=`${-i}px`,a.setTransform(l,0,0,l,0,0),a.clearRect(0,0,d+i*2,f+i*2),a.font=`${h.fontWeight} ${h.fontSize} ${h.fontFamily}`,a.fillStyle=m,a.textBaseline="alphabetic",a.letterSpacing=h.letterSpacing,t.querySelectorAll("[data-vapour-word]").forEach(v=>{let g=v.getBoundingClientRect(),M=a.measureText(v.textContent||""),S=M.fontBoundingBoxAscent||parseFloat(h.fontSize)*.8,I=M.fontBoundingBoxDescent||parseFloat(h.fontSize)*.2,F=g.top-n.top+(g.height-S-I)/2+S;a.fillText(v.textContent||"",g.left-n.left+i,F+i)});let p=a.getImageData(0,0,o.width,o.height).data;c=[];let R=Math.max(2.5,Math.sqrt(d*f/22e3));for(let v=i;v<f+i;v+=R)for(let g=i;g<d+i;g+=R){let M=(Math.floor(v*l)*o.width+Math.floor(g*l))*4;if(p[M+3]<48)continue;let S=((Math.imul(Math.floor(g),374761393)^Math.imul(Math.floor(v),668265263))>>>0)/4294967295;c.push({x:g-i,y:v-i,alpha:p[M+3]/255,seed:S})}b=-1},render:s=>{let n=E(s);if(n===b)return;b=n,e.setTransform(l,0,0,l,0,0),e.clearRect(0,0,r.width/l,r.height/l);let h=H(n)*d;if(t.style.setProperty("--vapour-front",`${h}px`),!n||n===1){t.classList.toggle("is-vaporizing",n===1),r.style.opacity="0";return}e.fillStyle=m,c.forEach(x=>{let p=N(x,n,d);!p.released||p.alpha<.01||(e.globalAlpha=p.alpha,e.beginPath(),e.arc(p.x+i,p.y+i,.45+x.seed*.35,0,Math.PI*2),e.fill())}),e.globalAlpha=1,r.style.opacity="1",t.classList.add("is-vaporizing")},destroy(){c=[],t.classList.remove("is-vaporizing"),t.style.removeProperty("--vapour-front"),r.style.opacity="0",r.width=r.height=0}}}var V=document.querySelector(".case-haze-canvas");if(V){let t=A(V);window.addEventListener("pagehide",r=>{r.persisted||t?.()})}var y=window.HevenMotion,L=document.querySelector("[data-case-vapour]"),P=L?.querySelector("h1"),_=P?.querySelector("canvas");if(y&&L&&P&&_){let t=window.matchMedia("(prefers-reduced-motion: reduce)"),r=C(P,_);if(r){let e=0,o=1,a=!1,c=!1,d=()=>{a=!t.matches&&c,e=L.getBoundingClientRect().top+window.scrollY+28,o=Math.max(260,Math.min(window.innerHeight*.64,L.offsetHeight*.8)),a?r.measure():r.render(0)},f=y.subscribe({measure:d,render(m){return a&&r.render(z(m.y,e,o)),!1}}),i=()=>{c=!0,r.measure(!0),y.invalidate()};document.fonts.ready.then(i),t.addEventListener("change",y.invalidate);let l=new ResizeObserver(y.invalidate);l.observe(P),window.addEventListener("pagehide",m=>{m.persisted||(f(),l.disconnect(),t.removeEventListener("change",y.invalidate),r.destroy())},{once:!0})}}
