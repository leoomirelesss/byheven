var q={ink:"#0c0912",shadow:"#08060d",ember:"#49354f",violet:"#49358d",lavender:"#827294",silver:"#82788f"};function w(t){let n=t.replace(/^#/,"");return n.length===3&&(n=n.split("").map(i=>i+i).join("")),/^[a-f\d]{6}$/i.test(n)?[0,2,4].map(i=>parseInt(n.slice(i,i+2),16)/255):[0,0,0]}var T=`#version 300 es
void main(){
  vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));
  gl_Position=vec4(p*2.0-1.0,0.0,1.0);
}`,L=`#version 300 es
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
}`;function y(t,n=q,i={}){let e=t.getContext("webgl2",{alpha:!1,antialias:!1,depth:!1,powerPreference:"low-power"});if(!e)return null;let l=null,c=null,u="",f=!1,v=()=>{l&&e.deleteProgram(l),c&&e.deleteVertexArray(c),l=c=null},p=(o,r)=>{let a=e.createShader(o);return a?(e.shaderSource(a,r),e.compileShader(a),e.getShaderParameter(a,e.COMPILE_STATUS)?a:(e.deleteShader(a),null)):null},d=()=>{let o=p(e.VERTEX_SHADER,T),r=p(e.FRAGMENT_SHADER,i.fragment??L);if(!o||!r){o&&e.deleteShader(o),r&&e.deleteShader(r);return}if(l=e.createProgram(),!l){e.deleteShader(o),e.deleteShader(r);return}if(e.attachShader(l,o),e.attachShader(l,r),e.linkProgram(l),e.deleteShader(o),e.deleteShader(r),!e.getProgramParameter(l,e.LINK_STATUS)){v();return}c=e.createVertexArray(),u=""},m=()=>{if(!l||f)return;let o=Math.min(1.25,window.devicePixelRatio||1),r=Math.max(1,Math.round(t.clientWidth*o)),a=Math.max(1,Math.round(t.clientHeight*o));if(i.maxPixels&&r*a>i.maxPixels){let s=Math.sqrt(i.maxPixels/(r*a));r=Math.max(1,Math.floor(r*s)),a=Math.max(1,Math.floor(a*s))}let b=`${r}:${a}:${o}`;if(b!==u){u=b,t.width=r,t.height=a,e.useProgram(l),e.bindVertexArray(c),e.viewport(0,0,r,a),e.uniform2f(e.getUniformLocation(l,"uRes"),r,a),e.uniform1f(e.getUniformLocation(l,"uDpr"),o);for(let[s,A]of Object.entries(n))e.uniform3fv(e.getUniformLocation(l,`u${s[0].toUpperCase()}${s.slice(1)}`),w(A));e.drawArrays(e.TRIANGLES,0,3),t.setAttribute("data-haze-ready","")}},h=o=>{o.preventDefault(),f=!0,t.removeAttribute("data-haze-ready")},x=()=>{f=!1,v(),d(),m()};t.addEventListener("webglcontextlost",h),t.addEventListener("webglcontextrestored",x),d(),m();let g=new ResizeObserver(m);return g.observe(t),()=>{g.disconnect(),t.removeEventListener("webglcontextlost",h),t.removeEventListener("webglcontextrestored",x),t.removeAttribute("data-haze-ready"),v()}}var P={ink:"#0c0912",shadow:"#000000",ember:"#4b354c",violet:"#786495",lavender:"#a296ae",silver:"#91869e"},R=`#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uDpr;
uniform vec3 uInk, uShadow, uEmber, uViolet, uLavender, uSilver;
out vec4 frag;
float hash21(vec2 p){
  p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);
  return fract(p.x*p.y);
}
mat2 rotate2d(float a){float s=sin(a),c=cos(a);return mat2(c,-s,s,c);}
float noise(vec2 p){
  vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);
  return mix(mix(hash21(i),hash21(i+vec2(1,0)),u.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),u.x),u.y);
}
float fbm(vec2 p){
  float value=0.0,amplitude=.5;
  for(int i=0;i<4;i++){value+=amplitude*noise(p);p=rotate2d(.72)*p*2.03+4.17;amplitude*=.5;}
  return value;
}
void main(){
  vec2 uv=gl_FragCoord.xy/uRes;
  vec2 p=(gl_FragCoord.xy*2.0-uRes)/min(uRes.x,uRes.y);
  // Keep the reference's soft, overlapping veils; only its palette changes.
  vec2 q=p;
  q.x+=sin(q.y*2.0+3.24)*.22;
  q.y+=cos(q.x*1.7-2.52)*.16;
  float veilA=1.0-smoothstep(.04,.72,abs(q.y+sin(q.x*1.8+4.32)*.32));
  float veilB=1.0-smoothstep(.02,.62,abs(q.y*.85-cos(q.x*2.4-3.6)*.24));
  vec3 ribbon=mix(uViolet,uSilver,smoothstep(-1.1,1.2,q.x));
  vec3 color=uInk+ribbon*veilA*.46+uEmber*veilB*.28;
  color=mix(color,uLavender,veilA*veilB*.1);
  color+=(fbm(q*2.5+.72)-.5)*.018;
  // A black upper field lets the hero fade into neutral shadow, without a violet cast.
  float fromTop=1.0-uv.y;
  color=mix(uShadow,color,smoothstep(.02,.38,fromTop));
  color=mix(color,uInk,smoothstep(.7,1.0,fromTop));
  color+=(hash21(floor(gl_FragCoord.xy/max(uDpr,1.0)))-.5)*.008;
  frag=vec4(clamp(color,0.0,1.0),1.0);
}`;function E(t){return y(t,P,{fragment:R,maxPixels:62e4})}var S=document.querySelector(".case-detail-atmosphere canvas");if(S){let t=E(S);window.addEventListener("pagehide",n=>{n.persisted||t?.()})}
