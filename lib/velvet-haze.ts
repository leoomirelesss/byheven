/** Static adaptation of the supplied Velvet Haze shader. No animation or pointer input. */
export const HEVEN_HAZE_PALETTE = {
  ink: '#0c0912', shadow: '#08060d', ember: '#49354f',
  violet: '#49358d', lavender: '#827294', silver: '#82788f',
};
export type HazePalette = typeof HEVEN_HAZE_PALETTE;
export function hexToRgb(hex: string): [number, number, number] {
  let value = hex.replace(/^#/, '');
  if (value.length === 3) value = value.split('').map(c => c + c).join('');
  if (!/^[a-f\d]{6}$/i.test(value)) return [0, 0, 0];
  return [0, 2, 4].map(i => parseInt(value.slice(i, i + 2), 16) / 255) as [number, number, number];
}
const VERTEX = `#version 300 es
void main(){
  vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));
  gl_Position=vec4(p*2.0-1.0,0.0,1.0);
}`;
export const STATIC_HAZE_FRAGMENT = `#version 300 es
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
}`;

export function createStaticVelvetHaze(canvas: HTMLCanvasElement, palette: HazePalette = HEVEN_HAZE_PALETTE, options: {fragment?: string; maxPixels?: number} = {}) {
  const gl = canvas.getContext('webgl2', {alpha: false, antialias: false, depth: false, powerPreference: 'low-power'});
  if (!gl) return null;
  let program: WebGLProgram | null = null, vao: WebGLVertexArrayObject | null = null;
  let lastSize = '', lost = false;
  const release = () => { if (program) gl.deleteProgram(program); if (vao) gl.deleteVertexArray(vao); program = vao = null; };
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { gl.deleteShader(shader); return null; }
    return shader;
  };
  const init = () => {
    const vertex = compile(gl.VERTEX_SHADER, VERTEX), fragment = compile(gl.FRAGMENT_SHADER, options.fragment ?? STATIC_HAZE_FRAGMENT);
    if (!vertex || !fragment) { if(vertex) gl.deleteShader(vertex); if(fragment) gl.deleteShader(fragment); return; }
    program = gl.createProgram();
    if (!program) { gl.deleteShader(vertex); gl.deleteShader(fragment); return; }
    gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
    gl.deleteShader(vertex); gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { release(); return; }
    vao = gl.createVertexArray(); lastSize = '';
  };
  const paint = () => {
    if (!program || lost) return;
    const dpr = Math.min(1.25, window.devicePixelRatio || 1);
    let width = Math.max(1, Math.round(canvas.clientWidth * dpr)), height = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (options.maxPixels && width * height > options.maxPixels) {
      const scale = Math.sqrt(options.maxPixels / (width * height));
      width = Math.max(1, Math.floor(width * scale)); height = Math.max(1, Math.floor(height * scale));
    }
    const size = `${width}:${height}:${dpr}`;
    if (size === lastSize) return;
    lastSize = size; canvas.width = width; canvas.height = height;
    gl.useProgram(program); gl.bindVertexArray(vao); gl.viewport(0, 0, width, height);
    gl.uniform2f(gl.getUniformLocation(program, 'uRes'), width, height);
    gl.uniform1f(gl.getUniformLocation(program, 'uDpr'), dpr);
    for (const [name, color] of Object.entries(palette)) gl.uniform3fv(gl.getUniformLocation(program, `u${name[0].toUpperCase()}${name.slice(1)}`), hexToRgb(color));
    gl.drawArrays(gl.TRIANGLES, 0, 3); canvas.setAttribute('data-haze-ready', '');
  };
  const onLost = (event: Event) => { event.preventDefault(); lost = true; canvas.removeAttribute('data-haze-ready'); };
  const onRestored = () => { lost = false; release(); init(); paint(); };
  canvas.addEventListener('webglcontextlost', onLost); canvas.addEventListener('webglcontextrestored', onRestored);
  init(); paint();
  const observer = new ResizeObserver(paint); observer.observe(canvas);
  return () => { observer.disconnect(); canvas.removeEventListener('webglcontextlost', onLost); canvas.removeEventListener('webglcontextrestored', onRestored); canvas.removeAttribute('data-haze-ready'); release(); };
}
