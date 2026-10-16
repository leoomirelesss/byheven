import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

const sceneElement=document.querySelector('.flow-scene');
const viewer=document.querySelector('[data-phone-viewer]');
const host=viewer || sceneElement;
if(viewer) {
  let selected='home',back=false;
  const update=()=>{const image=viewer.querySelector('.viewer-fallback');if(image)image.src=`assets/phone/review-${back?'back':selected}.webp`;};
  document.querySelectorAll('[data-phone-view]').forEach(button=>button.addEventListener('click',()=>{back=button.dataset.phoneView==='back';update();}));
  document.querySelectorAll('[data-phone-screen]').forEach(button=>button.addEventListener('click',()=>{
    selected=['home','collection','product'][Number(button.dataset.phoneScreen)];update();
    document.querySelectorAll('[data-phone-screen]').forEach(control=>control.setAttribute('aria-pressed',String(control===button)));
  }));
}
if(host) init().catch(error=> {
  host.classList.remove('has-phone-3d');
  host.dataset.phoneState='fallback';
  const status=document.querySelector('[data-viewer-status]');
  if(status) status.textContent='Render del modelo. El giro interactivo requiere WebGL.';
  console.warn('Phone 3D: using static screen fallback.',error.message);
});

async function init() {
  const base=new URL('./',import.meta.url);
  const canvas=document.createElement('canvas'); canvas.className='flow-device-canvas'; canvas.setAttribute('aria-hidden','true');
  const renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setClearColor(0x000000,0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,1.5));
  renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping; renderer.toneMappingExposure=1.15;
  const scene=new T.Scene();
  const camera=new T.PerspectiveCamera(34,1,.1,40); camera.position.z=9;
  const pmrem=new T.PMREMGenerator(renderer), room=new RoomEnvironment();
  const environment=pmrem.fromScene(room,.04);
  scene.environment=environment.texture; scene.environmentIntensity=1.25;
  room.dispose(); pmrem.dispose();
  scene.add(new T.HemisphereLight(0xe8efff,0x171319,1.4));
  for(const [color,intensity,x,y,z] of [[0xffffff,5,-4,5,5],[0xd8dfff,3,5,1,-2],[0xffffff,2,0,-4,3]]) {
    const light=new T.DirectionalLight(color,intensity); light.position.set(x,y,z); scene.add(light);
  }
  const textures=[], loader=new T.TextureLoader();
  function loadScreen(index) {
    const names=['home','collection','product'];
    return loader.loadAsync(new URL(`screen-${names[index]}.webp`,base).href).then(texture=> {
      texture.colorSpace=T.SRGBColorSpace; texture.flipY=false;
      texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
      textures[index]=texture;
      renderer.initTexture(texture);
      return texture;
    });
  }
  const [gltf]=await Promise.all([
    new GLTFLoader().loadAsync(new URL('iphone-17-pro.glb',base).href),
    loadScreen(0), Promise.allSettled([loadScreen(1),loadScreen(2)]),
  ]);
  const phone=gltf.scene; scene.add(phone);
  let display;
  phone.traverse(mesh=>{if(mesh.isMesh && mesh.material?.name==='PLIEGUE Display') display=mesh;});
  if(!display) throw new Error('Display mesh missing');
  display.material.map?.dispose();
  display.material.toneMapped=false;
  display.material.map=textures[0]; display.material.needsUpdate=true;
  let pose={left:43,top:33,rx:0,ry:-24,rz:15,scale:1,index:0,px:0,py:0};
  let frame=0,visible=true,contextLost=false,disposed=false;
  let width=1,height=1,phonePixelWidth=280;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const schedule=()=> { if(!frame && visible && !document.hidden && !contextLost && !disposed) frame=requestAnimationFrame(draw); };
  function draw() {
    frame=0;
    if(disposed || contextLost) return;
    const pixelWidth=viewer ? Math.min(width*.6,height*.33,350) : phonePixelWidth;
    const unit=2*camera.position.z*Math.tan(T.MathUtils.degToRad(camera.fov/2))/height;
    const centerX=viewer ? width/2 : width*pose.left/100+pixelWidth/2+(pose.px||0);
    const centerY=viewer ? height/2 : height*pose.top/100+pixelWidth*2.07/2+(pose.py||0);
    phone.position.set((centerX-width/2)*unit,(height/2-centerY)*unit,0);
    phone.scale.setScalar(pixelWidth/2*unit*pose.scale);
    phone.rotation.set(T.MathUtils.degToRad(pose.rx),T.MathUtils.degToRad(pose.ry),T.MathUtils.degToRad(-pose.rz),'XYZ');
    const texture=textures[pose.index] || textures[0];
    if(display.material.map!==texture) display.material.map=texture;
    renderer.render(scene,camera);
    host.dataset.phoneScreen=String(pose.index);
    host.dataset.phoneAngle=pose.ry.toFixed(2);
  }
  function resize() {
    const rect=host.getBoundingClientRect(), nextWidth=Math.max(1,rect.width), nextHeight=Math.max(1,rect.height);
    const nextPhoneWidth=sceneElement?.querySelector('.flow-phone-position')?.offsetWidth || 280;
    if(width===nextWidth && height===nextHeight && phonePixelWidth===nextPhoneWidth) return;
    width=nextWidth; height=nextHeight; phonePixelWidth=nextPhoneWidth;
    renderer.setSize(width,height,false); camera.aspect=width/height; camera.updateProjectionMatrix(); schedule();
  }
  function onPose(event) {
    if(viewer) return;
    pose={...pose,...event.detail};
    if(visible && !document.hidden && !contextLost && !disposed) {
      cancelAnimationFrame(frame); frame=0;
      draw();
    }
  }
  function onVisibility() {
    if(document.hidden) { cancelAnimationFrame(frame); frame=0; }
    else schedule();
  }
  canvas.addEventListener('webglcontextlost',event=> {
    event.preventDefault(); contextLost=true; host.classList.remove('has-phone-3d'); host.dataset.phoneState='fallback';
  });
  canvas.addEventListener('webglcontextrestored',()=> { contextLost=false; host.classList.add('has-phone-3d'); host.dataset.phoneState='ready'; schedule(); });
  host.append(canvas);
  const observer=new ResizeObserver(resize); observer.observe(host);
  const intersection=new IntersectionObserver(entries=> { visible=entries[0].isIntersecting; if(visible) schedule(); }); intersection.observe(host);
  window.addEventListener('flow:pose',onPose);
  document.addEventListener('visibilitychange',onVisibility);
  resize();
  if(viewer) {
    pose={...pose,rx:3,ry:-22,rz:6};
    let drag=null;
    host.addEventListener('pointerdown',event=> { if(reduced.matches) return; drag={x:event.clientX,y:event.clientY,ry:pose.ry,rx:pose.rx}; host.setPointerCapture(event.pointerId); });
    host.addEventListener('pointermove',event=> { if(!drag) return; pose.ry=drag.ry+(event.clientX-drag.x)*.5; pose.rx=Math.max(-45,Math.min(45,drag.rx+(event.clientY-drag.y)*.25)); schedule(); });
    const end=()=> { drag=null; }; host.addEventListener('pointerup',end); host.addEventListener('pointercancel',end);
    document.querySelectorAll('[data-phone-view]').forEach(button=>button.addEventListener('click',()=> { pose.ry=button.dataset.phoneView==='back' ? 158 : -22; pose.rx=3; schedule(); }));
    document.querySelectorAll('[data-phone-screen]').forEach(button=>button.addEventListener('click',()=> {
      pose.index=Number(button.dataset.phoneScreen);
      document.querySelectorAll('[data-phone-screen]').forEach(control=>control.setAttribute('aria-pressed',String(control===button))); schedule();
    }));
    const status=document.querySelector('[data-viewer-status]'); if(status) status.textContent='Arrastra para girar el teléfono.';
  } else window.dispatchEvent(new Event('flow:ready'));
  draw(); host.classList.add('has-phone-3d'); host.dataset.phoneState='ready';
  window.addEventListener('pagehide',event=> {
    if(event.persisted) return;
    disposed=true; cancelAnimationFrame(frame); observer.disconnect(); intersection.disconnect();
    window.removeEventListener('flow:pose',onPose); document.removeEventListener('visibilitychange',onVisibility);
    phone.traverse(object=> { object.geometry?.dispose(); if(object.material) { for(const material of [].concat(object.material)) material.dispose(); } });
    textures.forEach(texture=>texture.dispose()); environment.dispose(); renderer.dispose();
  },{once:true});
}

