import {createStaticVelvetHaze, type HazePalette} from './velvet-haze';

/** The supplied Aurora Veil, frozen at one exposure in BY HEVËN's ink/lavender palette. */
export const AURORA_PALETTE: HazePalette = {
  ink: '#0c0912', shadow: '#000000', ember: '#4b354c',
  violet: '#786495', lavender: '#a296ae', silver: '#91869e',
};
export const AURORA_FRAGMENT = `#version 300 es
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
}`;

export function createStaticAuroraVeil(canvas: HTMLCanvasElement) {
  return createStaticVelvetHaze(canvas, AURORA_PALETTE, {fragment:AURORA_FRAGMENT, maxPixels:620_000});
}
